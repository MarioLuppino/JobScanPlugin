#!/usr/bin/env node
/**
 * dedup.mjs — screen candidates against your applied-index and a persistent
 * seen-URL cache, in the shell, BEFORE anything is fetched or enters context.
 *
 * Replaces two things that are otherwise done as AI reasoning (and paid for in
 * tokens every single scan):
 *   1. duplicate screening against packets you already built
 *   2. re-judging postings a previous scan already rejected
 *
 * Verdicts, written to each candidate as `_verdict`:
 *   new        - not seen, not a duplicate. Proceed.
 *   adjacent   - same employer, different role. Surface once; default is skip.
 *   duplicate  - employer + role already has a packet. Hard exclude.
 *   seen       - a previous scan already judged this URL. Skip silently.
 *
 *   cat candidates.json | node dedup.mjs                # new + adjacent
 *   cat candidates.json | node dedup.mjs --record       # also update the cache
 *   cat judged.json | node dedup.mjs --record --record-verdict passed
 *   node dedup.mjs --stats                              # index/cache summary
 *
 * WHAT --record ALONE RECORDS, and why the second form exists. Plain --record
 * caches only what this script itself decided: duplicates and prior cache hits.
 * A posting the SCAN looked at and passed on is invisible to it, so that posting
 * is re-fetched and re-judged every week forever -- exactly the cost the cache
 * was built to remove. --record-verdict lets the scan write back what it actually
 * concluded, once, at the end of a run.
 *
 * Record ONLY postings that were genuinely judged: deep-verified and scored below
 * the fit floor, or shown to the user and declined. Never record a listing that
 * was merely surfaced and not examined -- a shallow shortlist entry, anything in
 * a discovery sweep. A cached verdict is permanent and silent, so recording an
 * unexamined posting deletes it from every future scan without anyone deciding to.
 *
 * PATHS: the applied index comes from $JOBSCAN_INDEX, else archive_path in
 * ~/.claude/jobscan-data/jobscan-config.md, else the working directory. The
 * seen-URL cache lives in <data_path>/ats/, never under the plugin root, which
 * an update replaces. See paths.mjs.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readPath, writePath, archivePath } from './paths.mjs';

const CACHE_IN = readPath('seen-urls.json');
const INDEX_PATH = archivePath('Applied Index.md', 'JOBSCAN_INDEX');

const RECORD = process.argv.includes('--record');
const STATS = process.argv.includes('--stats');
const rv = process.argv.indexOf('--record-verdict');
const RECORD_VERDICT = rv > -1 ? process.argv[rv + 1] : null;
const vi = process.argv.indexOf('--verdict');
const WANT = vi > -1 ? process.argv[vi + 1].split(',') : ['new', 'adjacent'];

/** Verdicts a caller may write back. Anything else is a typo, and a typo here
 *  would silently bury postings under a verdict nothing ever reads. */
const RECORDABLE = new Set(['passed']);
if (RECORD_VERDICT && !RECORDABLE.has(RECORD_VERDICT)) {
  console.error(`dedup: --record-verdict ${RECORD_VERDICT} is not one of: ${[...RECORDABLE].join(', ')}`);
  process.exit(1);
}
if (RECORD_VERDICT && !RECORD) {
  console.error('dedup: --record-verdict does nothing without --record');
  process.exit(1);
}

/** Words carrying no matching signal in an employer or role string. */
const STOP = new Set([
  'the', 'of', 'and', 'a', 'an', 'for', 'at', 'in', 'to', 'inc', 'llc', 'ltd', 'co',
  'corp', 'corporation', 'company', 'group', 'department', 'dept', 'state', 'us',
  'usa', 'national', 'university', 'senior', 'sr', 'junior', 'jr', 'i', 'ii', 'iii',
  'iv', 'v', 'associate', 'assistant', 'staff', 'lead', 'principal',
]);

/**
 * Industry filler that appears in a large share of employer names. Two employers
 * sharing ONLY these are not the same employer. Without this guard, names like
 * "Resource Environmental Solutions" and "Sapphos Environmental" collide on the
 * single word "environmental" and a genuinely new employer gets suppressed.
 * ADD your own field's filler words here.
 */
const GENERIC_EMPLOYER = new Set([
  'environmental', 'environment', 'services', 'service', 'solutions', 'systems',
  'technologies', 'technology', 'sciences', 'science', 'scientific', 'research',
  'institute', 'center', 'centre', 'consulting', 'consultants', 'engineering',
  'international', 'global', 'holdings', 'partners', 'associates', 'resources',
  'resource', 'management', 'health', 'medical', 'financial', 'digital', 'labs',
]);

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));

