# Changelog

All notable changes to JobScan are recorded here so the working files stay free of version commentary. Format
follows [Keep a Changelog](https://keepachangelog.com/); this project uses semantic versioning.

## [Unreleased]

### Fixed
- Install instructions and the plugin `homepage` pointed at `MarioLuppino/JobScanPluggin`, the repository's
  name before it was renamed to `JobScanPlugin`. GitHub's rename redirect kept them working, but a redirect
  is not a guarantee: were the old name ever claimed by another account, `/plugin marketplace add` would
  resolve somewhere else entirely.

## [0.2.0] - 2026-08-22

### Added
- **CV-first onboarding.** Setup now opens by asking for the user's CV or résumé and any material that
  already answers the interview — an old profile, a personal statement, past cover letters, or answers they
  wrote out themselves in any format. Claude drafts answers to the 19 questions a CV can cover, confirms them
  in batches, and asks only the 22 a CV cannot know; three tooling questions are auto-detected instead of
  asked. Every question in `intake-questionnaire.md` is now tagged `[CV]` / `[ASK]` / `[AUTO]`, and the skill
  is instructed to *revise* the remaining questions against what the CV said — using the user's vocabulary,
  dropping questions that don't apply, and sharpening ambiguous ones — rather than reading a fixed script.
  Answering all 44 questions independently remains a first-class path, offered explicitly at the start.
- **Install step 0 — getting Claude Code.** The README previously assumed the reader already had it, which is
  the one prerequisite no amount of in-plugin wording can soften: the CLI is a terminal application. Step 0
  now points at the desktop app, which installs plugins without a terminal, notes the Git-for-Windows
  requirement for its Code tab, and gives two non-command ways to install the plugin — the desktop plugin
  browser, or simply asking Claude to add the marketplace in plain words.
- `docs/INTERVIEW-QUESTIONS.md`: the onboarding interview written out for prospective users — all 44
  questions in plain language, what to have ready, where answers are stored, and what setup produces. Linked
  from the README so the interview is visible before install rather than only after it.
- **ATS feed pipeline** (`plugins/jobscan/scripts/`). Pulls open roles directly from the public JSON
  job-board APIs of Greenhouse, Lever, SmartRecruiters, Ashby, Workable, Workday (CXS) and Paylocity. No API
  keys, no scraping. Includes zero-token title triage, dedup against the applied-index plus a persistent
  seen-URL cache, ATS discovery probes, and a regression test suite. All field-specific behaviour is
  config-driven through `triage-config.json`, so the pipeline is not tied to any one profession.
- `Work Search Log.template.md` for users claiming unemployment benefits, plus guidance that a weekly
  application quota changes what the scan optimizes for.
- `local-tooling.md`: recommended free local tools (Poppler, Tesseract, Pandoc, LibreOffice) with per-OS
  install commands, a check for whether a PDF has a text layer, and file-discovery habits.
- `Outcome` column in the applied-index template, so fit scores can be calibrated against what actually
  happened rather than assumed.
- `calibrate.mjs`: reads recorded outcomes and reports conversion by fit-score band, plus rules the user’s
  own outcomes contradict. Refuses to draw conclusions below eight resolved outcomes rather than presenting
  noise as signal. Closes the feedback loop that made scoring unfalsifiable.
- `pipeline.mjs`: models the application pipeline rather than the weekly snapshot — packets built but never
  submitted, applications stale enough to follow up on, and weekly quota tracking.

### Changed
- **Word or Pages only.** Packets are produced as `.docx` by the `docx` skill and opened in Microsoft Word or
  Apple Pages; PDFs come from those apps' own export. `docx-generation.md` is rewritten around this, with a
  no-install paste-in fallback and a warning about Pages silently saving `.pages` files employers can't open.
- **Non-coder posture throughout onboarding.** Claude runs every command rather than handing commands to the
  user, writes all config files itself, asks for locations in plain terms ("your Documents folder") and
  converts them to paths, and treats every technical step as declinable. The ATS pipeline is presented as
  "a faster, cheaper scan" the user opts into, and `job-search` now falls back to web search silently when
  it isn't set up instead of stalling mid-scan on a missing dependency.
- Fit scoring: hard gates are disqualifications rather than low scores; weights are written down rather than
  re-derived per posting; recorded outcomes are used to correct rules that prove wrong.
- Search guidance: ATS feeds run before keyword search; per-portal tool routing; scope open-web queries with
  `site:`; rotate sweep order so a tool timeout never starves the same sources every week.
- Operational rules: never spend metered credits on local files; verify a tool is genuinely unavailable
  before falling back; cap interactive browser sessions; check a monitor's recurring cost before creating it.
- Subagent guidance: fan out for context isolation, not speed, since scrape concurrency is capped per account.

### Removed
- The R `officer` script and Pandoc recipes for building `.docx` files, and the "Markdown→docx path" question
  they required at onboarding. Both assumed software a job seeker has no reason to own, and the question was
  the most confusing thing in setup for anyone who doesn't code.
- Pandoc, LibreOffice, `jq`, and `ripgrep` from the recommended local tooling. Word and Pages cover document
  conversion; the rest were agent conveniences presented as user prerequisites.

## [0.1.0] - initial release
- Initial release: `job-search`, `job-applications`, and `jobscan-onboarding` skills; field-agnostic
  references and fill-in templates; marketplace + plugin manifests; README and architecture guide.
