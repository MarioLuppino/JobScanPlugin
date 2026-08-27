#!/usr/bin/env node
/**
 * scan-postmortem.mjs — turn a session transcript into a run report without
 * reading the transcript into a model's context.
 *
 * A finished scan leaves a complete record on disk as JSONL. Everything worth
 * knowing about what a run cost is mechanical: which tool was called, how often,
 * whether it errored, how large the result was, and how long the gap was before
 * the next event. That is grep work, not model work, so it is free. Reading a
 * few hundred thousand tokens back to answer it is the most expensive possible
 * way to run wc.
 *
 * HARNESS-SPECIFIC. It reads Claude Code's transcript directory. On any other
 * harness it will find nothing and say so, which is the correct behaviour.
 *
 * It deliberately never prints message content — only tool names, counts, sizes,
 * error snippets and timestamps.
 *
 * Usage:
 *   node scan-postmortem.mjs --list              profile every session, newest first
 *   node scan-postmortem.mjs <sessionId|path>    full report for one run
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';

const PROJECTS = process.env.JOBSCAN_TRANSCRIPTS || join(homedir(), '.claude', 'projects');

function sessionFiles() {
  if (!existsSync(PROJECTS)) return [];
  const out = [];
  for (const proj of readdirSync(PROJECTS)) {
    const dir = join(PROJECTS, proj);
    let entries;
    try { entries = readdirSync(dir); } catch { continue; }
    for (const f of entries) {
      if (f.endsWith('.jsonl')) out.push({ proj, id: f.replace(/\.jsonl$/, ''), path: join(dir, f) });
    }
  }
  return out;
}

/**
 * A project directory is named after the absolute path it was opened in, which
 * makes it long and machine-specific. Show only its tail: enough to tell two
 * projects apart, without printing somebody's home directory across the report.
 */
function shortProject(slug) {
  const tail = slug.replace(/^[A-Za-z]--/, '').split('-').filter(Boolean).slice(-3).join('-');
  return (tail || slug).slice(-30);
}

/** Parse one transcript into per-event facts. Never returns message bodies. */
function profile(path) {
  const lines = readFileSync(path, 'utf8').split('\n');
  const tools = new Map();
  const errors = [];
  const stamps = [];
  let assistantTurns = 0, userTurns = 0, sidechains = 0;
  let inputTok = 0, outputTok = 0, cacheRead = 0, cacheWrite = 0;
  const idToName = new Map();
  let title = null, cwd = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.timestamp) stamps.push(Date.parse(o.timestamp));
    if (o.cwd && !cwd) cwd = o.cwd;
    if (o.type === 'custom-title' && o.content) title = o.content;
    if (o.isSidechain) sidechains++;

    if (o.type === 'assistant') {
      assistantTurns++;
      const u = o.message && o.message.usage;
      if (u) {
        inputTok += u.input_tokens || 0;
        outputTok += u.output_tokens || 0;
        cacheRead += u.cache_read_input_tokens || 0;
        cacheWrite += u.cache_creation_input_tokens || 0;
      }
      const content = (o.message && o.message.content) || [];
      for (const c of content) {
        if (c.type === 'tool_use') {
          idToName.set(c.id, c.name);
          const e = tools.get(c.name) || { calls: 0, errors: 0, bytes: 0 };
          e.calls++;
          tools.set(c.name, e);
        }
      }
    }

    if (o.type === 'user') {
      userTurns++;
      const content = o.message && o.message.content;
      for (const c of Array.isArray(content) ? content : []) {
        if (c.type !== 'tool_result') continue;
        const name = idToName.get(c.tool_use_id) || 'unknown';
        const e = tools.get(name) || { calls: 0, errors: 0, bytes: 0 };
        const body = typeof c.content === 'string' ? c.content : JSON.stringify(c.content == null ? '' : c.content);
        e.bytes += body.length;
        if (c.is_error) {
          e.errors++;
          errors.push({ tool: name, snippet: body.replace(/\s+/g, ' ').slice(0, 180) });
        }
        tools.set(name, e);
      }
    }
  }

  stamps.sort((a, b) => a - b);
  const start = stamps[0], end = stamps[stamps.length - 1];
  const gaps = [];
  for (let i = 1; i < stamps.length; i++) {
    const d = stamps[i] - stamps[i - 1];
    if (d > 20000) gaps.push({ at: stamps[i - 1], sec: Math.round(d / 1000) });
  }

  return {
    path, title, cwd, start, end,
    minutes: start && end ? Math.round((end - start) / 60000) : 0,
    assistantTurns, userTurns, sidechains,
    inputTok, outputTok, cacheRead, cacheWrite,
    billable: inputTok + outputTok + cacheWrite,
    tools, errors, gaps,
    bytes: statSync(path).size,
  };
}

