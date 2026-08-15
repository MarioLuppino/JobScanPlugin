---
name: jobscan-onboarding
description: >-
  One-time guided setup for JobScan. Interviews the user about their background, constraints, and target
  roles, then generates their personal candidate profile, compressed digest, per-tier base résumés, voice
  file, and an empty applied-index — and configures paths. Use when the user says "set up jobscan", "run
  jobscan onboarding", "get me started with the job scanner", or when job-search/job-applications reports no
  profile exists yet.
---

# JobScan Onboarding

Turn a new user into a working JobScan setup. You conduct the interview, then **generate their personal files
from templates** — never leave them a blank profile. Ask questions conversationally, a few at a time; don't
dump all 44 at once. Flag any answer missing a number and ask a follow-up rather than inventing one.

## Step 1 — Choose paths and write the config

Ask two things:
- **Data path** (where personal files live) — default `~/.claude/jobscan-data/`.
- **Archive path** (where application folders, digests, and the applied index live).

**Write `~/.claude/jobscan-data/jobscan-config.md`** (a FIXED, discoverable location — the `job-search` and
`job-applications` skills read it first to resolve `<jobscan-data>` and `<archive>` on every run) from
`references/templates/jobscan-config.template.md`, filling in both paths. This is what lets a later scan find
a non-default archive. The data path may differ from the config's own folder, but the config file itself
always lives at `~/.claude/jobscan-data/jobscan-config.md` so it's always findable.

## Step 2 — Interview

Work through the intake in `references/intake-questionnaire.md` (sections A–I): identity/positioning/
constraints, headline accomplishments *with numbers*, skill inventory, roles/experience, leadership,
track-record & voice, target roles & search scope, interview-story seeds, and tooling/environment. Capture
real quantified anchors (funding totals, people supervised, publications with the published-vs-in-review
split, presentation reach, awards). Confirm the standing rules the user wants enforced — especially:
- Never list in-review work as published (DOI-only)? (Recommend yes.)
- Salary floor, preferred range, relocation floor, any government pay-grade floor.
- Location/political-lean handling; remote exemption.
- Fit floor (recommend 50); the avoid-list (their equivalent of "avoid fisheries").
- Split quota (domestic/international per scan), if any.

## Step 3 — Generate personal files (into the data path)

Use the templates in `references/templates/` — fill placeholders from the interview; **do not ship or commit
these filled files** (they're the user's private data):

1. **`profile.md`** — from `profile.template.md`. Populate every section from the answers. **Keep the
   "Propagation on edit" note at the top.** This is the source of truth.
2. **`profile-core.md`** — from `profile-core.template.md`. Distill `profile.md` into the ~1-page digest
   (positioning, constraints, quantified anchors, condensed skills/roles, publishable pubs, translation
   table, ATS keyword bank, role archetypes). Mark it DERIVED.
3. **`base-resumes/`** — copy `base-resumes/README.md` and the three `*.template.md` scaffolds; fill the
   stable content (contact, education, publications, certs, core skills, experience bullets) and leave the
   `⟪TAILOR⟫` slots. Drop any tier the user won't use.
4. **`cover-letter-voice.md`** — from `cover-letter-voice.template.md`. If the user has past letters that
   landed interviews, reverse-engineer their real voice; otherwise draft a first version using the
   drafting mechanics in the **`job-applications` skill's `references/writing-playbook.md`** (sibling skill in
   this plugin) and mark it living.

## Step 4 — Set up the archive

In the archive path, create **`Applied Index.md`** from `references/templates/Applied Index.template.md`
(header only, or backfilled from existing folder names if the user already has application folders),
**`Considered - Not Pursued.md`** from its template (the do-not-resurface list for roles seen and passed on),
and a `Job Search Digests/` folder.

**Ask whether the user is claiming unemployment benefits.** If they are, also create **`Work Search Log.md`**
from `references/templates/Work Search Log.template.md` and have them fill in the requirement block from
their own agency's rules (the required count, the week boundary, and what counts all vary by jurisdiction —
they must confirm it, not you). A weekly application quota changes what the scan is *for*: the deliverable
becomes **enough genuinely applyable roles to clear the quota**, not a tidy ranked ten. Tell the
`job-search` skill the number. Never let a quota lower the fit floor.

## Step 5 — Field-specific search config

Edit the **`job-search` skill's `references/sources.md`** working copy (or a user override) to swap in the
user's field employers, boards, APIs, and domain keywords (keep the source categories). Encode the
asymmetric-keyword pairs that must both be searched.

**Then set up the ATS feed pipeline — this is the highest-value step in onboarding.** In
`plugins/jobscan/scripts/`: copy `triage-config.example.json` → `triage-config.json` and replace
`matchTitlePatterns` with the user's actual job titles (without this almost nothing matches), copy
`employers.example.json` → `employers.json` with their target employers, then run `node discover-ats.mjs`
and, for large employers, `node discover-workday.mjs`. Verify with `node fetch-ats.mjs --summary` and
`node test-triage.mjs`. See `scripts/README.md`.

## Step 6 — Confirm tooling & finish

**Walk the user through `references/local-tooling.md`** and install what's missing, giving the commands for
**their** operating system. Node.js is required for the `scripts/` pipeline; Poppler is the highest-value
optional install, because without it scanned PDFs can't be read locally and the agent will otherwise burn
metered API credits on files already on disk. On Windows, installs need a terminal/editor restart to take
effect on `PATH`.

Confirm: Skills feature available; Firecrawl connected (or note the fallback); Markdown→docx path chosen
(see the `job-applications` skill's `references/docx-generation.md`); scheduler wanted (if so, register the
weekly task from `references/templates/weekly-scan-task.template.md` — see the `job-search` skill's
`references/scheduling.md`). Then summarize what was created and tell them to run **"run my weekly job
search"**.

**Privacy reminder:** everything generated in Steps 3–4 is personal career data. If the user is working
inside a clone of the repo, confirm `.gitignore` is excluding it. Never commit a filled profile, résumé,
digest, or index.
