# Changelog

All notable changes to JobScan are recorded here so the working files stay free of version commentary. Format
follows [Keep a Changelog](https://keepachangelog.com/); this project uses semantic versioning.

## [Unreleased]

### Added
- **"Keeping JobScan up to date" in the README.** Claude Code pins an installed plugin to its manifest
  `version`, and background auto-update is off by default for any marketplace that isn't Anthropic's own —
  JobScan's included. Users had no way to know a fix had shipped, or how to take it. The section gives the
  plain-words ask ("Update my JobScan plugin"), the two typed commands behind it
  (`/plugin marketplace update jobscan`, `/plugin update jobscan@jobscan`), and notes that installs from the
  community marketplace do refresh in the background.
- **`HANDOFF.md` §9 documents both distribution paths.** JobScan's own marketplace doesn't auto-update; the
  community catalog pins a commit SHA but CI bumps that pin automatically as commits are pushed, so a merged
  change reaches the catalog without a fresh submission (nightly sync, so allow a day). Either way the
  `version` pin still gates delivery.

### Changed
- **`CLAUDE.md`: unfinished work goes in the handoff document, never in the session.** The handoff rule now
  states plainly that no "what's left", next-steps list, or task list belongs in chat — that content is the
  handoff document's job, and reporting what was *done* stays brief. The convention itself moved into a real
  skill at `.claude/skills/handoff/`, so `CLAUDE.md` states the rule and points at the procedure instead of
  carrying both.
- **The handoff skill publishes links, not files.** `/handoff` writes the document as an Artifact and hands
  back a URL, because a file written inside a session container is wiped with the container and a handoff
  that evaporates before the next chat opens is worthless. `references/layout.md` fixes the page format —
  state grid, eyebrow-plus-heading sections, status colours, dark-mode tokens — so successive handoffs read
  as one series. It is a project skill: it loads for anyone working in this repository, cloud sessions
  included.

Docs only; no plugin content changed, so no version bump.

## [0.2.2] - 2026-08-24

### Changed
- **Existing `job-search` / `job-applications` skills are now an integration case, not a reason to stay
  away.** The README section previously told anyone with personal skills of those names not to install the
  plugin in the environment that runs their real search. That advice rested on a name collision that doesn't
  exist: Claude Code namespaces plugin skills, so JobScan's arrive as `/jobscan:job-search` and the personal
  skills keep their bare names, their files, and their behaviour. The section now covers the overlap that is
  real — both descriptions being listed to Claude, so a vague request matches two skills — and its three
  fixes (ask specifically, sharpen the personal skill's `description`, or set `disable-model-invocation:
  true`), noting that `skillOverrides` is not a lever because it doesn't apply to plugin skills. It then
  gives four ways to combine the two: take the generated data layer and point existing skills at the fixed
  config path, split the workflow between finder and drafter, borrow individual reference files, or keep
  them apart in a scratch project.
- **Onboarding checks for those skills before it asks anything.** It looks in `~/.claude/skills/` and the
  project's `.claude/skills/`, treats anything it finds as the production system (never edited, renamed, or
  deleted without permission), and offers a choice: build the data layer and configure *their* skill to read
  it, or run the full setup. Step 6 gained the corresponding branch — path resolution plus sources written
  into their `SKILL.md`, in their structure, with JobScan's verification and formatting rules offered rather
  than imposed. Existing profiles, résumés, and archives are read as interview material instead of being
  regenerated over.
- **`HANDOFF.md` documents the integration seam** in a new §8: the fixed config path at
  `~/.claude/jobscan-data/jobscan-config.md` is what makes the data layer skill-agnostic, so onboarding has
  two legitimate exit points and both should keep working in any fork.

## [0.2.1] - 2026-08-24

### Fixed
- **Firecrawl now has an install path, and it needs no sign-up.** The README recommended Firecrawl without
  saying how a non-coder gets it, and the onboarding skill only mentioned the fallback when it was absent.
  Both now route through Firecrawl's keyless hosted MCP server at `https://mcp.firecrawl.dev/v2/mcp` — no
  account, no API key, and no second plugin marketplace to add. Onboarding runs the connection itself
  (`claude mcp add --scope user --transport http firecrawl …`), consistent with the rule that commands belong
  to Claude. A free API key, or the `firecrawl@claude-plugins-official` plugin from Anthropic's own
  marketplace, is offered only as an upgrade for higher limits, never as the entry point.
- **Firecrawl tool names were wrong throughout.** The skills referenced `firecrawl-scrape`, `firecrawl-search`,
  `firecrawl-map`, `firecrawl-agent`, `firecrawl-interact` and `firecrawl-monitor`; the server actually
  exposes `firecrawl_scrape`, `firecrawl_search`, `firecrawl_parse`, `firecrawl_map`, `firecrawl_agent`,
  `firecrawl_interact` and `firecrawl_monitor_create` (underscores). Every reference is corrected, so the
  guidance names tools that exist.
- **Keyless vs. keyed capabilities are now distinguished.** `firecrawl_scrape`, `firecrawl_search` and
  `firecrawl_parse` work without a key and cover what the scan needs; `firecrawl_map`, `firecrawl_agent` and
  the monitors require one. The job-search skill previously listed `firecrawl-map` and `firecrawl-agent` as
  preferred tooling, which would have failed silently for any user on the keyless tier.
- **The desktop plugin browser cannot add a third-party marketplace.** Claude Code's documentation states the
  browser lists plugins "from your configured marketplaces," so it cannot perform JobScan's first install
  step. The README's step 1 claimed otherwise; it now leads with the plain-words request Claude executes
  itself, keeps the two slash commands as the typed alternative, and says plainly what the desktop browser
  can and cannot do. The 0.2.0 changelog entry describing the browser as one of "two non-command ways to
  install the plugin" was mistaken on that point.

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

### Fixed
- Install instructions and the plugin `homepage` pointed at `MarioLuppino/JobScanPluggin`, the repository's
  name before it was renamed to `JobScanPlugin`. GitHub's rename redirect kept them working, but a redirect
  is not a guarantee: were the old name ever claimed by another account, `/plugin marketplace add` would
  resolve somewhere else entirely.

## [0.1.0] - initial release
- Initial release: `job-search`, `job-applications`, and `jobscan-onboarding` skills; field-agnostic
  references and fill-in templates; marketplace + plugin manifests; README and architecture guide.
