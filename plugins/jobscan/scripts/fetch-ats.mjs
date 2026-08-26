#!/usr/bin/env node
/**
 * fetch-ats.mjs — pull every registered employer's open roles straight from the
 * public job-board APIs their ATS already exposes, then triage them, all before
 * anything reaches an AI context.
 *
 * WHY: most employers' real listings live in an applicant tracking system that
 * publishes a free, public JSON endpoint. One request returns every open role at
 * that employer -- no keyword guessing, no scraping, no paid API. This replaces
 * the bulk of a keyword search sweep and costs nothing.
 *
 *   node fetch-ats.mjs                     # normalized match+review as JSON
 *   node fetch-ats.mjs --summary           # per-employer counts, human readable
 *   node fetch-ats.mjs --all               # include excluded rows, for auditing
 *   node fetch-ats.mjs | node dedup.mjs    # full cheap half of a scan
 *
 * Reads <data_path>/ats/ats-feeds.json (see ats-feeds.example.json here for the
 * shape). Build it with discover-ats.mjs and discover-workday.mjs.
 */

import { readFileSync } from 'node:fs';
import { triageAll } from './triage.mjs';
import { salaryMinFrom } from './salary.mjs';
import { readPath, ATS_DIR } from './paths.mjs';

const REG = readPath('ats-feeds.json', 'ats-feeds.example.json');
if (!REG) {
  console.error('fetch-ats: no employer registry. Run discover-ats.mjs first.');
  process.exit(1);
}
if (REG.isExample) {
  console.error(
    'fetch-ats: using ats-feeds.example.json (sample employers, not yours).\n' +
    `           Run discover-ats.mjs to build ${ATS_DIR}/ats-feeds.json.`
  );
}
const REGISTRY = JSON.parse(readFileSync(REG.path, 'utf8'));

const TIMEOUT_MS = 20000;
const CONCURRENCY = 6;
const ALL = process.argv.includes('--all');
const SUMMARY = process.argv.includes('--summary');

/**
 * Boards big enough that pulling every posting is wasteful. For these we ask the
 * ATS to filter server-side instead. Set `keywords` in ats-feeds.json.
 */
const BIG_BOARD = 400;
const KEYWORDS = REGISTRY.keywords?.length ? REGISTRY.keywords : ['analyst', 'scientist', 'manager', 'specialist'];

async function getJSON(url, opts = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: ctl.signal,
      headers: { 'User-Agent': 'jobscan/1.0', Accept: 'application/json', ...(opts.headers || {}) },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Pull a balanced JSON array out of embedded page markup starting at `key`.
 * Tracks string state and escapes so brackets inside descriptions don't end it.
 */
function extractJsonArray(html, key) {
  const at = html.indexOf(key);
  if (at === -1) return null;
  const start = html.indexOf('[', at);
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '[') depth++;
    else if (c === ']' && --depth === 0) return html.slice(start, i + 1);
  }
  return null;
}

