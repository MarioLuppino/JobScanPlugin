#!/usr/bin/env node
/**
 * calibrate.mjs — turn recorded outcomes into evidence about your own rules.
 *
 * Your applied-index carries a Fit score for every packet. Without reading it
 * back, that score is opinion: there is no way to know whether an 85 really
 * outperforms a 70, and no way to catch a gate that is quietly discarding roles
 * you would have wanted. Gates fail SILENTLY -- you never see what they removed --
 * so recorded outcomes are the only instrument that can find a bad one.
 *
 * Reports:
 *   - how much outcome data actually exists (usually the real finding)
 *   - conversion rate by fit-score band
 *   - rules contradicted by outcomes, which are BUGS, not preferences
 *
 * It refuses to present noise as signal: under a minimum sample it says so
 * rather than drawing conclusions from three rows.
 *
 *   node calibrate.mjs
 *   node calibrate.mjs --index "path/to/Applied Index.md"
 *
 * Index path: --index, else $JOBSCAN_INDEX, else ./Applied Index.md, else ../
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function defaultIndex() {
  for (const p of [join(process.cwd(), 'Applied Index.md'), join(process.cwd(), '..', 'Applied Index.md')]) {
    if (existsSync(p)) return p;
  }
  return join(process.cwd(), 'Applied Index.md');
}
const ai = process.argv.indexOf('--index');
const INDEX = ai > -1 ? process.argv[ai + 1] : process.env.JOBSCAN_INDEX || defaultIndex();

/** Below this many resolved outcomes, report data collection, not conclusions. */
const MIN_SAMPLE = 8;

const POSITIVE = /(interview|offer|accept|advanc|screen)/i;
const NEGATIVE = /(reject|declin|no response|ghost|closed|withdraw|not select)/i;

function parseIndex(path) {
  if (!existsSync(path)) {
    console.error(`calibrate: no applied index at ${path}`);
    console.error('Pass --index "path/to/Applied Index.md" or set JOBSCAN_INDEX.');
    process.exit(1);
  }
  const rows = [];
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('|') || /^\|\s*-+/.test(t)) continue;
    const c = t.split('|').map((x) => x.trim()).filter((x, i, a) => i !== 0 && i !== a.length - 1);
    if (c.length < 3 || /^N$/i.test(c[0])) continue;
    const [n, employer, role, status = '', filed = '', fit = '', outcome = ''] = c;
    if (!employer || employer === '—' || employer === '-') continue;
    const clean = (s) => s.replace(/\*\*/g, '').trim();
    rows.push({
      n, employer: clean(employer), role: clean(role),
      status: clean(status).toLowerCase(), filed: clean(filed),
      fit: /^\d+$/.test(clean(fit)) ? Number(clean(fit)) : null,
      outcome: clean(outcome),
    });
  }
  return rows;
}

const rows = parseIndex(INDEX);
const resolved = rows.filter((r) => r.outcome && r.outcome !== '—' && r.outcome !== '-');
const positive = resolved.filter((r) => POSITIVE.test(r.outcome));
const negative = resolved.filter((r) => NEGATIVE.test(r.outcome));
const scored = rows.filter((r) => typeof r.fit === 'number');

