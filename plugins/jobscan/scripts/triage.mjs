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
 * CONFIGURE: copy triage-config.example.json to triage-config.json and edit it.
 * The example ships with generic defaults; the matchTitlePatterns are the ones
 * you must replace with your own field's titles.
 *
 * Module:  import { triage, triageAll } from './triage.mjs'
 * CLI:     cat jobs.json | node triage.mjs [--verdict match,review]
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

function loadConfig() {
  const custom = join(HERE, 'triage-config.json');
  const example = join(HERE, 'triage-config.example.json');
  const path = existsSync(custom) ? custom : example;
  if (path === example) {
    console.error(
      'triage: using triage-config.example.json (generic defaults).\n' +
      '        Copy it to triage-config.json and replace matchTitlePatterns with your field\'s titles,\n' +
      '        or almost nothing will match.'
    );
  }
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const re = (arr) => (arr || []).map((s) => new RegExp(s, 'i'));
  return {
    salaryFloor: typeof raw.salaryFloor === 'number' ? raw.salaryFloor : 0,
    match: re(raw.matchTitlePatterns),
    exclude: re(raw.excludeTitlePatterns),
    generic: raw.genericTitlePattern ? new RegExp(raw.genericTitlePattern, 'i') : null,
    sectors: new Set(raw.relevantSectors || []),
    locationHint: raw.locationHintPattern ? new RegExp(raw.locationHintPattern, 'i') : null,
  };
}

const CFG = loadConfig();

/**
 * @param {{title:string, location?:string, employer?:string, sector?:string, salaryMin?:number|null}} job
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
