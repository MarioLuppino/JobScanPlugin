#!/usr/bin/env node
/**
 * harvest-employers.mjs — turn a plain list of employer NAMES into registry
 * entries, so a broad first sweep can be converted into permanent free feeds.
 *
 * WHY THIS EXISTS: the ATS pipeline is only as good as employers.json, and that
 * file has always been filled from what the user could name off the top of their
 * head at onboarding -- which is a handful of employers, biased toward the famous
 * ones. Meanwhile the expensive part of a first scan, searching the open web, is
 * already surfacing the employers who actually post the user's roles. Those names
 * were being thrown away with the postings.
 *
 * A posting expires in weeks. A confirmed feed keeps returning every open role at
 * that employer, free, forever. So the durable output of a first scan is the
 * employer list, not the job list -- this is the step that keeps it.
 *
 *   <names>  | node harvest-employers.mjs --sector university
 *   <names>  | node harvest-employers.mjs --dry        # print, write nothing
 *
 * INPUT (stdin), one employer per line. Blank lines and lines starting with # are
 * ignored. A line is either:
 *     Fred Hutchinson Cancer Center
 *     Fred Hutchinson Cancer Center | university
 *     Fred Hutchinson Cancer Center | university | fredhutch,fhcrc
 * The third field is for slugs you already know; guessed ones are added anyway.
 *
 * OUTPUT: merged into <data_path>/ats/employers.json. Existing employers keep
 * their entries and gain any new candidate slugs; nothing is ever removed, so
 * running this twice is safe. Then run discover-ats.mjs (and discover-workday.mjs)
 * to find which of the guesses are real.
 *
 * Module: import { slugCandidates } from './harvest-employers.mjs'
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { readPath, writePath } from './paths.mjs';

/** Legal-form words that are almost never in an employer's board slug. */
const LEGAL = new Set([
  'inc', 'incorporated', 'llc', 'llp', 'lp', 'ltd', 'limited', 'plc', 'corp',
  'corporation', 'company', 'co', 'gmbh', 'ag', 'sa', 'nv', 'bv', 'pty',
]);

/**
 * Descriptive tail words employers routinely drop from their own slug: the board
 * for "Example Research Institute" is far more often /example than
 * /exampleresearchinstitute. Stripping these produces a second guess, never a
 * replacement -- both spellings are probed, and probing is free.
 */
const DESCRIPTOR = new Set([
  'university', 'college', 'school', 'institute', 'institution', 'center',
  'centre', 'foundation', 'trust', 'hospital', 'health', 'healthcare', 'medical',
  'system', 'systems', 'laboratory', 'laboratories', 'labs', 'lab', 'association',
  'society', 'services', 'service', 'solutions', 'technologies', 'technology',
  'international', 'global', 'worldwide', 'group', 'holdings', 'partners',
  'consulting', 'consultants', 'sciences', 'science', 'research', 'department',
]);

const MAX_SLUGS = 8;

/**
 * Candidate board slugs for an employer name, most likely first.
 *
 * Every ATS builds its board path from the company name in one of a small number
 * of ways, so guessing is cheap and effective -- discover-ats.mjs probes each
 * against five APIs and keeps only the ones that answer with real postings. The
 * cost of a wrong guess is one HTTP request; the cost of a missing guess is an
 * employer whose entire board the user never sees.
 *
 * @param {string} name
 * @returns {string[]} de-duplicated, capped at MAX_SLUGS
 */
export function slugCandidates(name) {
  const words = String(name || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean);

  if (!words.length) return [];
  const base = words[0] === 'the' ? words.slice(1) : words;
  if (!base.length) return [];

  const core = base.filter((w) => !LEGAL.has(w));
  const stem = core.filter((w) => !DESCRIPTOR.has(w));

  const out = [];
  const push = (arr, joiner) => {
    if (!arr.length) return;
    const s = arr.join(joiner);
    if (s.length >= 2 && !out.includes(s)) out.push(s);
  };

  push(core, '');
  push(core, '-');
  if (stem.length && stem.length !== core.length) {
    push(stem, '');
    push(stem, '-');
  }
  const lead = stem.length ? stem : core;
  if (lead.length > 2) {
    push(lead.slice(0, 2), '');
    push(lead.slice(0, 2), '-');
  }
  if (lead.length > 1 && lead[0].length >= 5) push([lead[0]], '');
  // Acronyms are how many universities, agencies and research institutes are
  // actually addressed, and are often the slug.
  if (core.length >= 3) push([core.map((w) => w[0]).join('')], '');

  return out.slice(0, MAX_SLUGS);
}

/** Parse the stdin format documented in the header. */
export function parseLines(text, defaultSector) {
  const seen = new Map();
  for (const line of String(text).split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [rawName, rawSector, rawSlugs] = t.split('|').map((c) => (c || '').trim());
    if (!rawName) continue;
    const key = rawName.toLowerCase();
    const known = (rawSlugs || '').split(',').map((s) => s.trim()).filter(Boolean);
    const entry = seen.get(key) || { employer: rawName, sector: rawSector || defaultSector, slugs: [] };
    if (rawSector) entry.sector = rawSector;
    for (const s of [...known, ...slugCandidates(rawName)]) {
      if (!entry.slugs.includes(s)) entry.slugs.push(s);
    }
    seen.set(key, entry);
  }
  return [...seen.values()];
}

// ---- CLI ----
if (process.argv[1]?.endsWith('harvest-employers.mjs')) {
  const DRY = process.argv.includes('--dry');
  const si = process.argv.indexOf('--sector');
  const DEFAULT_SECTOR = si > -1 ? process.argv[si + 1] : 'industry';

  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (raw += d));
  process.stdin.on('end', () => {
    const harvested = parseLines(raw, DEFAULT_SECTOR);
    if (!harvested.length) {
      console.error('harvest-employers: nothing on stdin. One employer name per line.');
      process.exit(1);
    }

    // Merge, never replace: an employer already in the registry keeps its sector
    // and gains only slugs it did not have. Losing a hand-corrected slug here
    // would take a working feed offline with no error anywhere.
    const prior = readPath('employers.json');
    const existing = prior && !prior.isExample
      ? JSON.parse(readFileSync(prior.path, 'utf8'))
      : { _comment: 'Target employers for discover-ats.mjs. Generated and merged by harvest-employers.mjs.', employers: [] };
    const list = existing.employers || [];
    const byName = new Map(list.map((e) => [String(e.employer).toLowerCase(), e]));

    let added = 0, widened = 0;
    for (const h of harvested) {
      const cur = byName.get(h.employer.toLowerCase());
      if (!cur) {
        list.push(h);
        byName.set(h.employer.toLowerCase(), h);
        added++;
        continue;
      }
      const before = (cur.slugs || []).length;
      cur.slugs = [...new Set([...(cur.slugs || []), ...h.slugs])];
      if (cur.slugs.length > before) widened++;
    }
    list.sort((a, b) => String(a.employer).localeCompare(String(b.employer)));
    existing.employers = list;

    console.error(`harvest-employers: ${harvested.length} name(s) in -> ${added} new employer(s), ${widened} widened, ${list.length} in the registry`);
    if (DRY) {
      console.log(JSON.stringify(existing, null, 2));
    } else {
      const out = writePath('employers.json');
      writeFileSync(out, JSON.stringify(existing, null, 2) + '\n');
      console.error(`harvest-employers: wrote ${out}`);
      console.error('harvest-employers: next, confirm which guesses are real -> node discover-ats.mjs');
    }
  });
}
