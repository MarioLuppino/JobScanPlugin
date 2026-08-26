#!/usr/bin/env node
/**
 * test-triage.mjs — regression tests for triage.mjs, dedup.mjs, salary.mjs and
 * harvest-employers.mjs: everything that decides, for free, what the scan is
 * allowed to spend money on.
 *
 * Run after ANY edit to your pattern lists:  node test-triage.mjs
 *
 * These run against triage-config.example.json's generic defaults. Once you write
 * your own triage-config.json, EDIT THE CASES BELOW to match your field -- the
 * point is to lock in your own decisions, not these placeholders.
 *
 * Two cases encode bugs that really shipped and are worth keeping in some form:
 *   - a reject pattern written as /hygien\b/ never fires on "hygiene", because
 *     \b cannot match between "n" and "e". Prefix patterns must not end in \b.
 *   - two unrelated employers collided on a single generic word in their names,
 *     so a genuinely new employer was suppressed as a duplicate.
 */

import { triage, ageInDays } from './triage.mjs';
import { screen } from './dedup.mjs';
import { salaryMinFrom, toAnnual } from './salary.mjs';
import { slugCandidates } from './harvest-employers.mjs';

let failed = 0;
const check = (label, got, want) => {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${label} -> ${got}${ok ? '' : ` (want ${want})`}`);
};

console.log('\n-- sub-professional tier and wrong occupations are excluded --');
for (const t of [
  'Data Technician', 'Research Assistant Intern', 'Seasonal Warehouse Associate',
  'Delivery Driver', 'Front Desk Receptionist', 'Security Guard',
]) check(t, triage({ title: t, location: 'Remote', sector: 'industry' }).verdict, 'exclude');

console.log('\n-- domain titles match (these mirror triage-config.example.json) --');
for (const t of [
  'Data Analyst', 'Senior Research Scientist', 'Program Manager',
  'Project Manager', 'Policy Analyst', 'Grants Administrator',
]) check(t, triage({ title: t, location: 'Seattle, WA', sector: 'government' }).verdict, 'match');

console.log('\n-- hard gates --');
check('salary below floor', triage({ title: 'Data Analyst', location: 'WA', salaryMin: 40000 }).verdict, 'exclude');
check('salary above floor', triage({ title: 'Data Analyst', location: 'WA', salaryMin: 90000 }).verdict, 'match');
check('salary absent is not a reject', triage({ title: 'Data Analyst', location: 'WA', salaryMin: null }).verdict, 'match');
check('domain title, unworkable location', triage({ title: 'Data Analyst', location: 'Berlin, Germany' }).verdict, 'review');

console.log('\n-- generic titles need a relevant sector --');
check('generic at relevant sector', triage({ title: 'Senior Coordinator', location: 'WA', sector: 'government' }).verdict, 'review');
check('generic at unlisted sector', triage({ title: 'Senior Coordinator', location: 'WA', sector: 'retail' }).verdict, 'exclude');
check('reject beats domain match', triage({ title: 'Data Analyst Intern', location: 'WA', sector: 'government' }).verdict, 'exclude');

console.log('\n-- dedup: employer identity needs a DISTINCTIVE shared token --');
const idx = [
  { n: '12', employer: 'Acme Environmental', role: 'Field Data Analyst', eTok: ['acme', 'environmental'], rTok: ['field', 'data', 'analyst'] },
  { n: '15', employer: 'Globex Corporation', role: 'Program Manager', eTok: ['globex'], rTok: ['program', 'manager'] },
];
check('different employer sharing only a filler word',
  screen({ employer: 'Vertex Environmental Solutions', title: 'Policy Analyst', url: 'u1' }, idx, {}).verdict, 'new');
check('same employer, same role', screen({ employer: 'Acme Environmental', title: 'Field Data Analyst', url: 'u2' }, idx, {}).verdict, 'duplicate');
check('same employer, different role', screen({ employer: 'Globex Corporation', title: 'Data Scientist', url: 'u3' }, idx, {}).verdict, 'adjacent');
check('URL already in seen cache',
  screen({ employer: 'Anything', title: 'Anything', url: 'seen' }, idx, { seen: { verdict: 'duplicate', date: '2026-01-01' } }).verdict, 'seen');

console.log('\n-- salary: every period normalises to an annual figure --');
check('greenhouse cents', salaryMinFrom({ pay_input_ranges: [{ min_cents: 9500000, max_cents: 12000000 }] }), 95000);
check('lever annual range', salaryMinFrom({ salaryRange: { min: 85000, max: 110000, interval: 'per-year-salary' } }), 85000);
check('ashby salary component', salaryMinFrom({ compensation: { summaryComponents: [{ compensationType: 'Salary', minValue: 72000, interval: 'PER_YEAR' }] } }), 72000);
check('hourly rate becomes annual', salaryMinFrom({ salary: { min: 45, interval: 'hourly' } }), 45 * 2080);
check('monthly rate becomes annual', salaryMinFrom({ compensation: { min: 6000, period: 'month' } }), 72000);
check('flat annual with no period stated', salaryMinFrom({ payRangeMin: 88000 }), 88000);

console.log('\n-- salary: an unreadable figure is NOT a number (a guess discards real jobs) --');
check('no compensation at all', salaryMinFrom({ title: 'Data Analyst', location: 'WA' }), null);
check('small figure, no period stated', salaryMinFrom({ salary: { min: 45 } }), null);
check('equity component is not pay', salaryMinFrom({ compensation: { summaryComponents: [{ compensationType: 'Equity', minValue: 40000, interval: 'PER_YEAR' }] } }), null);
check('numbers outside pay fields are never mined', salaryMinFrom({ description: 'min 5 years', metadata: { min: 3 } }), null);
check('several tiers -> the highest minimum, so the gate cannot over-reject',
  salaryMinFrom({ compensation: { tiers: [{ min: 60000, interval: 'year' }, { min: 75000, interval: 'year' }] } }), 75000);
check('period wins over magnitude', toAnnual(45, 'hour'), 93600);
check('ambiguous magnitude yields nothing', toAnnual(45, null), null);

console.log('\n-- posting age: only gates when a cutoff is configured --');
const aged = { salaryFloor: 0, match: [/\bdata\s+analyst\b/i], exclude: [], generic: null, sectors: new Set(), locationHint: null };
const day = 86400000;
const iso = (d) => new Date(Date.now() - d * day).toISOString();
check('old posting, no cutoff set', triage({ title: 'Data Analyst', posted: iso(400) }, { ...aged, maxAgeDays: 0 }).verdict, 'match');
check('old posting, cutoff set', triage({ title: 'Data Analyst', posted: iso(400) }, { ...aged, maxAgeDays: 90 }).verdict, 'exclude');
check('fresh posting, cutoff set', triage({ title: 'Data Analyst', posted: iso(10) }, { ...aged, maxAgeDays: 90 }).verdict, 'match');
check('no date is never a reject', triage({ title: 'Data Analyst', posted: null }, { ...aged, maxAgeDays: 90 }).verdict, 'match');
check('unparseable date is never a reject', triage({ title: 'Data Analyst', posted: 'sometime' }, { ...aged, maxAgeDays: 90 }).verdict, 'match');
check('a future date reads as age 0, not negative', ageInDays(new Date(Date.now() + 5 * day).toISOString()), 0);

console.log('\n-- employer slugs: guesses are free, a missing guess costs a whole board --');
const hasAll = (name, want) => want.every((w) => slugCandidates(name).includes(w));
check('legal suffix dropped', hasAll('Acme Environmental Solutions, Inc.', ['acmeenvironmentalsolutions', 'acme-environmental-solutions']), true);
check('descriptor tail also tried without it', hasAll('Example Research Institute', ['exampleresearchinstitute', 'example']), true);
check('leading "the" dropped', hasAll('The Nature Conservancy', ['natureconservancy']), true);
check('acronym offered for long names', hasAll('Environmental Protection Agency', ['epa']), true);
check('accents folded', hasAll('Université Laval', ['universitelaval']), true);
check('empty name yields nothing', slugCandidates('').length, 0);

console.log(failed ? `\n${failed} FAILED\n` : '\nAll passed\n');
process.exit(failed ? 1 : 0);