const fmt = (n) => n.toLocaleString('en-US');
const k = (n) => (n >= 1000 ? Math.round(n / 1000) + 'k' : String(n));

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--list') {
  const all = sessionFiles();
  if (!all.length) {
    console.log(`no transcripts under ${PROJECTS}. This tool reads Claude Code session logs; set JOBSCAN_TRANSCRIPTS if yours are elsewhere.`);
    process.exit(0);
  }
  const rows = all.map((s) => {
    try { return Object.assign({}, s, profile(s.path)); } catch { return null; }
  }).filter(Boolean).sort((a, b) => (b.end || 0) - (a.end || 0));

  console.log('\nsession                               ended             min   calls  err   tokens  project');
  console.log('-'.repeat(112));
  for (const r of rows.slice(0, 25)) {
    let calls = 0, errs = 0;
    for (const e of r.tools.values()) { calls += e.calls; errs += e.errors; }
    const when = r.end ? new Date(r.end).toISOString().slice(0, 16).replace('T', ' ') : '?';
    console.log(
      r.id.slice(0, 36) + '  ' + when +
      '  ' + String(r.minutes).padStart(4) +
      '  ' + String(calls).padStart(5) +
      '  ' + String(errs).padStart(3) +
      '  ' + k(r.billable).padStart(7) +
      '  ' + (r.title || shortProject(r.proj))
    );
  }
  console.log('\nRun: node scan-postmortem.mjs <session>  for one run in full.\n');
  process.exit(0);
}

const target = args[0];
const found = target.includes('/') || target.includes('\\')
  ? { path: target }
  : sessionFiles().find((s) => s.id.startsWith(target));
if (!found) { console.error('no session matching ' + target); process.exit(1); }

const r = profile(found.path);
console.log('\n=== ' + basename(r.path) + ' ===');
console.log('title      ' + (r.title || '(none)'));
console.log('window     ' + new Date(r.start).toISOString().slice(0, 16).replace('T', ' ') +
  ' -> ' + new Date(r.end).toISOString().slice(11, 16) + '  (' + r.minutes + ' min)');
console.log('turns      ' + r.assistantTurns + ' assistant / ' + r.userTurns + ' user / ' + r.sidechains + ' sidechain events');
console.log('tokens     in ' + fmt(r.inputTok) + ' | out ' + fmt(r.outputTok) +
  ' | cache-write ' + fmt(r.cacheWrite) + ' | cache-read ' + fmt(r.cacheRead));
console.log('           billable ~' + fmt(r.billable) + '  (cache reads billed at a discount, excluded)');

console.log('\n--- tool usage, by result volume (what context actually costs) ---');
const rows = [...r.tools.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
console.log('tool                                  calls   err         result bytes   tokens');
let tb = 0, tc = 0, te = 0;
for (const [name, e] of rows) {
  tb += e.bytes; tc += e.calls; te += e.errors;
  console.log(
    name.slice(0, 36).padEnd(36) + '  ' + String(e.calls).padStart(5) + '  ' +
    String(e.errors).padStart(3) + '  ' + fmt(e.bytes).padStart(19) + '  ' +
    k(Math.round(e.bytes / 4)).padStart(7)
  );
}
console.log('TOTAL'.padEnd(36) + '  ' + String(tc).padStart(5) + '  ' + String(te).padStart(3) +
  '  ' + fmt(tb).padStart(19) + '  ' + k(Math.round(tb / 4)).padStart(7));

if (r.errors.length) {
  console.log('\n--- failures (' + r.errors.length + ') ---');
  const byTool = new Map();
  for (const e of r.errors) {
    const g = byTool.get(e.tool) || [];
    g.push(e.snippet);
    byTool.set(e.tool, g);
  }
  for (const [tool, list] of byTool) {
    console.log('\n  ' + tool + ' (' + list.length + ')');
    const seen = new Set();
    for (const s of list) {
      const key = s.slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      console.log('    - ' + s);
      if (seen.size >= 5) { console.log('    ... ' + (list.length - 5) + ' more'); break; }
    }
  }
}

if (r.gaps.length) {
  const stalled = r.gaps.reduce((a, g) => a + g.sec, 0);
  const top = r.gaps.slice().sort((a, b) => b.sec - a.sec).slice(0, 12);
  console.log('\n--- where the wall clock went (' + r.gaps.length + ' gaps >20s, ' +
    Math.round(stalled / 60) + ' min total) ---');
  for (const g of top) {
    console.log('    ' + String(g.sec).padStart(5) + 's  at ' + new Date(g.at).toISOString().slice(11, 19));
  }
}
console.log();
