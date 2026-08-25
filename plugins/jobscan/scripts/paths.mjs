#!/usr/bin/env node
/**
 * paths.mjs — where code lives vs. where the user's data lives.
 *
 * WHY THIS EXISTS: these scripts used to read and write their config and caches
 * next to themselves. That works from a git clone and fails as an installed
 * plugin: the plugin directory is replaced wholesale on `/plugin update`, so a
 * user's employer registry and seen-URL cache were silently deleted by the very
 * command the README tells them to run. Nothing personal may live under the
 * plugin root.
 *
 * So there are two roots:
 *   SCRIPTS_DIR  the plugin's own folder. Code and *.example.json. READ ONLY.
 *   DATA_DIR     the user's folder, from onboarding. Everything personal.
 *
 * Data directory, in order:
 *   1. $JOBSCAN_DATA
 *   2. data_path: in ~/.claude/jobscan-data/jobscan-config.md
 *   3. ~/.claude/jobscan-data/
 *
 * Archive directory (Applied Index.md, Work Search Log.md), in order:
 *   1. $JOBSCAN_ARCHIVE
 *   2. archive_path: in the same config file
 *   3. the data directory
 *
 * ATS config and caches live in <DATA_DIR>/ats/. A file still sitting in the old
 * location is read, with a one-line notice, so an existing setup keeps working
 * until the next `jobscan-onboarding` run moves it.
 */

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

export const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

/** The one path in the system that is fixed: every skill reads this first. */
export const CONFIG_PATH = join(homedir(), '.claude', 'jobscan-data', 'jobscan-config.md');

/** Expand a leading ~ and make the result absolute. */
function expand(p) {
  if (!p) return null;
  let s = String(p).trim().replace(/^["']|["']$/g, '');
  if (!s || s.startsWith('{{')) return null; // unfilled template placeholder
  if (s === '~') s = homedir();
  else if (s.startsWith('~/') || s.startsWith('~\\')) s = join(homedir(), s.slice(2));
  return isAbsolute(s) ? s : resolve(s);
}

/**
 * Pull one `key: value` line out of jobscan-config.md. The file is Markdown with
 * a yaml block in it, not real yaml, so read it as text and ignore trailing
 * comments rather than pulling in a parser.
 */
function fromConfig(key) {
  if (!existsSync(CONFIG_PATH)) return null;
  let text;
  try { text = readFileSync(CONFIG_PATH, 'utf8'); } catch { return null; }
  const m = text.match(new RegExp(`^\\s*${key}\\s*:\\s*([^#\\n]+)`, 'm'));
  return m ? expand(m[1]) : null;
}

export const DATA_DIR =
  expand(process.env.JOBSCAN_DATA) ||
  fromConfig('data_path') ||
  join(homedir(), '.claude', 'jobscan-data');

export const ARCHIVE_DIR =
  expand(process.env.JOBSCAN_ARCHIVE) ||
  fromConfig('archive_path') ||
  DATA_DIR;

/** Personal ATS config and caches. Never under the plugin root. */
export const ATS_DIR = join(DATA_DIR, 'ats');

let warnedLegacy = false;

/**
 * Where one of the user's own files actually is, or null if they do not have it.
 *
 * Deliberately no example fallback and no notice printed: a caller asking this is
 * asking about the *user's* state, and a shipped demo file is not that. Anything
 * wanting the demo as a working default calls readPath() instead.
 *
 * @param {string} name e.g. 'employers.json'
 * @returns {{path: string, isLegacy: boolean}|null}
 */
export function locate(name) {
  const current = join(ATS_DIR, name);
  if (existsSync(current)) return { path: current, isLegacy: false };

  // An install from before the split still has its files beside the scripts.
  const legacy = join(SCRIPTS_DIR, name);
  if (existsSync(legacy)) return { path: legacy, isLegacy: true };

  return null;
}

/**
 * Resolve a personal config or cache file for reading, falling back to the
 * shipped example so a fresh install still runs.
 *
 * @param {string} name      e.g. 'employers.json'
 * @param {string} [example] shipped default in SCRIPTS_DIR to fall back to
 * @returns {{path: string, isExample: boolean, isLegacy: boolean}|null}
 */
export function readPath(name, example = null) {
  const found = locate(name);
  if (found) {
    if (found.isLegacy && !warnedLegacy) {
      warnedLegacy = true;
      console.error(
        `jobscan: reading config from the plugin folder (${SCRIPTS_DIR}).\n` +
        `         A plugin update will delete it. Move these files to ${ATS_DIR}\n` +
        `         or re-run jobscan-onboarding, which does it for you.`
      );
    }
    return { path: found.path, isExample: false, isLegacy: found.isLegacy };
  }

  if (example) {
    const ex = join(SCRIPTS_DIR, example);
    if (existsSync(ex)) return { path: ex, isExample: true, isLegacy: false };
  }
  return null;
}

/** Resolve a personal file for writing, creating <DATA_DIR>/ats/ if needed. */
export function writePath(name) {
  mkdirSync(ATS_DIR, { recursive: true });
  return join(ATS_DIR, name);
}

/**
 * Resolve one of the archive's Markdown tables. The cwd fallbacks are kept so a
 * maintainer can still run these inside an archive folder.
 *
 * @param {string} name    e.g. 'Applied Index.md'
 * @param {string} envVar  e.g. 'JOBSCAN_INDEX' — an explicit override wins
 */
export function archivePath(name, envVar) {
  const override = envVar && expand(process.env[envVar]);
  if (override) return override;
  for (const p of [join(ARCHIVE_DIR, name), join(process.cwd(), name), join(process.cwd(), '..', name)]) {
    if (existsSync(p)) return p;
  }
  return join(ARCHIVE_DIR, name);
}

/** `node paths.mjs` prints what everything resolved to. Used by the doctor check. */
if (process.argv[1]?.endsWith('paths.mjs')) {
  const rows = [
    ['plugin scripts', SCRIPTS_DIR],
    ['config file', `${CONFIG_PATH}${existsSync(CONFIG_PATH) ? '' : '   (missing — run jobscan-onboarding)'}`],
    ['data dir', DATA_DIR],
    ['ats config', `${ATS_DIR}${existsSync(ATS_DIR) ? '' : '   (not created yet)'}`],
    ['archive dir', ARCHIVE_DIR],
    ['applied index', archivePath('Applied Index.md', 'JOBSCAN_INDEX')],
  ];
  for (const [k, v] of rows) console.log(`${k.padEnd(15)} ${v}`);
}
