#!/usr/bin/env node
/**
 * test-triage.mjs — regression tests for triage.mjs and dedup.mjs.
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

import { triage } from './triage.mjs';
import { screen } from './dedup.mjs';

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

console.log(failed ? `\n${failed} FAILED\n` : '\nAll passed\n');
process.exit(failed ? 1 : 0);
