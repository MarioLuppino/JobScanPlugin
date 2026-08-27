#!/usr/bin/env node
// check-page.mjs — decide WHY a page read came back wrong, without looking at the page.
//
// WHY THIS EXISTS
// The old failure loop was: the page read returns something odd -> read it a second way to be
// sure -> still odd -> screenshot it "to see what's happening". By the time the screenshot is
// taken the page has been paid for three times, and the third payment is the ~15x one. But the
// answer was already sitting in the first read: block pages, CAPTCHAs, login walls and closed
// postings all announce themselves in plain text. This matches that text against a signature
// bank and returns a verdict, so a screenshot is never the diagnostic step.
//
// The rule that follows: a screenshot is only ever justified when this script cannot name the
// problem AND the page matters. Everything else has a name already.
//
// Usage:
//   node check-page.mjs --file page.txt          # saved page-read / page-text output
//   node check-page.mjs --pdf description.pdf    # runs pdftotext first (Poppler, if on PATH)
//   echo "$text" | node check-page.mjs
//   node check-page.mjs --pdf x.pdf --expect "<the job title>"   # also assert it is the right page
//
// Output: one line, `VERDICT<TAB>what to do<TAB>which signature matched`.
// Exit codes: 0 clean; 1 a problem verdict; 2 could not read the input.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BANK = path.join(HERE, 'page-errors.json');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const n = argv[i + 1];
      if (n === undefined || n.startsWith('--')) out[a.slice(2)] = true;
      else { out[a.slice(2)] = n; i++; }
    } else out._.push(a);
  }
  return out;
}

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

const a = parseArgs(process.argv.slice(2));
let text = '';

if (a.pdf) {
  if (!fs.existsSync(a.pdf)) { console.error(`no such pdf: ${a.pdf}`); process.exit(2); }
  try {
    text = execFileSync('pdftotext', [a.pdf, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    console.error(`pdftotext failed on ${a.pdf}: ${e.message}`);
    console.error('If pdftotext is missing, install Poppler, or pass the page as text with --file.');
    process.exit(2);
  }
} else if (a.file) {
  if (!fs.existsSync(a.file)) { console.error(`no such file: ${a.file}`); process.exit(2); }
  text = fs.readFileSync(a.file, 'utf8');
} else {
  text = readStdin();
}

if (!text.trim()) {
  console.log('empty\tNothing came back at all. That is a tool failure, not a dry source. Change the tool, do not retry it.\t-');
  process.exit(1);
}

const bank = JSON.parse(fs.readFileSync(BANK, 'utf8'));

// Match against a bounded head+tail. Block pages and error pages are short and put their
// message at the top; a real multi-page posting can carry the words "no longer available" deep
// in unrelated boilerplate, and matching the whole body is how false positives get in.
const head = text.slice(0, 6000);
const tail = text.length > 12000 ? text.slice(-2000) : '';
const hay = `${head}\n${tail}`;

const hits = [];
for (const s of bank.signatures) {
  const re = new RegExp(s.pattern, 'i');
  const m = re.exec(hay);
  if (m) hits.push({ verdict: s.verdict, matched: m[0].replace(/\s+/g, ' ').trim().slice(0, 60), note: s.note });
}

// A short page that matched nothing is still suspect: a real posting is thousands of
// characters. Under ~600 means a shell rendered, whatever it claims.
if (!hits.length && text.trim().length < 600) {
  console.log(`empty-shell\t${bank._verdicts['empty-shell']}\t(only ${text.trim().length} chars returned)`);
  process.exit(1);
}

// Severity order. A page can match both `cookiewall` and `gone`; the one that changes what
// happens next wins, and stopping for a human always outranks anything automatic.
const ORDER = ['captcha', 'blocked', 'auth', 'ratelimit', 'gone', 'empty-shell', 'server', 'cookiewall'];
hits.sort((x, y) => ORDER.indexOf(x.verdict) - ORDER.indexOf(y.verdict));

if (hits.length) {
  const h = hits[0];
  const others = [...new Set(hits.slice(1).map((o) => o.verdict))].filter((v) => v !== h.verdict);
  console.log(
    `${h.verdict}\t${bank._verdicts[h.verdict]}\tmatched "${h.matched}"` +
    (h.note ? ` (${h.note})` : '') +
    (others.length ? ` [also: ${others.join(', ')}]` : ''),
  );
  process.exit(1);
}

// Optional positive assertion: the page is not broken, but is it the RIGHT page? A portal
// that silently redirects a dead posting to its search page reads as perfectly healthy.
if (a.expect && a.expect !== true) {
  if (!new RegExp(a.expect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text)) {
    console.log(`wrong-page\tThe page is healthy but does not contain the expected text. Likely a redirect to a search or landing page. Treat the posting as UNVERIFIED.\texpected "${a.expect}"`);
    process.exit(1);
  }
}

console.log(`ok\tPage read cleanly (${text.trim().length} chars). No screenshot is justified.\t-`);
