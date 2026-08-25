#!/usr/bin/env node
/**
 * doctor.mjs — one visible line per thing that can silently degrade a scan.
 *
 * WHY THIS EXISTS: every failure this checks for used to be invisible. A config
 * at the wrong path, an employer registry that was never filled, an archive
 * folder that moved — each produced a scan that looked like it worked and
 * quietly returned a fraction of what it should have. The rule now is that
 * degrading is fine and degrading in silence is not, so this prints the state
 * of every precondition in plain words, with the one fix for each.
 *
 * Machine-checkable things only. Whether Firecrawl actually answers, whether
 * the `docx` skill is loaded, and whether browser tools exist are checks the
 * agent runs itself — see skills/jobscan-doctor/SKILL.md.
 *
 * Exit code is always 0: this is a report, not a gate.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  SCRIPTS_DIR, CONFIG_PATH, DATA_DIR, ARCHIVE_DIR, ATS_DIR, archivePath,
} from './paths.mjs';

const MIN_NODE = 18; // global fetch()

const rows = [];
let problems = 0;

/** @param {'ok'|'fix'|'note'} state */
function report(state, label, detail, fix = null) {
  if (state === 'fix') problems++;
  rows.push({ state, label, detail, fix });
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

/** Can we actually create a file here? Existing-and-readable is not the same thing. */
function writable(dir) {
  try {
    mkdirSync(dir, { recursive: true });
    const probe = join(dir, `.jobscan-write-probe-${process.pid}`);
    writeFileSync(probe, '');
    unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

// 1. Runtime -----------------------------------------------------------------
const major = Number(process.versions.node.split('.')[0]);
if (major >= MIN_NODE) {
  report('ok', 'Node.js', `v${process.versions.node}`);
} else {
  report('fix', 'Node.js', `v${process.versions.node} — too old, needs v${MIN_NODE} or newer`,
    'This version has no built-in fetch, so every feed script fails on startup. Install the current LTS ' +
    '(macOS `brew install node`, Windows `winget install OpenJS.NodeJS.LTS`, Debian/Ubuntu the NodeSource ' +
    'setup script — `sudo apt install nodejs` there installs a version this old).');
}

// 2. Plugin scripts ----------------------------------------------------------
const required = ['paths.mjs', 'fetch-ats.mjs', 'triage.mjs', 'dedup.mjs', 'discover-ats.mjs'];
const missing = required.filter((f) => !existsSync(join(SCRIPTS_DIR, f)));
if (missing.length === 0) {
  report('ok', 'Scanner code', SCRIPTS_DIR);
} else {
  report('fix', 'Scanner code', `incomplete in ${SCRIPTS_DIR} — missing ${missing.join(', ')}`,
    'Reinstall the plugin: "Update my JobScan plugin".');
}

// 3. Config ------------------------------------------------------------------
if (!existsSync(CONFIG_PATH)) {
  report('fix', 'Config file', `not found at ${CONFIG_PATH}`,
    'Run jobscan-onboarding — nothing else here can resolve until this file exists.');
} else {
  const text = readFileSync(CONFIG_PATH, 'utf8');
  const unfilled = ['data_path', 'archive_path']
    .filter((k) => new RegExp(`^\\s*${k}\\s*:\\s*\\{\\{`, 'm').test(text));
  if (unfilled.length) {
    report('fix', 'Config file', `${unfilled.join(' and ')} still holds the template placeholder`,
      'Re-run jobscan-onboarding Step 3, or say "where does jobscan keep my files" to set the paths.');
  } else {
    report('ok', 'Config file', CONFIG_PATH);
  }
}

// 4. Data directory ----------------------------------------------------------
if (!existsSync(DATA_DIR)) {
  report('fix', 'Data folder', `${DATA_DIR} does not exist`,
    'Run jobscan-onboarding, or say "move my jobscan files" if the folder was moved or renamed.');
} else if (!writable(DATA_DIR)) {
  report('fix', 'Data folder', `${DATA_DIR} is not writable`,
    'Check permissions on that folder, or pick a different location with "move my jobscan files".');
} else {
  report('ok', 'Data folder', DATA_DIR);
}

const profile = join(DATA_DIR, 'profile-core.md');
if (existsSync(profile)) report('ok', 'Profile digest', profile);
else report('fix', 'Profile digest', `no profile-core.md in ${DATA_DIR}`,
  'Run jobscan-onboarding — scoring has nothing to score against without it.');

// 5. Scanner config ----------------------------------------------------------
const triagePath = join(ATS_DIR, 'triage-config.json');
const examplePatterns = readJson(join(SCRIPTS_DIR, 'triage-config.example.json'))?.matchTitlePatterns ?? [];
const triage = readJson(triagePath);
if (!triage) {
  report('fix', 'Job titles', `no triage-config.json in ${ATS_DIR}`,
    'Run jobscan-onboarding Step 6, or say "add an employer to my job scan" — without it the feeds are ' +
    'pulled and nothing matches.');
} else if (!Array.isArray(triage.matchTitlePatterns) || triage.matchTitlePatterns.length === 0) {
  report('fix', 'Job titles', 'triage-config.json has no matchTitlePatterns',
    'Say "update my job titles" — an empty list rejects every posting.');
} else if (JSON.stringify(triage.matchTitlePatterns) === JSON.stringify(examplePatterns)) {
  report('fix', 'Job titles', 'still the shipped example titles, not the user\'s',
    'Say "update my job titles". The defaults are a demo; they will match almost nothing in a real field.');
} else {
  report('ok', 'Job titles', `${triage.matchTitlePatterns.length} title patterns`);
}

const employers = readJson(join(ATS_DIR, 'employers.json'))?.employers;
if (!Array.isArray(employers) || employers.length === 0) {
  report('fix', 'Employer list', `no employers registered in ${ATS_DIR}`,
    'Say "add employers to my job scan". The benchmark figures in the docs come from a registry of two ' +
    'dozen; a scan with none falls back to web search entirely.');
} else {
  const state = employers.length < 5 ? 'note' : 'ok';
  report(state, 'Employer list', `${employers.length} employer${employers.length === 1 ? '' : 's'}` +
    (state === 'note' ? ' — thin; results grow steeply up to about two dozen' : ''),
    state === 'note' ? 'Say "add employers to my job scan" whenever you think of another one.' : null);
}

const feeds = readJson(join(ATS_DIR, 'ats-feeds.json'))?.feeds;
const hasEmployers = Array.isArray(employers) && employers.length > 0;
if (!Array.isArray(feeds) || feeds.length === 0) {
  report('fix', 'Job feeds', hasEmployers
    ? 'no ats-feeds.json — employers registered but never probed'
    : 'no ats-feeds.json — nothing to pull from yet',
    hasEmployers
      ? `Run: node "${join(SCRIPTS_DIR, 'discover-ats.mjs')}"  (and discover-workday.mjs for large employers).`
      : 'Register employers first, then the probe above builds this file.');
} else {
  report('ok', 'Job feeds', `${feeds.length} live feed${feeds.length === 1 ? '' : 's'}`);
}

const seen = readJson(join(ATS_DIR, 'seen-urls.json'));
const seenCount = Array.isArray(seen) ? seen.length : Object.keys(seen ?? {}).length;
report('note', 'Seen-URL cache',
  seenCount ? `${seenCount} posting${seenCount === 1 ? '' : 's'} already screened out` : 'empty — first run');

// 6. Archive -----------------------------------------------------------------
if (!existsSync(ARCHIVE_DIR)) {
  report('fix', 'Archive folder', `${ARCHIVE_DIR} does not exist`,
    'Run jobscan-onboarding Step 5, or say "move my jobscan files" if the folder was moved.');
} else if (!writable(ARCHIVE_DIR)) {
  report('fix', 'Archive folder', `${ARCHIVE_DIR} is not writable`,
    'Nothing can be filed there. Check the folder\'s permissions, or move the archive somewhere else.');
} else {
  report('ok', 'Archive folder', ARCHIVE_DIR);
}

const index = archivePath('Applied Index.md', 'JOBSCAN_INDEX');
if (existsSync(index)) {
  const lines = readFileSync(index, 'utf8').split('\n').filter((l) => /^\s*\|\s*\d+/.test(l)).length;
  report('ok', 'Applied index', `${lines} application${lines === 1 ? '' : 's'} recorded`);
} else {
  report('fix', 'Applied index', `no Applied Index.md at ${index}`,
    'Duplicate screening reads this file, so without it old roles resurface every week. Run ' +
    'jobscan-onboarding Step 5 to create it. If you know you have one, this is a path problem, not a ' +
    'record-keeping problem — check archive_path in the config.');
}

// 7. Files left in the plugin by a pre-0.3.0 install --------------------------
const stranded = ['triage-config.json', 'employers.json', 'ats-feeds.json', 'workday-candidates.json', 'seen-urls.json']
  .filter((f) => existsSync(join(SCRIPTS_DIR, f)));
if (stranded.length) {
  report('fix', 'Old file locations', `${stranded.length} personal file(s) still inside the plugin folder`,
    `The next plugin update deletes these. Move ${stranded.join(', ')} from ${SCRIPTS_DIR} to ${ATS_DIR}; ` +
    're-running jobscan-onboarding does it for you.');
}

// Report ---------------------------------------------------------------------
const width = Math.max(...rows.map((r) => r.label.length));
const mark = { ok: 'ok  ', fix: 'FIX ', note: '--  ' };
console.log(`JobScan check — ${rows.length} checks, ${problems === 0 ? 'nothing to fix' : `${problems} to fix`}\n`);
for (const r of rows) {
  console.log(`${mark[r.state]}${r.label.padEnd(width)}  ${r.detail}`);
  if (r.fix) console.log(`${' '.repeat(width + 6)}→ ${r.fix}`);
}
if (problems === 0) {
  console.log('\nEverything the scan depends on is in place.');
} else {
  console.log(`\n${problems} thing${problems === 1 ? '' : 's'} above will make a scan quieter than it should be.`);
}
