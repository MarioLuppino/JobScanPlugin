# JobScan — Architecture & Adaptation Guide

How the system is built, so you can install it, adapt it to your field, or fork it. Personal career data is
never part of the repo — the plugin ships methodology; your profile is generated locally.

## 1. Architecture

Three working skills, four maintenance skills, and a data layer:

- **`job-search`** (finder) — scan → de-dup → verify live → score fit → rank → write dated digest → stop.
- **`job-applications`** (drafter) — deconstruct posting → fit go/no-go → competency→evidence map → tailored
  résumé (edit a base) → cover letter (in your voice) → interview prep → file numbered folder + index row.
- **`jobscan-onboarding`** (setup) — read the user's CV → pre-fill what it answers → interview only the gaps
  → generate your personal profile, digest, base résumés, voice file, empty index; configure paths. The
  questions are tagged `[CV]` / `[ASK]` / `[AUTO]` in `intake-questionnaire.md` and listed for readers in
  [`INTERVIEW-QUESTIONS.md`](INTERVIEW-QUESTIONS.md).

Then four small skills that exist so the setup is not a one-shot, because the levers all live in files the
user was deliberately never shown:

- **`jobscan-doctor`** (check) — every precondition in one visible line, plain words, one fix each. Also runs
  as step zero of `job-search`. `scripts/doctor.mjs` does the disk-checkable half; the skill covers what only
  a live session can see (is Firecrawl *callable*, is `docx` loaded, are browser tools present).
- **`profile`** (settings) — salary floor, locations, avoid-list, fit floor, quota, voice. Edits `profile.md`
  and re-derives the digest line; never the digest alone.
- **`employers`** (targets) — add/drop employers, re-run ATS discovery, edit the title patterns.
- **`where`** (locations) — show and move `data_path` / `archive_path`, then verify.

Data flow: `jobscan-doctor` → `job-search` (→ **digest**) → *you select* → `job-applications` (→ **packet** +
index append).

Two locations you configure at onboarding:
- **`<jobscan-data>/`** — your private files (default `~/.claude/jobscan-data/`).
- **`<archive>/`** — numbered application folders, `Applied Index.md`, `Job Search Digests/`.

## 2. File inventory

**Ships with the plugin (methodology, field-agnostic):**
- `skills/job-search/SKILL.md` + `references/{sources.md, digest-template.md}`
- `skills/job-applications/SKILL.md` + `references/{resume-formats-and-ats.md, writing-playbook.md}`
- `skills/jobscan-onboarding/SKILL.md` + `references/{intake-questionnaire.md, local-tooling.md, templates/…}`
- `skills/{jobscan-doctor,profile,employers,where}/SKILL.md` — maintenance, no references of their own
- `scripts/{paths,doctor,fetch-ats,triage,dedup,discover-ats,discover-workday,calibrate,pipeline}.mjs`
  + `*.example.json` (read-only shipped defaults) + `test-triage.mjs`

**Generated locally by onboarding (private, git-ignored):**
- `<jobscan-data>/profile.md` — master profile, single source of truth, with the "Propagation on edit" note.
- `<jobscan-data>/profile-core.md` — compressed digest, read by default (DERIVED).
- `<jobscan-data>/base-resumes/{industry-2page,federal,state-agency}.md` — per-tier scaffolds with `⟪TAILOR⟫`
  slots.
- `<jobscan-data>/cover-letter-voice.md` — your reverse-engineered voice.
- `<archive>/Applied Index.md` — append-only dedup file.
- `<jobscan-data>/setup-state.md` — which interview sections are done, so setup can be resumed rather than
  restarted. Written from the first answered section onward, alongside a partial `profile.md`.
- `<jobscan-data>/sources.md` — the user's field employers/boards/keywords; read in preference to the
  plugin's shipped default.
- `<jobscan-data>/ats/*.json` — scanner registry, title config and caches.

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

- A Claude surface with **Agent Skills** support. The **desktop app** is the path for non-technical users —
  it installs plugins without a terminal — and the CLI works identically.
- **Firecrawl** for JS portals + structured extraction; graceful fallback to built-in fetch/search + browser
  tools without it. Onboarding connects it itself via the keyless hosted MCP server at
  `https://mcp.firecrawl.dev/v2/mcp` (no account, no API key, no third-party marketplace); a free key, or the
  `firecrawl@claude-plugins-official` plugin, raises the limits and unlocks `map`/`agent`/monitors.
  **MCP servers load at session start, so it is unusable until Claude Code restarts** — say so when
  connecting it, or the first scan looks like the setup failed. How optional it is depends on the user's
  sector: for government/enterprise portals (NEOGOV, Workday, USAJOBS, CalCareers, Paylocity) Gate 2 refuses
  to draft against a posting it cannot re-confirm, so declining ends the run at the digest; for
  Greenhouse/Lever-class boards plain fetch is enough and declining costs nothing.
