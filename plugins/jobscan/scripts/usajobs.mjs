#!/usr/bin/env node
// usajobs.mjs — query the USAJOBS Search API instead of scraping the public site.
//
// The public site is a JavaScript shell: a plain fetch, curl, or a scrape against a search
// URL all return nothing usable, every time. This is the structured route and it is free.
// See skills/job-search/references/portals.md, "USAJOBS specifically".
//
// The key is free and self-service at developer.usajobs.gov, and jobscan-onboarding already
// offers it to anyone whose field includes US federal work. It is read from the environment
// first, then from jobscan-config.md. It is never stored beside this script: the plugin folder
// is replaced wholesale on update, and nothing personal may live under it.
//
// Usage:
//   node usajobs.mjs --keyword "<term>" --location "<City, State>" --grade-low 9
//   node usajobs.mjs --keyword "<term>" --json          # raw listing objects
//   node usajobs.mjs --keyword "<term>" --since 14      # posted in the last 14 days
//   node usajobs.mjs --keyword "<term>" --table         # human-readable
//   node usajobs.mjs --selftest                         # verify the key works
//
// Output defaults to the scan's listing shape (one JSON array on stdout), so it drops straight
// into triage.mjs without a model reading a single posting.

import { configValue } from './paths.mjs';

const REGISTER = 'Register a free key at https://developer.usajobs.gov, then either set ' +
  'USAJOBS_API_KEY and USAJOBS_USER_AGENT, or add usajobs_api_key: and usajobs_user_agent: to ' +
  'your jobscan-config.md. The user agent is the EMAIL ADDRESS the key was registered with.';

function loadCreds() {
  const key = process.env.USAJOBS_API_KEY || configValue('usajobs_api_key');
  const agent = process.env.USAJOBS_USER_AGENT
    || configValue('usajobs_user_agent')
    || configValue('email');

  if (!key) throw new Error(`No USAJOBS API key configured.\n${REGISTER}`);
  if (!agent) {
    throw new Error(
      'A USAJOBS key is configured but no user agent is.\n' +
      'USAJOBS requires the User-Agent header to be the email address the key was registered ' +
      `with, not a browser string.\n${REGISTER}`,
    );
  }
  return { authorizationKey: key, userAgent: agent };
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

// The API caps ResultsPerPage at 500, but pages beyond the first are where the noise lives.
// One page of 50 is the scan default, matching the "cap results, do not paginate" rule in
// portals.md.
async function search(params, creds) {
  const url = new URL('https://data.usajobs.gov/api/search');
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== true) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: {
      'Authorization-Key': creds.authorizationKey,
      'User-Agent': creds.userAgent,
      Host: 'data.usajobs.gov',
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `HTTP ${res.status} from USAJOBS. The usual cause is a User-Agent that is not the ` +
      `registered email address, not a bad key. Current User-Agent: ${creds.userAgent}`,
    );
  }
  if (res.status === 429) throw new Error('HTTP 429 — rate limited. Back off, do not retry this call.');
  if (!res.ok) throw new Error(`HTTP ${res.status} from USAJOBS`);
  return res.json();
}

/** Flatten one MatchedObjectDescriptor into the scan's listing shape. */
function toListing(item) {
  const d = item.MatchedObjectDescriptor || {};
  const pay = (d.PositionRemuneration || [])[0] || {};
  const min = Number(pay.MinimumRange) || null;
  const max = Number(pay.MaximumRange) || null;
  // The API reports Per Year / Per Hour. Normalise hourly to an annual figure so the salary
  // gate in triage.mjs compares like with like — the same rule salary.mjs already applies to
  // feed data, and for the same reason: an hourly rate measured against an annual floor
  // rejects every posting on the board.
  const hourly = (pay.RateIntervalCode || '').toLowerCase().startsWith('per hour');
  const ann = (n) => (n == null ? null : hourly ? Math.round(n * 2087) : n);
  return {
    source: 'usajobs-api',
    id: item.MatchedObjectId,
    title: d.PositionTitle || '',
    employer: (d.OrganizationName || d.DepartmentName || 'US Federal Government'),
    department: d.DepartmentName || '',
    location: d.PositionLocationDisplay || '',
    locations: (d.PositionLocation || []).map((l) => l.LocationName),
    url: d.PositionURI || '',
    applyUrl: (d.ApplyURI || [])[0] || d.PositionURI || '',
    posted: d.PublicationStartDate || '',
    closes: d.ApplicationCloseDate || '',
    salaryMin: ann(min),
    salaryMax: ann(max),
    salaryRaw: min && max ? `${min} - ${max} ${pay.RateIntervalCode || ''}`.trim() : null,
    grade: [d.JobGrade?.[0]?.Code, d.UserArea?.Details?.LowGrade, d.UserArea?.Details?.HighGrade]
      .filter(Boolean).join(' '),
    schedule: d.PositionSchedule?.[0]?.Name || '',
    remote: d.UserArea?.Details?.TeleworkEligible ?? null,
    summary: (d.UserArea?.Details?.JobSummary || '').slice(0, 1200),
    who: d.UserArea?.Details?.WhoMayApply?.Name || '',
  };
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const creds = loadCreds();

  if (a.selftest) {
    const term = typeof a.keyword === 'string' ? a.keyword : 'scientist';
    const j = await search({ Keyword: term, ResultsPerPage: 1 }, creds);
    const n = j?.SearchResult?.SearchResultCountAll ?? 0;
    console.log(`ok  USAJOBS Search API reachable; "${term}" returns ${n} open announcements.`);
    return;
  }

  const params = {
    Keyword: a.keyword || a.k,
    PositionTitle: a.title,
    LocationName: a.location || a.l,
    Organization: a.org,
    JobCategoryCode: a.series,           // the federal occupational series code, if you know it
    PayGradeLow: a['grade-low'],
    PayGradeHigh: a['grade-high'],
    RemunerationMinimumAmount: a['salary-min'],
    DatePosted: a.since,                 // whole days back, max 60
    ResultsPerPage: a.limit || 50,
    Page: 1,
    SortField: 'OpenDate',
    SortDirection: 'Desc',
  };

  const j = await search(params, creds);
  const items = j?.SearchResult?.SearchResultItems || [];
  if (a.json) { console.log(JSON.stringify(items, null, 2)); return; }

  const listings = items.map(toListing);
  if (a.table) {
    for (const L of listings) {
      console.log(`${(L.grade || '-').padEnd(12)} ${String(L.salaryMin ?? '-').padStart(7)}  ${L.title}  |  ${L.employer}  |  ${L.location}  |  closes ${L.closes}`);
    }
    console.error(`\n${listings.length} of ${j.SearchResult.SearchResultCountAll} total`);
    return;
  }
  console.log(JSON.stringify(listings, null, 2));
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
