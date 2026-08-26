#!/usr/bin/env node
/**
 * triage.mjs — zero-token title/location/salary triage.
 *
 * WHY THIS EXISTS: pulling a job board returns hundreds of postings, and most are
 * wrong for you. Judging them by loading each one into an AI context costs tokens
 * for every rejection. This filters in the shell first, so only plausible roles
 * ever reach the expensive stage. Measured on a real board pull: ~1,950 postings
 * in, ~87% rejected before anything entered context.
 *
 * Verdicts:
 *   match   - strong domain signal in the title; pull the full posting
 *   review  - plausible but ambiguous (generic title at a relevant employer, or a
 *             domain title in a location you can't easily work); pull if needed
 *   exclude - wrong tier, wrong field, or fails a hard gate; never fetched
 *
 * The gates run on what the feed itself reports -- title, location, and (via
 * salary.mjs) a pay range and a posting date where the ATS publishes them. A
 * posting that states neither is never rejected for lacking them: a missing value
 * costs one fetch, a guessed one silently discards a job the user wanted.
 *
 * CONFIGURE: your triage-config.json lives in <data_path>/ats/ (see paths.mjs),
 * NOT next to this file — the plugin folder is replaced on update. Onboarding
 * writes it. The example here ships with generic defaults; the matchTitlePatterns
 * are the ones that must be replaced with your own field's titles.
 *
 * Module:  import { triage, triageAll } from './triage.mjs'
 * CLI:     cat jobs.json | node triage.mjs [--verdict match,review]
 */

import { readFileSync } from 'node:fs';
import { readPath, ATS_DIR } from './paths.mjs';

function loadConfig() {
  const found = readPath('triage-config.json', 'triage-config.example.json');
  if (!found) {
    console.error('triage: no triage-config.json and no example to fall back on. Re-run jobscan-onboarding.');
    process.exit(1);
  }
  if (found.isExample) {
    console.error(
      'triage: using triage-config.example.json (generic defaults).\n' +
      `        Write your own to ${ATS_DIR}/triage-config.json with your field's\n` +
      '        matchTitlePatterns, or almost nothing will match.'
    );
  }
  const raw = JSON.parse(readFileSync(found.path, 'utf8'));
  const re = (arr) => (arr || []).map((s) => new RegExp(s, 'i'));
  return {
    salaryFloor: typeof raw.salaryFloor === 'number' ? raw.salaryFloor : 0,
    maxAgeDays: typeof raw.maxAgeDays === 'number' && raw.maxAgeDays > 0 ? raw.maxAgeDays : 0,
    match: re(raw.matchTitlePatterns),
    exclude: re(raw.excludeTitlePatterns),
    generic: raw.genericTitlePattern ? new RegExp(raw.genericTitlePattern, 'i') : null,
    sectors: new Set(raw.relevantSectors || []),
    locationHint: raw.locationHintPattern ? new RegExp(raw.locationHintPattern, 'i') : null,
  };
}

const CFG = loadConfig();

/**
 * Age of a posting in whole days, or null when the feed stated no usable date.
 * Feeds disagree about what the date means -- Greenhouse reports last-updated
 * rather than first-posted -- so this errs young, which keeps borderline postings
 * rather than dropping them.
 */
export function ageInDays(posted, now = Date.now()) {
  if (!posted) return null;
  const t = new Date(posted).getTime();
  if (!Number.isFinite(t)) return null;
  const days = Math.floor((now - t) / 86400000);
  return days >= 0 ? days : 0;
}

/**
 * @param {{title:string, location?:string, employer?:string, sector?:string, salaryMin?:number|null, posted?:string|null}} job
 * @returns {{verdict:'match'|'review'|'exclude', reason:string}}
 */
export function triage(job, cfg = CFG) {
  const title = (job.title || '').trim();
  if (!title) return { verdict: 'exclude', reason: 'no title' };

  // Hard rejects win over everything, including a domain match. A title like
  // "<your field> Technician" is still the wrong tier.
  for (const re of cfg.exclude) {
    if (re.test(title)) return { verdict: 'exclude', reason: `reject pattern ${re.source.slice(0, 40)}` };
  }

  // Only gate on a salary the feed actually reported. Never infer a missing one:
  // a guessed number silently discards good postings.
  if (typeof job.salaryMin === 'number' && job.salaryMin > 0 && job.salaryMin < cfg.salaryFloor) {
    return { verdict: 'exclude', reason: `salary ${job.salaryMin} below floor ${cfg.salaryFloor}` };
  }

  // A posting far past its date is usually filled or closed, and confirming that
  // costs a full fetch. Off by default (maxAgeDays 0): a cutoff set too tight
  // discards live roles, and long public-sector hiring cycles are normal.
  if (cfg.maxAgeDays) {
    const age = ageInDays(job.posted);
    if (age !== null && age > cfg.maxAgeDays) {
      return { verdict: 'exclude', reason: `posted ${age}d ago, past the ${cfg.maxAgeDays}d cutoff` };
    }
  }

  const loc = job.location || '';
  const workable = !loc || !cfg.locationHint || cfg.locationHint.test(loc);
  const domainHit = cfg.match.find((re) => re.test(title));

  if (domainHit) {
    return workable
      ? { verdict: 'match', reason: `domain title: ${domainHit.source.slice(0, 40)}` }
      : { verdict: 'review', reason: 'domain title but location may need visa/relocation' };
  }

  if (cfg.generic && cfg.generic.test(title) && cfg.sectors.has(job.sector) && workable) {
    return { verdict: 'review', reason: `generic title at ${job.sector} employer` };
  }

  return { verdict: 'exclude', reason: 'no domain signal in title' };
}

/** Split an array of jobs into the three buckets. */
export function triageAll(jobs, cfg = CFG) {
  const out = { match: [], review: [], exclude: [] };
  for (const j of jobs) {
    const t = triage(j, cfg);
    out[t.verdict].push({ ...j, _triage: t.reason });
  }
  return out;
}

// ---- CLI ----
if (process.argv[1]?.endsWith('triage.mjs')) {
  const i = process.argv.indexOf('--verdict');
  const want = i > -1 ? process.argv[i + 1].split(',') : ['match', 'review'];
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (raw += d));
  process.stdin.on('end', () => {
    let jobs;
    try { jobs = JSON.parse(raw); } catch { console.error('triage: stdin is not valid JSON'); process.exit(1); }
    if (!Array.isArray(jobs)) jobs = jobs.jobs || [];
    const b = triageAll(jobs);
    console.error(`triage: ${jobs.length} in -> match ${b.match.length}, review ${b.review.length}, excluded ${b.exclude.length}`);
    console.log(JSON.stringify(want.flatMap((w) => b[w] || []), null, 2));
  });
}
