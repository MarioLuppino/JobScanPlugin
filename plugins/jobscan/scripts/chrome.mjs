#!/usr/bin/env node
/**
 * chrome.mjs — locate a Chromium-family browser that can print headless.
 *
 * Two callers need the same answer and must not disagree about it:
 * save-posting-pdf.mjs, which prints, and doctor.mjs, which reports whether
 * printing is possible at all. A doctor that says "ok" while the printer is
 * looking somewhere else is worse than no check.
 *
 * Order: an explicit override, then the platform's usual install locations,
 * then PATH. Returns null rather than throwing, because "no browser here" is a
 * normal state the caller reports in its own words.
 */

import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/** Absolute locations, by platform. First hit wins. */
const CANDIDATES = {
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/snap/bin/chromium',
  ],
};

/** Names to try on PATH when no absolute location matched. */
const ON_PATH = [
  'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser',
  'microsoft-edge', 'chrome',
];

/** Resolve a bare command name through the platform's own lookup. Null if absent. */
export function resolves(cmd) {
  try {
    const finder = process.platform === 'win32' ? 'where' : 'which';
    const out = execFileSync(finder, [cmd], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const first = out.split(/\r?\n/).find((l) => l.trim());
    return first ? first.trim() : null;
  } catch {
    return null;
  }
}

/**
 * @returns {string|null} an executable path, or null if nothing was found.
 */
export function findChrome() {
  const override = process.env.JOBSCAN_CHROME || process.env.CHROME_PATH;
  if (override && existsSync(override)) return override;

  for (const c of CANDIDATES[process.platform] || []) if (existsSync(c)) return c;
  for (const name of ON_PATH) {
    const hit = resolves(name);
    if (hit) return hit;
  }
  return null;
}

if (process.argv[1]?.endsWith('chrome.mjs')) {
  const c = findChrome();
  console.log(c || 'no Chromium-family browser found');
  process.exit(c ? 0 : 1);
}