- **Node.js v18 or newer** (global `fetch`) *only* for the optional `scripts/` ATS pipeline. Onboarding
  installs it for the user, checks `node --version` rather than assuming, and skips the pipeline entirely if
  they'd rather not — the scan falls back to web search. `sudo apt install nodejs` on Ubuntu 22.04 / Debian 11
  installs Node 12, which fails every script with a `ReferenceError` that reads like a plugin bug; use the
  NodeSource LTS setup there.
- **Microsoft Word or Apple Pages** to open the `.docx` packets. Files are produced by the `docx` skill; no
  converter, toolchain, or programming language is required at any point.
- A **scheduler** if you want the weekly run unattended.

## 6. Non-negotiable rules (carried into the skills)

Prepare-never-submit · two-gate live verification · no fabrication · dedup before digest and pre-draft · hard
gates (authorization/sponsorship, salary floor + relocation + pay-grade, location, fit floor, avoid-list) ·
published-only publications.

**And: no silent degradation.** Every fallback is announced — in the digest's Process note during a scan, in
plain words during setup. This is the rule the 0.3.0 audit was written about: a pipeline that could not run
was authorised to "skip STEP 0 *silently*", so a broken install and a declined option looked identical for a
whole release. Degrading is fine; degrading invisibly is a defect. Anything added to this system that can
fail quietly needs a line in `jobscan-doctor` and a sentence in the output where it fails.

**And: nothing personal under the plugin root.** `/plugin update` replaces that directory wholesale. Code and
`*.example.json` ship inside it and are read-only; everything the user owns resolves through `scripts/paths.mjs`
to `<data_path>` or `<archive>`.

## 7. Privacy

Publishing distributes content. **Never commit a filled profile, résumé, digest, or the applied index** — the
`.gitignore` excludes them; keep it that way in any fork. The value shared is the methodology, never the
career data.

## 8. Coexisting with a user's own job-search skills

Some users arrive with personal skills already named `job-search` / `job-applications`. That is not a
collision to avoid — it's the integration case, and the architecture supports it because **the data layer,
not the skills, is the product.**

Claude Code namespaces plugin skills (`/jobscan:job-search`), so the plugin never takes a bare command name
or shadows a personal skill; the only overlap is model-invoked triggering, which two skills with overlapping
descriptions share. That is settled on the user's side — a more specific `description`, or
`disable-model-invocation: true` — because `skillOverrides` doesn't apply to plugin skills.

The integration seam is the fixed config path, `~/.claude/jobscan-data/jobscan-config.md`. Any skill that
reads it resolves `data_path` and `archive_path` and can then use `profile-core.md`, the base résumés, the
voice file, and `Applied Index.md`. Onboarding therefore has two exit points: generate the data layer and
configure *their* skill to read it (§2's "generated locally" list, minus the plugin's own sources file), or
run the full setup. Keep both working in any fork — a user who already has a routine should be able to take
the profile pipeline without adopting the skills, and nothing generated should overwrite a file their routine
already maintains.

## 9. Contributing / updating

Improvements to the methodology (a better rule, a new source category, a workflow refinement) are commits
others can pull.

**Cutting a release: bump `version` in `plugins/jobscan/.claude-plugin/plugin.json`, and move the
`[Unreleased]` section of `CHANGELOG.md` under the new version heading.** That one field is the only version
this project keeps — `.claude-plugin/marketplace.json` deliberately carries none, so the two can't drift.

The bump is not bookkeeping. Claude Code **pins an installed plugin to that string**: push all the commits
you like, and anyone who already installed JobScan keeps their cached copy until `version` changes. Forgetting
it means shipping to no one.

**How a release actually reaches people.** Two distribution paths, with different update behaviour:

- **JobScan's own marketplace** (`/plugin marketplace add MarioLuppino/JobScanPlugin`). Third-party
  marketplaces have background auto-update **off by default**, so a user's copy is frozen at the version they
  installed until they run `/plugin marketplace update jobscan` and `/plugin update jobscan@jobscan`. The
  README's "Keeping JobScan up to date" section exists to tell them that; keep it in any fork.
- **The community marketplace** (`anthropics/claude-plugins-community`, installed as `@claude-community`).
  Submissions go through the in-app form at `platform.claude.com/plugins/submit` and land here after review.
  An approved plugin is pinned to a commit SHA in that catalog, **but CI bumps the pin automatically as new
  commits are pushed to this repository** — so a merged change does not need a fresh submission to reach the
  catalog. The public catalog syncs nightly, so allow a day. That marketplace is Anthropic-maintained, so
  users on it generally do get background updates.

Both paths still obey the `version` pin above: the catalog can point at the newest commit and users will
still keep their cached copy unless `version` changed. Bump it, then let the pin follow.

Keep version history in the changelog only — never annotate the working files with edit or version notes.
