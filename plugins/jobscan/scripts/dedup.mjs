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
 *   node dedup.mjs --stats                              # index/cache summary
 *
 * INDEX PATH: set JOBSCAN_INDEX to your "Applied Index.md". Defaults to
 * ./Applied Index.md, then ../Applied Index.md.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(HERE, 'seen-urls.json');

function resolveIndex() {
  if (process.env.JOBSCAN_INDEX) return resolve(process.env.JOBSCAN_INDEX);
  for (const p of [join(process.cwd(), 'Applied Index.md'), join(process.cwd(), '..', 'Applied Index.md')]) {
    if (existsSync(p)) return p;
  }
  return join(process.cwd(), 'Applied Index.md');
}
const INDEX_PATH = resolveIndex();

const RECORD = process.argv.includes('--record');
const STATS = process.argv.includes('--stats');
const vi = process.argv.indexOf('--verdict');
const WANT = vi > -1 ? process.argv[vi + 1].split(',') : ['new', 'adjacent'];

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
  if (!existsSync(CACHE_PATH)) return {};
  try { return JSON.parse(readFileSync(CACHE_PATH, 'utf8')); } catch { return {}; }
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
    if (RECORD && c.url && (r.verdict === 'duplicate' || r.verdict === 'seen')) {
      cache[c.url] = { verdict: r.verdict, date: today, title: c.title, employer: c.employer };
    }
  }

  console.error(`dedup: ${cands.length} in -> new ${counts.new}, adjacent ${counts.adjacent}, duplicate ${counts.duplicate}, seen ${counts.seen}`);
  if (RECORD) {
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
    console.error(`dedup: cache updated (${Object.keys(cache).length} entries)`);
  }
  console.log(JSON.stringify(out, null, 2));
});
