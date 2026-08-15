#!/usr/bin/env node
/**
 * discover-workday.mjs — find each employer's Workday CXS tenant/site path.
 *
 * Workday hosts a very large share of big employers and exposes none of the
 * Greenhouse/Lever-style feeds, so discover-ats.mjs will miss them entirely.
 * But the careers page's own JavaScript calls a machine-readable endpoint:
 *
 *   POST https://{host}/wday/cxs/{tenant}/{site}/jobs
 *   body {"appliedFacets":{},"limit":20,"offset":0,"searchText":"analyst"}
 *
 * `searchText` filters SERVER-SIDE, so Workday boards are fully searchable even
 * though they have no sitemap and are invisible to ordinary crawling.
 *
 * Response codes are diagnostic, and this script keys off them:
 *   200      -> confirmed; records the job count
 *   HTTP_500 -> path is RIGHT, tenant is erroring or in a Workday-wide outage.
 *               Recorded as `pending` so it is re-probed, not rediscovered.
 *   HTTP_422 -> path is WRONG. Discard the candidate.
 *
 *   node discover-workday.mjs          # probe candidates, merge into ats-feeds.json
 *   node discover-workday.mjs --dry    # probe and print only
 *   node discover-workday.mjs --retry  # re-probe only entries marked pending
 *
 * FINDING host/tenant/site: open the employer's careers page. The URL looks like
 * https://acme.wd5.myworkdayjobs.com/AcmeCareers -- host is `acme.wd5.myworkdayjobs.com`,
 * tenant is `acme`, site is `AcmeCareers`. If a guess returns 422, open the page
 * and read the actual CXS request in your browser's network tab.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = join(HERE, 'ats-feeds.json');
const CAND = existsSync(join(HERE, 'workday-candidates.json'))
  ? join(HERE, 'workday-candidates.json')
  : join(HERE, 'workday-candidates.example.json');

const DRY = process.argv.includes('--dry');
const RETRY_ONLY = process.argv.includes('--retry');
const TIMEOUT_MS = 15000;
const CONCURRENCY = 8;

async function probe({ host, site }) {
  const tenant = host.split('.')[0];
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://${host}/wday/cxs/${tenant}/${site}/jobs`, {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'jobscan/1.0' },
      body: JSON.stringify({ appliedFacets: {}, limit: 5, offset: 0, searchText: '' }),
    });
    const j = JSON.parse(await res.text());
    if (j.errorCode === 'HTTP_422') return { status: 'wrong-path' };
    if (j.errorCode) return { status: 'pending', note: j.errorCode };
    if (typeof j.total === 'number') return { status: 'ok', jobCount: j.total, tenant };
    return { status: 'bad', note: 'unexpected shape' };
  } catch (e) {
    return { status: 'bad', note: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally { clearTimeout(t); }
}

const registry = existsSync(REG) ? JSON.parse(readFileSync(REG, 'utf8')) : { feeds: [] };
const existing = (registry.feeds || []).filter((f) => f.ats === 'workday');

// In retry mode every queued entry is already in the registry with a path we
// previously accepted, so it is `known`: a timeout or 5xx must never delete it.
const queue = RETRY_ONLY
  ? existing.filter((f) => f.status === 'pending').map((f) => ({ ...f, known: true }))
  : (JSON.parse(readFileSync(CAND, 'utf8')).candidates || []);

if (!RETRY_ONLY && CAND.endsWith('.example.json')) {
  console.error('discover-workday: using workday-candidates.example.json. Copy it to workday-candidates.json and add your employers.');
}

console.error(`Probing ${queue.length} Workday candidate paths...`);
const confirmed = [], pending = [];
let i = 0;
async function worker() {
  while (i < queue.length) {
    const c = queue[i++];
    const r = await probe(c);
    if (r.status === 'ok') {
      confirmed.push({ employer: c.employer, sector: c.sector, ats: 'workday', host: c.host, tenant: r.tenant, site: c.site, jobCount: r.jobCount });
      console.error(`  OK       ${c.employer} -> ${c.host}/${c.site} (${r.jobCount} jobs)`);
    } else if (r.status === 'pending' || (c.known && r.status !== 'wrong-path')) {
      const note = r.note || 'no response';
      pending.push({ employer: c.employer, sector: c.sector, ats: 'workday', host: c.host, tenant: c.host.split('.')[0], site: c.site, status: 'pending', note });
      console.error(`  PENDING  ${c.employer} -> ${c.host}/${c.site} (${note}: path ${c.known ? 'previously verified' : 'looks right'}, tenant erroring/outage)`);
    } else if (c.known && r.status === 'wrong-path') {
      console.error(`  !! ${c.employer} -> ${c.host}/${c.site} now 422; a previously verified path went stale, re-discover it`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const best = new Map();
for (const f of [...pending, ...confirmed]) {
  const prev = best.get(f.employer);
  if (!prev || (f.jobCount ?? -1) > (prev.jobCount ?? -1)) best.set(f.employer, f);
}

// Safety net: never shrink the Workday side of the registry. Anything previously
// recorded that this run did not re-confirm is carried forward untouched, so an
// outage or a network blip can never silently delete discovered paths.
const merged = [...(registry.feeds || []).filter((f) => f.ats !== 'workday'), ...best.values()];
for (const old of existing) {
  if (!merged.some((f) => f.ats === 'workday' && f.host === old.host && f.site === old.site)) merged.push(old);
}
merged.sort((a, b) => a.employer.localeCompare(b.employer));

if (merged.filter((f) => f.ats === 'workday').length < existing.length) {
  console.error('REFUSING to write: Workday feed count would shrink. Registry left unchanged.');
  process.exit(1);
}

console.error(`\nConfirmed ${confirmed.length}, pending ${pending.length}`);
if (pending.length) console.error('Re-run with --retry later; pending paths are correct but the tenant was erroring.');

const out = { ...registry, generated: new Date().toISOString().slice(0, 10), feeds: merged };
if (DRY) console.log(JSON.stringify([...best.values()], null, 2));
else { writeFileSync(REG, JSON.stringify(out, null, 2) + '\n'); console.error(`Merged into ${REG} (${merged.length} feeds)`); }
