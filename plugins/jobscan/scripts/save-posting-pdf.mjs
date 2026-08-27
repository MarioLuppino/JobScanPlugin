#!/usr/bin/env node
// save-posting-pdf.mjs — archive a job posting as a print-ready PDF, at zero token cost.
//
// WHY THIS EXISTS
// A screenshot is the most expensive payload this system can produce — roughly 15x a page-read
// tree, per the measurement in skills/job-search/references/portals.md. It is also a poor
// archive: one viewport, no selectable text, no working links. This script produces the better
// artifact for less than nothing, because the browser renders and prints the page in its own
// process and NOT ONE BYTE of it enters the model's context. The agent never "looks" at the
// page in order to archive it.
//
// So the archival copy and the reading copy are separate concerns and must not be conflated:
//   - to READ a page  -> the page-read tool, then page text, per the ladder in portals.md
//   - to KEEP a page  -> this script
//
// Usage:
//   node save-posting-pdf.mjs <url> --out "<folder>"              # writes description.pdf
//   node save-posting-pdf.mjs <url> --out "<folder>" --name applied.pdf
//   node save-posting-pdf.mjs <url> --out "<folder>" --wait 6000  # slow JS portal
//
// Exit codes: 0 wrote a PDF; 2 wrote nothing (reason on stderr, safe to fall back).

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { findChrome } from './chrome.mjs';

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[a.slice(2)] = true;
      else { out[a.slice(2)] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

const a = parseArgs(process.argv.slice(2));
const url = a._[0] || a.url;
const outDir = a.out || process.cwd();
const name = a.name || 'description.pdf';
const waitMs = Number(a.wait || 4000);

if (!url || url === true) {
  console.error('usage: node save-posting-pdf.mjs <url> --out "<folder>" [--name description.pdf] [--wait 4000]');
  process.exit(2);
}
if (!/^https?:\/\//i.test(url)) { console.error(`not an http(s) url: ${url}`); process.exit(2); }
if (!fs.existsSync(outDir)) { console.error(`no such folder: ${outDir}`); process.exit(2); }

const target = path.join(outDir, name);
if (fs.existsSync(target) && !a.force) {
  // Never silently overwrite an archive copy. Some of these files are the user's own —
  // a confirmation page they printed themselves after submitting — and an agent that
  // regenerates one has destroyed a record it cannot recreate.
  console.error(`refusing to overwrite existing ${target} (pass --force if that is intended)`);
  process.exit(2);
}

const chrome = findChrome();
if (!chrome) {
  console.error('no Chromium-family browser found; cannot print to PDF. Set JOBSCAN_CHROME to one if it is installed somewhere unusual.');
  process.exit(2);
}

// --virtual-time-budget lets the renderer run timers and fetches to completion before printing,
// which is what makes this work on the JavaScript portals where a plain fetch returns an empty
// shell. It is the same class of page the ladder in portals.md routes away from a plain fetch.
const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--hide-scrollbars',
  '--run-all-compositor-stages-before-draw',
  `--virtual-time-budget=${waitMs}`,
  '--no-pdf-header-footer',
  `--print-to-pdf=${target}`,
  url,
];

const child = spawn(chrome, args, { stdio: ['ignore', 'ignore', 'pipe'] });
let stderr = '';
child.stderr.on('data', (d) => { stderr += d.toString(); });

const killer = setTimeout(() => child.kill(), waitMs + 30000);

child.on('close', () => {
  clearTimeout(killer);
  if (!fs.existsSync(target)) {
    console.error(`the browser wrote no PDF. ${stderr.trim().split('\n').slice(-3).join(' | ')}`);
    process.exit(2);
  }
  const bytes = fs.statSync(target).size;
  // A near-empty PDF means the page rendered as a shell or a block page. Say so rather than
  // filing a blank archive that looks fine in a directory listing.
  if (bytes < 12000) {
    console.error(`WARNING: ${target} is only ${bytes} bytes. Likely a login wall, a block page, or a shell that did not render. Verify before trusting it as the archive copy.`);
    console.log(target);
    process.exit(0);
  }
  console.log(`${target}  (${(bytes / 1024).toFixed(0)} KB)`);
});