const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(0)}%` : 'n/a');
const line = (s = '') => console.log(s);

line('\n═══ CALIBRATION REPORT ═══');
line(`Index: ${INDEX}`);
line();

// Empty index is a normal first-run state, not a problem to report on. Telling a
// brand-new user to "backfill outcomes" they do not have is worse than useless.
if (!rows.length) {
  line('  No packets recorded yet -- nothing to calibrate.');
  line();
  line('  This becomes useful once you have applied to a few roles AND recorded');
  line('  what happened to them. The loop is:');
  line('    1. scan and apply');
  line('    2. append a row to Applied Index.md with the fit score');
  line('    3. fill in Outcome when you hear back (including "no response")');
  line('    4. re-run this to see whether your scoring actually predicts anything');
  line();
  line('  Recording the fit score at apply time is the part people skip, and it is');
  line('  the part that makes the rest work.');
  line();
  process.exit(0);
}

line('── Data coverage ──');
line(`  Packets recorded:        ${rows.length}`);
line(`  With a fit score:        ${scored.length}  (${pct(scored.length, rows.length)})`);
line(`  With a recorded outcome: ${resolved.length}  (${pct(resolved.length, rows.length)})`);
if (resolved.length < rows.length) {
  const missing = rows.length - resolved.length;
  line(`  ⚠ ${missing} packet${missing === 1 ? '' : 's'} have no outcome recorded.`);
  line('    Every blank is a data point permanently lost. Outcomes are the only');
  line('    thing that can tell you whether your scoring is right.');
}
line();

if (resolved.length) {
  line('── Outcomes ──');
  const dist = {};
  for (const r of resolved) dist[r.outcome] = (dist[r.outcome] || 0) + 1;
  Object.entries(dist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => line(`  ${String(v).padStart(3)}  ${k}`));
  line(`  positive signal: ${positive.length}, negative: ${negative.length}`);
  line();
}

line('── Does fit score predict outcome? ──');
if (resolved.length < MIN_SAMPLE) {
  line(`  NOT ENOUGH DATA. ${resolved.length} resolved outcome${resolved.length === 1 ? '' : 's'};`);
  line(`  need ${MIN_SAMPLE} before any band comparison means anything.`);
  line('  Reporting a conversion rate from this sample would be noise dressed as insight.');
} else {
  const bands = [
    ['80-100 (strong)', (f) => f >= 80],
    ['65-79  (solid)', (f) => f >= 65 && f < 80],
    ['50-64  (marginal)', (f) => f >= 50 && f < 65],
    ['below 50', (f) => f < 50],
  ];
  for (const [label, test] of bands) {
    const inBand = resolved.filter((r) => typeof r.fit === 'number' && test(r.fit));
    if (!inBand.length) { line(`  ${label.padEnd(20)} no data`); continue; }
    const pos = inBand.filter((r) => POSITIVE.test(r.outcome)).length;
    line(`  ${label.padEnd(20)} ${String(pos).padStart(2)}/${String(inBand.length).padEnd(2)} positive  (${pct(pos, inBand.length)})`);
  }
  line('  If a lower band converts as well as a higher one, the rubric is not');
  line('  discriminating and its weights need revisiting.');
}
line();

line('── Rules contradicted by outcomes ──');
const contradictions = [];
for (const r of positive) {
  if (typeof r.fit === 'number' && r.fit < 50) {
    contradictions.push(`Packet ${r.n} (${r.employer}) scored ${r.fit}, below the fit floor, but produced: ${r.outcome}. The floor would have hidden this role entirely.`);
  }
  if (r.fit === null) {
    contradictions.push(`Packet ${r.n} (${r.employer}) produced "${r.outcome}" but has NO fit score, so your best evidence cannot test the rubric. Backfill it.`);
  }
}
if (contradictions.length) {
  contradictions.forEach((c) => line(`  ⚠ ${c}`));
  line();
  line('  Treat each as a BUG in the rules, not a curiosity. A gate that would have');
  line('  discarded a role you actually advanced in is actively harmful, precisely');
  line('  because you never see what a gate removes.');
} else if (positive.length) {
  line('  None found. Positive outcomes are consistent with the current rules.');
} else {
  line('  No positive outcomes recorded yet, so nothing to check rules against.');
}
line();

line('── Next action ──');
if (resolved.length < MIN_SAMPLE) {
  line(`  Backfill outcomes. You have ${resolved.length}; ${MIN_SAMPLE} unlocks band analysis.`);
  line('  Even "no response" is a real outcome and worth recording.');
} else if (contradictions.length) {
  line('  Fix the contradicted rules above, then re-run to confirm.');
} else {
  line('  Rules look consistent with outcomes. Keep recording.');
}
line();