/** Each adapter returns a normalized array of postings. */
const ADAPTERS = {
  async greenhouse(f) {
    const j = await getJSON(`https://boards-api.greenhouse.io/v1/boards/${f.slug}/jobs`);
    return (j?.jobs || []).map((x) => ({
      title: x.title, url: x.absolute_url, location: x.location?.name || '', posted: x.updated_at || null,
      salaryMin: salaryMinFrom(x),
    }));
  },

  async lever(f) {
    const j = await getJSON(`https://api.lever.co/v0/postings/${f.slug}?mode=json`);
    return (j || []).map((x) => ({
      title: x.text, url: x.hostedUrl, location: x.categories?.location || '',
      posted: x.createdAt ? new Date(x.createdAt).toISOString() : null,
      salaryMin: salaryMinFrom(x),
    }));
  },

  async ashby(f) {
    const j = await getJSON(`https://api.ashbyhq.com/posting-api/job-board/${f.slug}`);
    return (j?.jobs || []).map((x) => ({
      title: x.title, url: x.jobUrl, location: x.location || '', posted: x.publishedAt || null,
      salaryMin: salaryMinFrom(x),
    }));
  },

  async workable(f) {
    const j = await getJSON(`https://apply.workable.com/api/v1/widget/accounts/${f.slug}?details=true`);
    return (j?.jobs || []).map((x) => ({
      title: x.title, url: x.url || x.application_url,
      location: [x.city, x.state, x.country].filter(Boolean).join(', '), posted: x.published_on || null,
      salaryMin: salaryMinFrom(x),
    }));
  },

  async smartrecruiters(f) {
    const base = `https://api.smartrecruiters.com/v1/companies/${f.slug}/postings`;
    const seen = new Map();
    const collect = (j) => {
      for (const x of j?.content || []) {
        if (seen.has(x.id)) continue;
        const l = x.location || {};
        seen.set(x.id, {
          title: x.name,
          url: `https://jobs.smartrecruiters.com/${f.slug}/${x.id}`,
          location: [l.city, l.region, l.country].filter(Boolean).join(', '),
          posted: x.releasedDate || null,
          salaryMin: salaryMinFrom(x),
        });
      }
    };
    if (f.jobCount > BIG_BOARD) {
      for (const kw of KEYWORDS) collect(await getJSON(`${base}?limit=100&q=${encodeURIComponent(kw)}`));
    } else {
      for (let o = 0; o < Math.min((f.jobCount || 100) + 100, 1000); o += 100) {
        const j = await getJSON(`${base}?limit=100&offset=${o}`);
        if (!j?.content?.length) break;
        collect(j);
      }
    }
    return [...seen.values()];
  },

  /**
   * Workday. Calls the same CXS endpoint the careers page's own JavaScript uses.
   * `searchText` filters SERVER-SIDE, so Workday boards are fully searchable
   * despite having no sitemap and being invisible to ordinary crawling.
   *
   * Error codes are diagnostic -- read them instead of guessing:
   *   HTTP_422 -> tenant/site path is WRONG (by far the most common cause)
   *   HTTP_500 -> path is right; tenant is erroring or in a Workday outage, retry later
   */
  async workday(f) {
    const base = `https://${f.host}/wday/cxs/${f.tenant}/${f.site}/jobs`;
    const seen = new Map();
    for (const kw of KEYWORDS) {
      const j = await getJSON(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: kw }),
      });
      if (j?.errorCode) {
        console.error(`  !! ${f.employer} workday ${j.errorCode} (${j.errorCode === 'HTTP_422' ? 'bad tenant/site path' : 'tenant erroring or in outage'})`);
        break;
      }
      for (const x of j?.jobPostings || []) {
        if (seen.has(x.externalPath)) continue;
        seen.set(x.externalPath, {
          title: x.title,
          url: `https://${f.host}/en-US/${f.site}${x.externalPath}`,
          location: x.locationsText || '', posted: x.postedOn || null,
          salaryMin: salaryMinFrom(x),
        });
      }
    }
    return [...seen.values()];
  },

  /**
   * Paylocity. No public JSON API exists: the board is a React app and the
   * network tab shows no XHR for job data. The postings are embedded in the
   * initial HTML as a "Jobs":[...] array, so we fetch the page and extract it.
   * The company GUID is visible in the board URL.
   */
  async paylocity(f) {
    const url = `https://recruiting.paylocity.com/recruiting/jobs/All/${f.guid}/${f.companySlug}`;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    let html;
    try {
      const res = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) return [];
      html = await res.text();
    } catch { return []; } finally { clearTimeout(t); }

    const arr = extractJsonArray(html, '"Jobs":');
    if (!arr) return [];
    let jobs;
    try { jobs = JSON.parse(arr); } catch { return []; }
    return jobs.map((x) => ({
      title: x.JobTitle,
      url: `https://recruiting.paylocity.com/recruiting/jobs/Details/${x.JobId}`,
      location: x.LocationName || '', posted: x.PublishedDate || null,
      salaryMin: salaryMinFrom(x),
    }));
  },
};

const feeds = REGISTRY.feeds || [];
const results = [];
const perEmployer = [];
let idx = 0;

async function worker() {
  while (idx < feeds.length) {
    const f = feeds[idx++];
    const adapter = ADAPTERS[f.ats];
    if (!adapter) { console.error(`  !! unknown ats "${f.ats}" for ${f.employer}`); continue; }
    let jobs = [];
    try { jobs = await adapter(f); } catch (e) { console.error(`  !! ${f.employer}: ${e.message}`); }
    perEmployer.push({ employer: f.employer, ats: f.ats, pulled: jobs.length });
    results.push(...jobs.map((j) => ({ ...j, employer: f.employer, sector: f.sector, ats: f.ats })));
  }
}

console.error(`Fetching ${feeds.length} ATS feeds (public APIs, free)...`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const b = triageAll(results);
const pct = ((b.exclude.length / (results.length || 1)) * 100).toFixed(0);
console.error(`\nPulled ${results.length} postings -> match ${b.match.length}, review ${b.review.length}, excluded ${b.exclude.length} (${pct}% rejected at zero token cost)`);

if (SUMMARY) {
  perEmployer.sort((a, c) => c.pulled - a.pulled)
    .forEach((p) => console.error(`  ${String(p.pulled).padStart(5)}  ${p.employer} (${p.ats})`));
  console.error('\n--- MATCH ---');
  b.match.forEach((m) => console.error(`  ${m.employer} | ${m.title} | ${m.location}`));
  console.error('\n--- REVIEW (first 40) ---');
  b.review.slice(0, 40).forEach((m) => console.error(`  ${m.employer} | ${m.title} | ${m.location}`));
} else {
  console.log(JSON.stringify(ALL ? results : [...b.match, ...b.review], null, 2));
}
