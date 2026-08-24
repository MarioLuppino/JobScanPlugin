#!/usr/bin/env node
/**
 * pipeline.mjs — model the application pipeline, not just this week's scan.
 *
 * Applications take weeks to convert, but a weekly scan thinks in snapshots: it
 * produces a digest and forgets. Nothing then tracks whether an application is
 * still live, old enough to follow up on, or whether a weekly quota is actually
 * being met. This closes that gap.
 *
 * Reads Applied Index.md, plus Work Search Log.md when present (which carries
 * exact submission dates; the index only records a month).
 *
 *   node pipeline.mjs
 *   node pipeline.mjs --quota 3        # applications required per week
 *   node pipeline.mjs --followup 14    # days before an application counts as stale
 *
 * Paths: $JOBSCAN_INDEX / $JOBSCAN_WORKLOG, else archive_path in
 * ~/.claude/jobscan-data/jobscan-config.md, else the working directory.
 */

import { readFileSync, existsSync } from 'node:fs';
import { archivePath } from './paths.mjs';

const INDEX = archivePath('Applied Index.md', 'JOBSCAN_INDEX');
const LOG = archivePath('Work Search Log.md', 'JOBSCAN_WORKLOG');

const arg = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? Number(process.argv[i + 1]) : dflt;
};
const QUOTA = arg('--quota', 3);
const FOLLOWUP_DAYS = arg('--followup', 14);

const RESOLVED = /(reject|declin|no response|offer|accept|withdraw|not select|closed)/i;

function parseTable(path, minCols = 3) {
  if (!existsSync(path)) return null;
  const rows = [];
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('|') || /^\|\s*-+/.test(t)) continue;
    const c = t.split('|').map((x) => x.trim().replace(/\*\*/g, ''))
      .filter((x, i, a) => i !== 0 && i !== a.length - 1);
    if (c.length < minCols) continue;
    rows.push(c);
  }
  return rows;
}

const idxRows = (parseTable(INDEX) || []).filter((c) => !/^N$/i.test(c[0]) && c[1] && c[1] !== '—');
const packets = idxRows.map((c) => ({
  n: c[0], employer: c[1], role: c[2],
  status: (c[3] || '').toLowerCase(), filed: c[4] || '', fit: c[5] || '', outcome: c[6] || '',
}));

const logRows = parseTable(LOG, 5) || [];
const submissions = logRows.map((c) => ({ date: c[1], employer: c[2], position: c[3] }))
  .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date || ''));

const today = new Date();
const daysSince = (iso) => Math.floor((today - new Date(iso + 'T00:00:00')) / 86400000);
const line = (s = '') => console.log(s);

line('\n═══ PIPELINE STATUS ═══');
line(`As of ${today.toISOString().slice(0, 10)}`);
line();

// First-run state. Report it as a starting point, not as an empty funnel.
if (!packets.length && !submissions.length) {
  line('  Nothing in the pipeline yet.');
  line();
  line('  Once you start applying, this shows what is still live, what is old');
  line('  enough to chase, and whether you are hitting a weekly quota. Two habits');
  line('  make it work:');
  line('    - append a row to Applied Index.md when you build a packet, and set');
  line('      Status to "applied" the day you actually submit it');
  line('    - log the submission date in Work Search Log.md the same day');
  line();
  line('  Dates entered later are unreliable, and an application nobody tracks is');
  line('  one nobody follows up on.');
  line();
  process.exit(0);
}

const applied = packets.filter((p) => p.status.includes('applied') || p.status.includes('accept'));
const prepared = packets.filter((p) => p.status.includes('prepared'));
const resolved = packets.filter((p) => RESOLVED.test(p.outcome));
const live = applied.filter((p) => !RESOLVED.test(p.outcome));

line('── Funnel ──');
line(`  Packets built:      ${packets.length}`);
line(`  Prepared, not sent: ${prepared.length}`);
line(`  Submitted:          ${applied.length}`);
line(`  Still live:         ${live.length}`);
line(`  Resolved:           ${resolved.length}`);
if (prepared.length > applied.length && prepared.length > 3) {
  line();
  line(`  ⚠ ${prepared.length} packets were built but never marked submitted.`);
  line('    A prepared packet is wasted work until it is sent, and it does not');
  line('    count toward a weekly quota. Either submit them or record why not.');
}
line();

line('── Weekly quota ──');
if (!submissions.length) {
  line('  No dated submissions found in Work Search Log.md.');
  line(`  Target is ${QUOTA}/week. Log each application the day it goes out --`);
  line('  the log is the evidence, and reconstructing it later is unreliable.');
} else {
  const byWeek = new Map();
  for (const s of submissions) {
    const d = new Date(s.date + 'T00:00:00');
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    byWeek.set(key, (byWeek.get(key) || 0) + 1);
  }
  [...byWeek.entries()].sort().slice(-6).forEach(([wk, n]) =>
    line(`  ${n >= QUOTA ? '✓' : '⚠'} week of ${wk}: ${n}/${QUOTA}`));
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const n = byWeek.get(thisMonday.toISOString().slice(0, 10)) || 0;
  if (n < QUOTA) {
    line();
    line(`  ⚠ THIS WEEK: ${n}/${QUOTA}. ${QUOTA - n} more needed.`);
    line('    Confirm your benefit week boundary with the paying agency; a');
    line('    Sunday-Saturday week versus Monday-Sunday shifts the deadline by a day.');
  }
}
line();

line('── Follow-ups ──');
const stale = submissions
  .filter((s) => daysSince(s.date) >= FOLLOWUP_DAYS)
  .filter((s) => {
    const p = packets.find((x) => x.employer.toLowerCase().includes((s.employer || '').toLowerCase().slice(0, 8)));
    return !p || !RESOLVED.test(p.outcome);
  })
  .sort((a, b) => a.date.localeCompare(b.date));

if (!submissions.length) {
  line('  Nothing to check until submissions are logged with dates.');
} else if (!stale.length) {
  line(`  Nothing older than ${FOLLOWUP_DAYS} days is still unresolved.`);
} else {
  line(`  ${stale.length} application${stale.length === 1 ? '' : 's'} past ${FOLLOWUP_DAYS} days with no recorded outcome:`);
  stale.forEach((s) => line(`    ${String(daysSince(s.date)).padStart(3)}d  ${s.employer} — ${s.position}`));
  line();
  line('  A polite follow-up costs nothing and often surfaces a decision already');
  line('  made. Record the answer either way -- "no response" is data.');
}
line();