function overlap(a, b) {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  return a.filter((w) => setB.has(w)).length / Math.min(a.length, b.length);
}

/** Employer identity needs a DISTINCTIVE shared token, not just industry filler. */
function sameEmployer(a, b) {
  if (!a.length || !b.length) return false;
  const setB = new Set(b);
  const shared = a.filter((w) => setB.has(w));
  if (!shared.length) return false;
  if (!shared.some((w) => !GENERIC_EMPLOYER.has(w))) return false;
  return shared.length / Math.min(a.length, b.length) >= 0.5;
}

/** Parse the markdown table in Applied Index.md into {employer, role} rows. */
export function loadAppliedIndex(path = INDEX_PATH) {
  if (!existsSync(path)) {
    console.error(`dedup: WARNING no applied index at ${path}; duplicate screening is disabled`);
    return [];
  }
  const rows = [];
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('|') || /^\|\s*-+/.test(t)) continue;
    const cells = t.split('|').map((c) => c.trim()).filter((c, i, a) => i !== 0 && i !== a.length - 1);
    if (cells.length < 3 || /^N$/i.test(cells[0])) continue;
    const [n, employer, role] = cells;
    if (!employer || employer === '—' || employer === '-') continue;
    rows.push({ n, employer, role, eTok: norm(employer), rTok: norm(role) });
  }
  return rows;
}

const loadCache = () => {
  if (!CACHE_IN) return {};
  try { return JSON.parse(readFileSync(CACHE_IN.path, 'utf8')); } catch { return {}; }
};

const index = loadAppliedIndex();
const cache = loadCache();

if (STATS) {
  console.error(`Applied index: ${INDEX_PATH}`);
  console.error(`  rows: ${index.length}`);
  console.error(`  seen-URL cache: ${Object.keys(cache).length} entries`);
  process.exit(0);
}

export function screen(cand, idx = index, seen = cache) {
  if (cand.url && seen[cand.url]) {
    return { verdict: 'seen', reason: `already judged ${seen[cand.url].verdict} on ${seen[cand.url].date}` };
  }
  const eTok = norm(cand.employer);
  const rTok = norm(cand.title);
  let adjacent = null;
  for (const row of idx) {
    if (!sameEmployer(eTok, row.eTok)) continue;
    if (overlap(rTok, row.rTok) >= 0.6) {
      return { verdict: 'duplicate', reason: `packet ${row.n} already covers ${row.employer} / ${row.role}` };
    }
    adjacent ??= { verdict: 'adjacent', reason: `same employer as packet ${row.n} (${row.employer}), different role` };
  }
  return adjacent || { verdict: 'new', reason: 'no prior packet or cache entry' };
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let cands;
  try { cands = JSON.parse(raw); } catch { console.error('dedup: stdin is not valid JSON'); process.exit(1); }
  if (!Array.isArray(cands)) cands = cands.jobs || [];

  const counts = { new: 0, duplicate: 0, adjacent: 0, seen: 0 };
  const out = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const c of cands) {
    const r = screen(c);
    counts[r.verdict]++;
    if (WANT.includes(r.verdict)) out.push({ ...c, _dedup: r.reason, _verdict: r.verdict });
    // A posting this script already recognised keeps its own verdict and its
    // original date; --record-verdict only supplies one for the rest.
    const natural = (r.verdict === 'duplicate' || r.verdict === 'seen') ? r.verdict : null;
    const record = natural || RECORD_VERDICT;
    if (RECORD && c.url && record) {
      cache[c.url] = { verdict: record, date: today, title: c.title, employer: c.employer };
    }
  }

  console.error(`dedup: ${cands.length} in -> new ${counts.new}, adjacent ${counts.adjacent}, duplicate ${counts.duplicate}, seen ${counts.seen}`);
  if (RECORD_VERDICT) console.error(`dedup: recording ${counts.new + counts.adjacent} as "${RECORD_VERDICT}" — they will not be surfaced again`);
  if (RECORD) {
    const out = writePath('seen-urls.json');
    writeFileSync(out, JSON.stringify(cache, null, 2) + '\n');
    console.error(`dedup: cache updated (${Object.keys(cache).length} entries) at ${out}`);
  }
  console.log(JSON.stringify(out, null, 2));
});
