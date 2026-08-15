# Changelog

All notable changes to JobScan are recorded here so the working files stay free of version commentary. Format
follows [Keep a Changelog](https://keepachangelog.com/); this project uses semantic versioning.

## [Unreleased]

### Added
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

### Changed
- Fit scoring: hard gates are disqualifications rather than low scores; weights are written down rather than
  re-derived per posting; recorded outcomes are used to correct rules that prove wrong.
- Search guidance: ATS feeds run before keyword search; per-portal tool routing; scope open-web queries with
  `site:`; rotate sweep order so a tool timeout never starves the same sources every week.
- Operational rules: never spend metered credits on local files; verify a tool is genuinely unavailable
  before falling back; cap interactive browser sessions; check a monitor's recurring cost before creating it.
- Subagent guidance: fan out for context isolation, not speed, since scrape concurrency is capped per account.

## [0.1.0]
- Initial release: `job-search`, `job-applications`, and `jobscan-onboarding` skills; field-agnostic
  references and fill-in templates; marketplace + plugin manifests; README and architecture guide.
