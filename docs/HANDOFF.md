# JobScan — Architecture & Adaptation Guide

How the system is built, so you can install it, adapt it to your field, or fork it. Personal career data is
never part of the repo — the plugin ships methodology; your profile is generated locally.

## 1. Architecture

Three skills plus a data layer:

- **`job-search`** (finder) — scan → de-dup → verify live → score fit → rank → write dated digest → stop.
- **`job-applications`** (drafter) — deconstruct posting → fit go/no-go → competency→evidence map → tailored
  résumé (edit a base) → cover letter (in your voice) → interview prep → file numbered folder + index row.
- **`jobscan-onboarding`** (setup) — read the user's CV → pre-fill what it answers → interview only the gaps
  → generate your personal profile, digest, base résumés, voice file, empty index; configure paths. The
  questions are tagged `[CV]` / `[ASK]` / `[AUTO]` in `intake-questionnaire.md` and listed for readers in
  [`INTERVIEW-QUESTIONS.md`](INTERVIEW-QUESTIONS.md).

Data flow: `job-search` (→ **digest**) → *you select* → `job-applications` (→ **packet** + index append).

Two locations you configure at onboarding:
- **`<jobscan-data>/`** — your private files (default `~/.claude/jobscan-data/`).
- **`<archive>/`** — numbered application folders, `Applied Index.md`, `Job Search Digests/`.

## 2. File inventory

**Ships with the plugin (methodology, field-agnostic):**
- `skills/job-search/SKILL.md` + `references/{sources.md, digest-template.md}`
- `skills/job-applications/SKILL.md` + `references/{resume-formats-and-ats.md, writing-playbook.md}`
- `skills/jobscan-onboarding/SKILL.md` + `references/{intake-questionnaire.md, templates/…}`

**Generated locally by onboarding (private, git-ignored):**
- `<jobscan-data>/profile.md` — master profile, single source of truth, with the "Propagation on edit" note.
- `<jobscan-data>/profile-core.md` — compressed digest, read by default (DERIVED).
- `<jobscan-data>/base-resumes/{industry-2page,federal,state-agency}.md` — per-tier scaffolds with `⟪TAILOR⟫`
  slots.
- `<jobscan-data>/cover-letter-voice.md` — your reverse-engineered voice.
- `<archive>/Applied Index.md` — append-only dedup file.

## 3. The two ideas that make it efficient

1. **Derived files + selective propagation.** The digest and base résumés are *derived* from `profile.md`.
   Reading the ~1-page digest instead of the full profile cuts the most frequent read ~4×. The refresh
   checklist lives at the top of `profile.md` (read least often, edited when facts change) and is selective:
   a phrasing tweak refreshes the digest; a new role/pub/cert also refreshes the base résumés.
2. **One dedup file instead of rescanning folders.** `Applied Index.md` is read once per scan; the filing step
   appends one row. This replaces an O(folders) cost that grew with every application.

Plus the four-stage token workflow (discover→summarize→discard; read digest once; edit-don't-regenerate
résumés; cover letter from the tailored résumé), and Firecrawl for cheap dynamic-portal reads + server-side
posting→summary extraction.

## 4. Adapting to your field

Almost everything is field-agnostic. Only two things are domain-specific:
- **Your `profile.md`** — generated from the onboarding interview.
- **`job-search/references/sources.md`** — swap the field's employers, boards, APIs, and keywords into the
  fixed source *categories* (federal / state / university / non-profit / industry / transferable / society).
  Flag asymmetric keyword pairs that must both be searched.

The verification gates, résumé tiers, ATS rules, digest format, filing system, and token workflow carry over
unchanged.

## 5. Prerequisites

- A Claude surface with **Agent Skills** support (Claude Code CLI or Desktop).
- **Firecrawl** (recommended) for JS portals + structured extraction; graceful fallback to built-in
  fetch/search + browser tools without it.
- **Node.js** *only* for the optional `scripts/` ATS pipeline. Onboarding installs it for the user, and skips
  the pipeline entirely if they'd rather not — the scan falls back to web search.
- **Microsoft Word or Apple Pages** to open the `.docx` packets. Files are produced by the `docx` skill; no
  converter, toolchain, or programming language is required at any point.
- A **scheduler** if you want the weekly run unattended.

## 6. Non-negotiable rules (carried into the skills)

Prepare-never-submit · two-gate live verification · no fabrication · dedup before digest and pre-draft · hard
gates (authorization/sponsorship, salary floor + relocation + pay-grade, location, fit floor, avoid-list) ·
published-only publications.

## 7. Privacy

Publishing distributes content. **Never commit a filled profile, résumé, digest, or the applied index** — the
`.gitignore` excludes them; keep it that way in any fork. The value shared is the methodology, never the
career data.

## 8. Contributing / updating

Improvements to the methodology (a better rule, a new source category, a workflow refinement) are commits
others can pull. Bump the version in `plugins/jobscan/.claude-plugin/plugin.json` and
`.claude-plugin/marketplace.json` when you cut a release, and record the change in `CHANGELOG.md`. Keep
version history in the changelog only — never annotate the working files with edit or version notes.
