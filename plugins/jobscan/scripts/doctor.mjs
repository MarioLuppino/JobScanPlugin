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
  SCRIPTS_DIR, CONFIG_PATH, DATA_DIR, ARCHIVE_DIR, ATS_DIR, archivePath, locate, display, configValue,
} from './paths.mjs';
import { findChrome, resolves } from './chrome.mjs';

const MIN_NODE = 18; // global fetch()

/**
 * `--full` prints absolute paths. The default prints the last two segments with
 * a home-relative prefix, because this report is read aloud to someone who was
 * told they would never see a file path, and `~/\u2026/jobscan-data/ats` is the
 * folder they would recognise in Finder. The maintainer case — checking that a
 * path resolved where it should — is what the flag is for, and `paths.mjs`
 * still prints every path in full unconditionally.
 *
 * A path inside a command below stays absolute either way: those lines are run,
 * not read, and a shortened path would not resolve.
 */
const FULL = process.argv.includes('--full');
const d = (p) => (FULL ? p : display(p));

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

/**
 * Read one of the user's own files from wherever it actually resolves.
 *
 * Every scanner script reads these through paths.mjs, which still finds a
 * pre-0.3.0 install's files beside the scripts. This used to look only in
 * <DATA_DIR>/ats, so such an install was told its employer list and job titles
 * were missing while the scan was reading them perfectly well — the doctor
 * raising a false alarm about the very thing it exists to report on.
 */
function readPersonal(name) {
  const found = locate(name);
  return found ? { data: readJson(found.path), legacy: found.isLegacy } : { data: null, legacy: false };
}

/** Said once per line that is reading from the old location; the fix is its own check below. */
const OLD_LOCATION = ', in the plugin folder — see Old file locations';

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
  report('ok', 'Scanner code', d(SCRIPTS_DIR));
} else {
  report('fix', 'Scanner code', `incomplete in ${d(SCRIPTS_DIR)} — missing ${missing.join(', ')}`,
    'Reinstall the plugin: "Update my JobScan plugin".');
}

// 2b. A never-onboarded install is not a broken one --------------------------
// Every check below resolves against a file that onboarding creates, so on a
// fresh install they all fail at once: this used to print eight FIX lines and
// close with "8 things above will make a scan quieter than it should be." That
// is what somebody sees the first time they say "check my job scanner", and it
// reads as a broken product rather than an unstarted one. The honest report for
// an untouched install is one line, so anything genuinely wrong with the
// install itself — the two checks above — still gets said, and nothing else does.
const PERSONAL_FILES = [
  'triage-config.json', 'employers.json', 'ats-feeds.json', 'workday-candidates.json', 'seen-urls.json',
];
const GENERATED_FILES = ['profile.md', 'profile-core.md', 'setup-state.md', 'sources.md'];

const untouched = !existsSync(CONFIG_PATH)
  && !GENERATED_FILES.some((f) => existsSync(join(DATA_DIR, f)))
  && !PERSONAL_FILES.some((f) => locate(f))
  && !existsSync(archivePath('Applied Index.md', 'JOBSCAN_INDEX'));

if (untouched) {
  const blocked = rows.filter((r) => r.state === 'fix');
  console.log('JobScan check — not set up yet\n');
  console.log('The plugin is installed. The one-time setup has not been run yet, so there are none of');
  console.log('your own files to check.\n');
  console.log('\u2192 Say "run jobscan onboarding". It is one conversation, and it creates everything the');
  console.log('  weekly scan needs.');
  if (blocked.length) {
    console.log(blocked.length === 1
      ? '\nOne thing to fix first, because setup depends on it:\n'
      : `\n${blocked.length} things to fix first, because setup depends on them:\n`);
    for (const r of blocked) {
      console.log(`FIX ${r.label}  ${r.detail}`);
      if (r.fix) console.log(`    \u2192 ${r.fix}`);
    }
  }
  process.exit(0);
}

// 3. Config ------------------------------------------------------------------
if (!existsSync(CONFIG_PATH)) {
  report('fix', 'Config file', `not found at ${d(CONFIG_PATH)}`,
    'Run jobscan-onboarding — nothing else here can resolve until this file exists.');
} else {
  const text = readFileSync(CONFIG_PATH, 'utf8');
  const unfilled = ['data_path', 'archive_path']
    .filter((k) => new RegExp(`^\\s*${k}\\s*:\\s*\\{\\{`, 'm').test(text));
  if (unfilled.length) {
    report('fix', 'Config file', `${unfilled.join(' and ')} still holds the template placeholder`,
      'Re-run jobscan-onboarding Step 3, or say "where does jobscan keep my files" to set the paths.');
  } else {
    report('ok', 'Config file', d(CONFIG_PATH));
  }
}

