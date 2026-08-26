#!/usr/bin/env node
/**
 * salary.mjs — pull a comparable annual minimum out of whatever shape an ATS
 * feed happens to publish compensation in.
 *
 * WHY THIS EXISTS: the salary floor is the most common hard gate, and until this
 * existed no adapter in fetch-ats.mjs reported a salary at all. triage.mjs has
 * always had the check -- it simply never fired, so every below-floor posting
 * survived the free stage and was rejected later, after a full fetch. This makes
 * the zero-token stage able to reject a whole class of postings it was letting
 * through.
 *
 * These endpoints are public but undocumented, and each ATS names its fields
 * differently -- some publish a range only when the employer opts in, some not at
 * all. So this does not hard-code one shape per ATS: it walks the posting for any
 * recognisable {amount, interval} pair and normalises it. A feed that changes its
 * key names degrades to "no salary reported", which is the safe direction.
 *
 * TWO RULES, both about never inventing a number:
 *   1. An ambiguous figure returns null, not a guess. "45" with no stated period
 *      could be hourly or thousands-per-year; a wrong reading silently discards a
 *      good posting, which is far more expensive than one extra fetch.
 *   2. Where a posting reports several minimums (location tiers, salary bands),
 *      the HIGHEST is returned. The gate asks "can this posting possibly clear the
 *      floor", so the most favourable reading of the employer's own floor is the
 *      one that avoids false rejections.
 *
 * Module: import { salaryMinFrom, toAnnual } from './salary.mjs'
 */

/** Work-hours-per-year conversions. Standard US full-time assumptions. */
const PER_YEAR = { hour: 2080, day: 260, week: 52, biweek: 26, semimonth: 24, month: 12, year: 1 };

/**
 * Below this, an annualised figure means the period was misread, not that the job
 * pays that little. Above it, no real posting.
 */
const FLOOR_SANITY = 5000;
const CEIL_SANITY = 10_000_000;

/**
 * With no stated period, a figure this large cannot be an hourly, daily or weekly
 * rate, so reading it as annual is safe. Anything smaller is ambiguous and is
 * discarded rather than guessed.
 */
const ASSUME_ANNUAL_ABOVE = 15000;

/** Keys whose value is the low end of a pay range. */
const MIN_KEYS = /^(min|minimum|min_?value|minvalue|salary_?from|salaryfrom|pay_?range_?min|payrangemin|amount_?min|from|low|start)$/i;
/** Keys whose value is the low end of a pay range, expressed in cents. */
const MIN_CENTS_KEYS = /^(min_?cents|minimum_?cents|min_?value_?cents)$/i;
/** Keys whose value names the pay period. */
const INTERVAL_KEYS = /^(interval|period|pay_?period|payperiod|unit|frequency|compensation_?interval|currency_?interval|rate_?type)$/i;
/** Keys whose value says what KIND of compensation this is (salary vs equity vs bonus). */
const TYPE_KEYS = /^(compensation_?type|comp_?type|type|kind)$/i;

/** Containers worth descending into. Anything else is skipped, so a posting's
 *  description text can never be mined for stray numbers. */
const CONTAINER_KEYS = /(compensation|salary|pay|remuneration|comp_?tier|summary_?component|range|band)/i;

const MAX_DEPTH = 5;

/**
 * Map a period string onto a per-year multiplier.
 * @returns {number|null} null when the string names no period we recognise.
 */
export function periodMultiplier(raw) {
  const s = String(raw ?? '').toLowerCase();
  if (!s) return null;
  if (/bi[-_\s]?week|every[-_\s]?other[-_\s]?week|fortnight/.test(s)) return PER_YEAR.biweek;
  if (/semi[-_\s]?month|twice[-_\s]?(a[-_\s]?)?month/.test(s)) return PER_YEAR.semimonth;
  if (/hour|hourly|\bhr\b|per[-_\s]?hour/.test(s)) return PER_YEAR.hour;
  if (/\bday\b|daily|per[-_\s]?diem|per[-_\s]?day/.test(s)) return PER_YEAR.day;
  if (/week/.test(s)) return PER_YEAR.week;
  if (/month|\bmo\b|monthly/.test(s)) return PER_YEAR.month;
  if (/year|annual|annum|\byr\b/.test(s)) return PER_YEAR.year;
  return null;
}

/**
 * Normalise one reported figure to an annual amount.
 * @param {number} amount
 * @param {string|null} interval  the period string as the feed wrote it
 * @returns {number|null} null when the pair cannot be read without guessing
 */
export function toAnnual(amount, interval) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  const mult = periodMultiplier(interval);
  // No period stated: only a figure too large to be a short-period rate is safe
  // to read as annual. See ASSUME_ANNUAL_ABOVE.
  const annual = mult === null
    ? (amount >= ASSUME_ANNUAL_ABOVE ? amount : null)
    : amount * mult;
  if (annual === null) return null;
  return annual >= FLOOR_SANITY && annual <= CEIL_SANITY ? Math.round(annual) : null;
}

/** True for a compensation component that is not base pay (equity, bonus, ...). */
function isNonSalaryComponent(node) {
  for (const [k, v] of Object.entries(node)) {
    if (!TYPE_KEYS.test(k) || typeof v !== 'string') continue;
    if (/equity|stock|option|bonus|commission|benefit/i.test(v)) return true;
  }
  return false;
}

/** Collect every readable annual minimum in one object level. */
function harvestLevel(node, out) {
  if (isNonSalaryComponent(node)) return;
  let interval = null;
  for (const [k, v] of Object.entries(node)) {
    if (INTERVAL_KEYS.test(k) && (typeof v === 'string' || typeof v === 'number')) interval ??= String(v);
  }
  for (const [k, v] of Object.entries(node)) {
    if (typeof v !== 'number') continue;
    if (MIN_CENTS_KEYS.test(k)) {
      const a = toAnnual(v / 100, interval);
      if (a !== null) out.push(a);
    } else if (MIN_KEYS.test(k)) {
      const a = toAnnual(v, interval);
      if (a !== null) out.push(a);
    }
  }
}

function walk(node, out, depth, entered) {
  if (!node || typeof node !== 'object' || depth > MAX_DEPTH) return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, out, depth, entered);
    return;
  }
  if (entered) harvestLevel(node, out);
  for (const [k, v] of Object.entries(node)) {
    if (!v || typeof v !== 'object') continue;
    // Descend only through keys that plausibly hold pay data. The top level is
    // always searched; below it, an unrelated subtree is never mined for numbers.
    if (entered || CONTAINER_KEYS.test(k)) walk(v, out, depth + 1, true);
  }
}

/**
 * The annual minimum a posting reports, or null when it reports none we can read.
 *
 * @param {object} raw  the posting object exactly as the ATS returned it
 * @returns {number|null}
 */
export function salaryMinFrom(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const found = [];
  // The top level is harvested directly (Paylocity-style flat PayRangeMin), then
  // every pay-shaped container below it.
  harvestLevel(raw, found);
  walk(raw, found, 0, false);
  if (!found.length) return null;
  return Math.max(...found); // see rule 2 in the header
}