// 4. Data directory ----------------------------------------------------------
if (!existsSync(DATA_DIR)) {
  report('fix', 'Data folder', `${d(DATA_DIR)} does not exist`,
    'Run jobscan-onboarding, or say "move my jobscan files" if the folder was moved or renamed.');
} else if (!writable(DATA_DIR)) {
  report('fix', 'Data folder', `${d(DATA_DIR)} is not writable`,
    'Check permissions on that folder, or pick a different location with "move my jobscan files".');
} else {
  report('ok', 'Data folder', d(DATA_DIR));
}

const profile = join(DATA_DIR, 'profile-core.md');
if (existsSync(profile)) report('ok', 'Profile digest', d(profile));
else report('fix', 'Profile digest', `no profile-core.md in ${d(DATA_DIR)}`,
  'Run jobscan-onboarding — scoring has nothing to score against without it.');

// 5. Scanner config ----------------------------------------------------------
const examplePatterns = readJson(join(SCRIPTS_DIR, 'triage-config.example.json'))?.matchTitlePatterns ?? [];
const { data: triage, legacy: triageLegacy } = readPersonal('triage-config.json');
if (!triage) {
  report('fix', 'Job titles', `no triage-config.json in ${d(ATS_DIR)}`,
    'Run jobscan-onboarding Step 6, or say "add an employer to my job scan" — without it the feeds are ' +
    'pulled and nothing matches.');
} else if (!Array.isArray(triage.matchTitlePatterns) || triage.matchTitlePatterns.length === 0) {
  report('fix', 'Job titles', 'triage-config.json has no matchTitlePatterns',
    'Say "update my job titles" — an empty list rejects every posting.');
} else if (JSON.stringify(triage.matchTitlePatterns) === JSON.stringify(examplePatterns)) {
  report('fix', 'Job titles', 'still the shipped example titles, not the user\'s',
    'Say "update my job titles". The defaults are a demo; they will match almost nothing in a real field.');
} else {
  report('ok', 'Job titles', `${triage.matchTitlePatterns.length} title patterns${triageLegacy ? OLD_LOCATION : ''}`);
}

const { data: employersFile, legacy: employersLegacy } = readPersonal('employers.json');
const employers = employersFile?.employers;
if (!Array.isArray(employers) || employers.length === 0) {
  report('fix', 'Employer list', `no employers registered in ${d(ATS_DIR)}`,
    'Say "find employers for my job scan" — the first scan can search the boards and keep whoever is ' +
    'posting your roles. The benchmark figures in the docs come from a registry of two dozen; a scan ' +
    'with none falls back to web search entirely, every week.');
} else {
  const state = employers.length < 5 ? 'note' : 'ok';
  report(state, 'Employer list', `${employers.length} employer${employers.length === 1 ? '' : 's'}` +
    (state === 'note' ? ' — thin; results grow steeply up to about two dozen' : '') +
    (employersLegacy ? OLD_LOCATION : ''),
    state === 'note'
      ? 'Say "find employers for my job scan" to grow it from a real search, or "add employers to my ' +
        'job scan" whenever you think of another one.'
      : null);
}

const { data: feedsFile, legacy: feedsLegacy } = readPersonal('ats-feeds.json');
const feeds = feedsFile?.feeds;
const hasEmployers = Array.isArray(employers) && employers.length > 0;
if (!Array.isArray(feeds) || feeds.length === 0) {
  report('fix', 'Job feeds', hasEmployers
    ? 'no ats-feeds.json — employers registered but never probed'
    : 'no ats-feeds.json — nothing to pull from yet',
    hasEmployers
      ? `Run: node "${join(SCRIPTS_DIR, 'discover-ats.mjs')}"  (and discover-workday.mjs for large employers).`
      : 'Register employers first, then the probe above builds this file.');
} else {
  report('ok', 'Job feeds', `${feeds.length} live feed${feeds.length === 1 ? '' : 's'}${feedsLegacy ? OLD_LOCATION : ''}`);
}

const { data: seen } = readPersonal('seen-urls.json');
const seenCount = Array.isArray(seen) ? seen.length : Object.keys(seen ?? {}).length;
report('note', 'Seen-URL cache',
  seenCount ? `${seenCount} posting${seenCount === 1 ? '' : 's'} already screened out` : 'empty — first run');

// 5b. Federal, archive and diagnosis tiers -----------------------------------
// Each of these replaced an expensive habit with a cheap tool: one JSON request instead of
// scraping a JavaScript shell, a printed PDF instead of a screenshot, a text classifier instead
// of a screenshot. A tool that is quietly unreachable does not announce itself — the run simply
// goes back to the expensive habit and the bill arrives later, which is the whole reason this
// file exists.
//
// These live below the never-onboarded early exit on purpose. All three are about capability
// rather than about the install being broken, and printing them at somebody who has not run
// setup yet reads as a list of faults in a product they have not started.

const federalKey = process.env.USAJOBS_API_KEY || configValue('usajobs_api_key');
const federalAgent = process.env.USAJOBS_USER_AGENT || configValue('usajobs_user_agent') || configValue('email');
const hasUsajobsScript = existsSync(join(SCRIPTS_DIR, 'usajobs.mjs'));

if (!federalKey) {
  report('note', 'Federal tier', 'no USAJOBS API key configured',
    'Only worth fixing if the search includes US federal roles. Without a key the federal branch ' +
    'falls back to scraping a JavaScript site that never returns a listing, and an empty result ' +
    'there looks exactly like a quiet week. The key is free and self-service at ' +
    'developer.usajobs.gov; add it as usajobs_api_key in the config.');
} else if (!federalAgent) {
  report('fix', 'Federal tier', 'a USAJOBS key is set but no user agent is',
    'USAJOBS requires the User-Agent header to carry the email address the key was registered ' +
    'with. Add usajobs_user_agent to the config.');
} else if (!/@/.test(federalAgent)) {
  report('fix', 'Federal tier', `the USAJOBS user agent is "${federalAgent}", which is not an email address`,
    'USAJOBS wants the registered email in that header, not a browser string. This inverts the ' +
    'usual meaning of User-Agent and is the single most common cause of a 403 against a ' +
    'perfectly valid key.');
} else if (!hasUsajobsScript) {
  report('fix', 'Federal tier', 'credentials are configured but usajobs.mjs is missing',
    'Reinstall the plugin: "Update my JobScan plugin".');
} else {
  report('ok', 'Federal tier', 'USAJOBS key configured; usajobs.mjs present');
}

const chrome = findChrome();
const hasPrinter = existsSync(join(SCRIPTS_DIR, 'save-posting-pdf.mjs'));
if (chrome && hasPrinter) {
  report('ok', 'Archive tier', `postings can be printed via ${d(chrome)}`);
} else {
  report('fix', 'Archive tier',
    chrome ? 'save-posting-pdf.mjs is missing' : 'no headless-capable Chrome, Chromium or Edge found',
    'Postings cannot be archived as print-ready PDFs, so packets get filed with no record of what ' +
    'was actually asked for, and the pre-draft gate loses its free liveness check. The fallback is ' +
    'a screenshot, which costs roughly 15x a page read and stores one viewport of unselectable ' +
    'image. Install Chrome or Chromium, or set JOBSCAN_CHROME to one already installed.');
}

const BANK = join(SCRIPTS_DIR, 'page-errors.json');
if (!existsSync(BANK) || !existsSync(join(SCRIPTS_DIR, 'check-page.mjs'))) {
  report('fix', 'Diagnosis tier', 'check-page.mjs or page-errors.json is missing',
    'A bad page read cannot be classified from text, so diagnosis falls back to screenshotting the ' +
    'page to see what happened — after the page has already been paid for once or twice.');
} else {
  let n = 0;
  const bad = [];
  try {
    const bank = JSON.parse(readFileSync(BANK, 'utf8'));
    n = bank.signatures.length;
    // A regex that no longer compiles is the quiet failure here: the signature simply never
    // fires, and a CAPTCHA sails through as a healthy page.
    for (const sig of bank.signatures) {
      try { new RegExp(sig.pattern, 'i'); } catch { bad.push(sig.pattern); }
    }
  } catch (e) { bad.push(`unparseable: ${e.message}`); }
  if (bad.length) {
    report('fix', 'Diagnosis tier', `${bad.length} bad signature(s) in page-errors.json`,
      `These never match, so whatever they guard against passes as a healthy page: ${bad.slice(0, 3).join('; ')}`);
  } else {
    report('ok', 'Diagnosis tier',
      `${n} page signatures compile; pdftotext ${resolves('pdftotext') ? 'on PATH' : 'NOT on PATH (--pdf mode unavailable)'}`);
  }
}

// 6. Archive -----------------------------------------------------------------
if (!existsSync(ARCHIVE_DIR)) {
  report('fix', 'Archive folder', `${d(ARCHIVE_DIR)} does not exist`,
    'Run jobscan-onboarding Step 5, or say "move my jobscan files" if the folder was moved.');
} else if (!writable(ARCHIVE_DIR)) {
  report('fix', 'Archive folder', `${d(ARCHIVE_DIR)} is not writable`,
    'Nothing can be filed there. Check the folder\'s permissions, or move the archive somewhere else.');
} else {
  report('ok', 'Archive folder', d(ARCHIVE_DIR));
}

const index = archivePath('Applied Index.md', 'JOBSCAN_INDEX');
if (existsSync(index)) {
  const lines = readFileSync(index, 'utf8').split('\n').filter((l) => /^\s*\|\s*\d+/.test(l)).length;
  report('ok', 'Applied index', `${lines} application${lines === 1 ? '' : 's'} recorded`);
} else {
  report('fix', 'Applied index', `no Applied Index.md at ${d(index)}`,
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
