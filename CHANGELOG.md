# Changelog

All notable changes to JobScan are recorded here so the working files stay free of version commentary. Format follows [Keep a Changelog](https://keepachangelog.com/); this project uses semantic versioning.

## [Unreleased]

A pass over what the scan spends and what it keeps. The scan was buying two things every week — coverage of
the field, and confirmation that ten listings were open — and throwing away the half that would have made
next week cheaper.

### Added
- **The first scan now keeps the employers it finds.** The employer registry is what makes a weekly scan
  nearly free, and it was built from what the user could name in the onboarding interview: a handful of
  employers, weighted toward the famous ones. Everything else about their field was discovered by an
  expensive web sweep, used once, and discarded with the postings. That is the wrong thing to keep. A
  posting expires in weeks; a confirmed job-board feed returns every future opening at that employer for
  nothing, including the one nobody thought to search for. `harvest-employers.mjs` turns a plain list of
  employer names into registry entries — it guesses the candidate board slugs, and merges rather than
  overwrites, so a hand-corrected slug survives — and the existing probe confirms which of them have a live
  feed. `job-search` now does this on a first scan and after any sweep that had to cover ground the registry
  does not reach, and reports what it bought: employers found, employers confirmed, and that next week those
  boards are read directly. *"Find employers for my job scan"* runs it on demand.
- **The salary floor now works before anything is fetched.** `triage.mjs` has always had the check and no
  feed ever populated it, so the most common hard gate in the whole system was dead code: every below-floor
  posting survived the free stage and was rejected later, after a full retrieval. `salary.mjs` reads a
  comparable annual minimum out of whatever shape a board publishes pay in, and hourly, weekly and monthly
  ranges are annualised first — comparing an hourly rate against an annual floor would have rejected an
  entire board. It refuses to guess: a figure whose pay period the feed never stated is treated as no salary
  at all, because a wrong reading discards a job the user wanted and says nothing about it. Where a posting
  reports several minimums, the highest is used, so the gate cannot over-reject.
- **An optional posting-age cutoff**, `maxAgeDays`, gated on the date the feed already reports. Off by
  default and documented as such: a cutoff set too tight quietly discards live roles, and government and
  academic openings routinely stay posted for months.
- **A way to tell the scanner what a scan decided.** `dedup.mjs --record` only ever cached the duplicates it
  found itself, so a posting the *scan* opened, verified and rejected was re-fetched and re-judged every
  week, forever — the exact cost the cache exists to remove. `--record-verdict passed` writes those back
  once, at the end of a run. It is deliberately narrow, and the rule around it is now a hard rule in
  `job-search`: only a posting that was genuinely examined may be cached, never one that was merely
  surfaced. A cached verdict is permanent and completely silent, so recording an unexamined listing deletes
  it from every future scan without anyone having decided to.

### Changed
- **A digest's length and a digest's cost are now separate.** Verifying ten listings in full does it seven
  times more than anyone acts on in a week, and the expensive part was never the row in the table — it was
  retrieving the posting. Scans now verify the top three in depth (or enough to cover a weekly application
  quota, whichever is more) and carry the rest as table rows built from what the board already reported,
  tagged `NOT-CHECKED` with a provisional score written `~72`. The list stays at about ten, because
  shortening it costs three things that are invisible from inside one scan: a user with a benefits quota
  needs volume, `calibrate.mjs` needs listings across score bands before it can say anything, and a role has
  to be surfaced before it can be declined into `Considered - Not Pursued.md`. This is safe because of the
  pre-draft gate, not in spite of it — nothing is ever drafted against a posting that has not been
  re-confirmed open, so picking a listed role fails loudly rather than quietly producing a packet for a job
  that closed a month ago. A per-job block is still written only for a listing that was actually retrieved:
  its fields are exactly the ones a job board cannot answer.
- **Onboarding stops implying the employer list should be longer than anyone can produce.** Asked cold,
  people name a few employers; that is the expected answer, not a thin one. The question is now framed as a
  starting point, with the first scan named as where the rest of the registry comes from.
- **The setup check points a thin registry at a search instead of at the user's memory.** *"Add employers to
  my job scan"* asks someone to remember names they already tried to remember once. The fix now offered is
  the discovery run.

## [0.5.0] - 2026-08-25

A second pass over the path a non-technical user actually walks, from the download link to the first file they open. The audit behind 0.3.0 and 0.4.0 was about a scan that quietly did less than it claimed; these are the places where a correct system still loses somebody — a plugin that installed but never loaded, files in a format nobody warned them about, and a setup check that greets a brand-new install with eight failures.

It also closes the two things the audit found were missing outright rather than wrong: there was no way to undo a setup, and a scan that ran while you were asleep had nowhere to leave its answer.

### Added
- **A way to start over, and a way to leave — the `reset` skill.** Every other lever got a skill in 0.4.0: `profile` changes a setting, `employers` changes the targets, `where` moves the files. **Nothing removed anything.** So a setup built on a bad answer in the first ten minutes — a misread CV, the wrong target field, a location regretted the moment it was named — had no sentence to say, because re-running onboarding *resumes*, which is right for an interrupted interview and exactly wrong for this one. Saying *"start my jobscan setup over"* now shows what exists first, moves the old profile and `setup-state.md` aside instead of deleting them (which is also what makes onboarding start a real interview rather than continue the old one), and keeps every application already filed. The archive is kept by default on every route and asked about separately when it isn't — those folders are a record of what the user *did*, and a `Work Search Log.md` may be required evidence for unemployment benefits. The skill also clears what the scanner remembers, which is how a role passed on by mistake comes back, and covers removal: `/plugin uninstall jobscan@jobscan` takes the code and **leaves every file JobScan made you**, exactly where it is. That has always been true — it is the same rule that stops `/plugin update` destroying an employer registry — and until now nothing said it.
- **"Show me last week's digest."** Reads back the most recent digest without running a scan: the count, the top few with their apply links, and the date on it. It is the only route back to a run nobody was present for, and an empty digest folder is now an answer ("no scan has finished here") rather than an error.

### Fixed
- **`jobscan-doctor` no longer reports a brand-new install as broken.** Every check but Node and the scripts themselves resolves against a file that onboarding creates, so an install which has never been through setup failed all of them at once: the first run printed eight `FIX` lines full of absolute paths and closed with "8 things above will make a scan quieter than it should be". That is what someone saw the first time they said *"check my job scanner"*, and it reads as a broken product rather than an unstarted one. The script now recognises an untouched install — no config, none of the generated files, nothing in the ATS folder or the archive — and says so in one line, while still naming a genuine problem with the *install* (missing scripts, a too-old Node), because that blocks setup. The skill relays it the same way and skips the live Firecrawl and `docx` checks, which mean nothing before setup has run.
- **The README's install step ended before the plugin was usable.** Installing a plugin and loading it are two different things, and Claude Code's own install summary says which happened — `Plugin is now active.` or `Run /reload-plugins to activate.` The README said neither, so the next thing it told the reader to send ("Run jobscan onboarding") could land in a session that had never heard of JobScan. That is the most likely single point to lose someone, and it looks exactly like a failed install. Step 1 now covers the outcomes, and says plainly what "Claude doesn't know what JobScan is" means.
- **"Everything arrives as ordinary Word documents" was not true.** `INTERVIEW-QUESTIONS.md` said it directly beneath a list of four things that are all plain-text `.md` files; only the résumé and cover-letter packets are `.docx`. Someone opening their Documents folder on Windows would be asked which application to use, for a file the documentation had promised was a Word document. The reader-facing page, the README and onboarding's closing summary now all say what these files are: that nobody has to open one, that asking Claude to read or change it is the intended route, and that any text editor opens it if they want to look.
- **JobScan is not in Anthropic's community marketplace, and the documentation said otherwise.** The README told users that an install from `jobscan@claude-community` refreshes itself in the background, and `ARCHITECTURE.md` §9 documented that catalog's automatic commit-pin sync as one of two live distribution paths. Checked against the published catalog: there is no `jobscan` entry, so that install command fails today. The README now says there is one place to get JobScan and that no copy of it updates itself; `ARCHITECTURE.md` keeps the mechanics, labelled as the route worth taking rather than one already taken.
- **A scheduled scan had nowhere to deliver its result.** `job-search` ended a run by notifying "with the top matches + apply links inline" — a chat message, which is correct when the user is there and worthless at 07:00 on a Monday, which is the entire point of a schedule. The digest was already being written to disk, so the answer existed; nothing told anyone it was there. A week with no matches and a week where the scan never fired were indistinguishable, which is a scheduler nobody has a reason to trust. `scheduling.md`, the task template, onboarding and the README now all say where an unattended run leaves its file and give the sentence that retrieves it, and `job-search` treats the digest file — not a chat summary — as the deliverable of an unattended run, with anything that would have been said in chat written into the file.
- **`scheduling.md` promised a scheduler that may not exist.** It listed "Claude Code `schedule` skill / scheduled agents (routines)" and said asking for one "registers a cron-backed routine that runs this prompt", flatly. The README above it hedged correctly — *"If your Claude surface offers scheduled tasks"* — but `scheduling.md` is the file Claude actually reads when the user asks, so the confident version was the one that ran: an attempt at something the surface may not have, then a quiet fall back to cron, which is terminal work for someone promised none. It now says to check this surface first, to say plainly when the answer is nothing, and never to report a schedule as registered when what happened was a fallback.
- **The setup check speaks in folder names, not absolute paths.** `doctor.mjs` printed fully resolved paths — `/Users/…/.claude/jobscan-data/ats` — and both `jobscan-doctor` and `where` carried an instruction to translate them into something a person would recognise in Finder before reading them out. That worked most of the time, which is the problem: it depended on the model remembering, every time, and the failure was a raw path shown to the one audience promised they would never see one. The script now does it itself, printing the last two segments with a home-relative prefix (`~/…/jobscan-data/ats`), with `--full` for the maintainer question of where a path actually resolved. A path inside a command the agent runs is untouched — a shortened one would not resolve — and `paths.mjs` still prints everything in full.

### Changed
- **The permission prompt that comes first is now the one the README prepares you for.** "About those permission prompts" named `winget` / `brew` / `apt`, `claude mcp add` and `node` — but not `claude plugin marketplace add`, which arrives in step 1, before the reader has seen JobScan do anything, and is therefore the easiest of all of them to refuse out of caution. It is now named, and tied back to the plain-words request it is carrying out.
- **"That's the whole list" no longer contradicts the paragraph below it.** The requirements section claimed Claude Code and Word were the whole requirement, then explained two paragraphs later that for a public-sector search Firecrawl is "effectively required, not optional" — for exactly the audience the plugin was built for. The claim is scoped, and the sector caveat is stated where the list is rather than after it.
- **The README stops turning into developer documentation two-thirds of the way down.** Everything a non-technical reader needs was finished well before the end, and the rest — skill namespacing, `disable-model-invocation`, the four ways to combine JobScan with a personal routine, the fixed-config integration contract — is addressed to someone who already has a `SKILL.md` of their own. It is good material and it was in the wrong place: a page that opens by promising you will never read a line of code should not end in frontmatter keys. It now lives in [`docs/USING-WITH-YOUR-OWN-SKILLS.md`](docs/USING-WITH-YOUR-OWN-SKILLS.md), with a short pointer where it used to be. The audience for it arrives looking for it; the audience for the install does not.

## [0.4.1] - 2026-08-25

A patch for one defect in the 0.4.0 check itself. On an install predating 0.3.0, `jobscan-doctor` reported the user's own scanner config as missing while the scan was reading it perfectly well — the one tool whose entire job is reporting the truth about a scan, raising a false alarm.

### Fixed
- **`jobscan-doctor` reads the user's files from wherever they actually are.** Every scanner script resolves `triage-config.json`, `employers.json`, `ats-feeds.json` and `seen-urls.json` through `paths.mjs`, which still finds them beside the scripts when an install predating the 0.3.0 split left them there. `doctor.mjs` was the only script that looked solely in `<data_path>/ats`. So a working legacy setup was told "no triage-config.json" and "no employers registered", each with an instruction to re-run onboarding, in the same report that separately — and correctly — listed those files as present in the plugin folder. The check now resolves exactly as the scanner does, appends "in the plugin folder" to the lines it affects, and leaves the move instruction to the `Old file locations` check that already carries it. A genuinely unconfigured install reports missing exactly as before.
- **`Job feeds` stops misreading a legacy install as empty.** It phrases its fix by whether any employers are registered, which it was reading as none for the same reason. It now says "employers registered but never probed", and names the discovery command, rather than "nothing to pull from yet".

### Changed
- `paths.mjs` exports `locate(name)`, which answers where one of the user's files actually is without falling back to a shipped `*.example.json` and without printing the legacy notice. `readPath()` is now a thin wrapper over it and its behaviour is unchanged. Anything asking about the *user's* state, rather than wanting a working default, should use `locate()`.

## [0.4.0] - 2026-08-25

Closes the remaining findings from the usability audit that produced 0.3.0. That audit found eight gaps between what the README promises and what an installed plugin delivers; 0.3.0 fixed the three that broke the scanner outright, and this release fixes the five that quietly cost the user something — plus the friction items filed alongside them.

### Added
- **`jobscan-doctor` — one visible line per thing that can silently degrade a scan.** The audit's central finding was that JobScan's failures were indistinguishable from its successes: a config at the wrong path, an employer registry never filled, a Firecrawl connection recorded but never loaded, each produced a scan that *looked* like it worked. `scripts/doctor.mjs` checks everything visible from disk — Node's version, the scripts, the config and its two paths, `profile-core.md`, the title patterns (including whether they are still the shipped demo ones), the employer registry, the feed list, the seen-URL cache, the archive's writability, `Applied Index.md`, and any personal file stranded in the plugin folder by a pre-0.3.0 install — and prints the one fix for each in plain words. The skill adds the four checks a script cannot make: whether Firecrawl actually *answers* (rather than appearing in the config), whether the `docx` skill is loaded, whether browser tools exist, and what `${CLAUDE_PLUGIN_ROOT}` resolved to. It runs as step zero of every `job-search` run, with explicit triage: fatal stops the scan, degrading continues *and* is recorded in the digest's Process note, thin is mentioned once at the end.
- **Three maintenance skills, so setup is no longer one-shot.** Every lever — salary floor, avoid-list, employers, file locations — lived in a file the user was deliberately never shown, and the only documented way to change one was to run all 44 interview questions again. Now: **`profile`** ("change my salary floor") edits one setting and re-derives the digest line rather than the digest alone; **`employers`** ("add employers to my job scan") adds or drops targets, re-runs ATS discovery and updates the title patterns, which is the setting that most decides whether a scan finds anything; **`where`** ("where does jobscan keep my files") shows the paths and moves them safely, config included.
- **Onboarding can be interrupted and resumed.** It previously wrote nothing until Step 4 — forty-four questions, then generation, so a context limit or a closed window lost all of it. It now writes the config as soon as a location is known, appends each interview section to `profile.md` as it is confirmed, and keeps a `setup-state.md` (new template) recording what is done, what is outstanding, and what was declined. Re-running the skill reads that state and asks only what is left; a *completed* setup is offered the three maintenance skills instead of the interview.
- **README: "What the first scan is like."** The scan is a large consumption event and the docs listed only Claude Code and Word as requirements. The section says it is the most expensive run they will do, that stopping partway is safe, that a first list is short because the employer registry starts nearly empty, and that nothing is ever submitted for them.
- **README: "About those permission prompts."** "No coding required" was true about typing and false about consent — setup runs `winget` / `brew` / `sudo apt`, `claude mcp add` and `node`, and in Claude Code's default mode each raises an approval prompt showing a raw command line. The section names the exact commands and why, says every one is declinable, and offers "skip anything that needs installing" as an opening instruction.

### Changed
- **`job-search` writes the digest as it goes.** It was written only at the end, so a user who hit a usage limit partway through had nothing at all — no partial list, no record of what had been checked. The file is now created as soon as the first batch is scored, marked `IN PROGRESS`, and appended to per batch.
- **Firecrawl is described per sector, honestly.** The README called declining it "genuinely fine", which is true for Greenhouse/Lever-class boards and false for the audience the plugin was built for: NEOGOV, Workday, USAJOBS, CalCareers and Paylocity cannot be read without JS rendering, and `job-search`'s Gate 2 refuses to draft against a posting it cannot re-confirm — so for a public-sector search, declining ends the run at the digest with no packets. Onboarding now judges this from the user's actual employer list and says which case they are in.
- **Connecting Firecrawl now comes with the restart.** MCP servers load at session start, so a server connected during onboarding is unusable in that session — onboarding recorded `firecrawl: connected` and the first scan behaved as though it were not. Both the skill and the README say so at the moment of connecting, matching the Windows `PATH` warning that already existed.
- **Node.js install guidance no longer produces a broken pipeline.** `sudo apt install nodejs` installs Node 12 on Ubuntu 22.04 and Debian 11 — no global `fetch`, so every script dies with a `ReferenceError` that reads like a bug in this plugin. `local-tooling.md` now gives the NodeSource LTS command for those systems, the scripts state a v18 minimum, and onboarding checks `node --version` instead of assuming the install worked.
- **The `docx` skill is checked, not asserted.** `docx-generation.md` claimed it "ships with Claude Code"; availability varies by surface and version, and the fallback quietly hands formatting back to the user. Onboarding and `jobscan-doctor` both check, and say so during setup rather than when a packet is due.
- **The weekly schedule is described as what it is.** The README listed it as an offered extra; the plugin cannot install a scheduler, and the fallback is cron or Task Scheduler — terminal work for someone promised none. It now says that plainly and notes that asking for the scan weekly is a fine substitute.
- `docs/ARCHITECTURE.md` documents the seven skills, the new generated files, the Node and Firecrawl prerequisites, and adds two architectural rules to §6: **no silent degradation**, and **nothing personal under the plugin root**.
- `.gitignore` also excludes `setup-state.md` and `Work Search Log.md`.

## [0.3.0] - 2026-08-24

### Fixed
- **The ATS pipeline could not run from an installed plugin.** Every invocation was repo-relative (`node scripts/fetch-ats.mjs`), which only resolves from a clone of this repository; installed, the scripts live under the plugin root and the command failed. `job-search` then treated the failure as "the pipeline isn't set up" and skipped it *silently*, so the cheapest and most complete half of a scan quietly never ran for anyone who installed the plugin the way the README tells them to. All invocations now use `${CLAUDE_PLUGIN_ROOT}/scripts/`, with a stated fallback for deriving the absolute path when that variable is unset, and a fallback to web search must now be recorded in the digest's Process note rather than passing unmentioned.
- **A plugin update deleted the user's scanner setup.** `triage-config.json`, `employers.json`, `ats-feeds.json`, `workday-candidates.json` and `seen-urls.json` were read and written next to the scripts, inside the plugin directory that `/plugin update` replaces wholesale. Users lost their employer registry and their seen-URL dedup cache to the exact command the README recommends, with no error: previously rejected postings simply started resurfacing. All personal files now live in `<data_path>/ats/`.
- **`calibrate.mjs` and `pipeline.mjs` looked for `Applied Index.md` in the working directory**, so from anywhere but the archive folder they reported an empty index — which `scripts/README.md` framed as the expected first-run *finding* that outcomes were never recorded. A path bug was reporting itself as a diagnosis about the user. Both now resolve the archive from the config, and say explicitly that a missing index is a path problem.
- **Onboarding wrote the user's field employers and keywords into the plugin's own `job-search/references/sources.md`**, where an update overwrites them. It now writes `<data_path>/sources.md`, which `job-search` reads in preference to the shipped default.

### Added
- **`scripts/paths.mjs`** — one resolver for all three roots, imported by every script. The data directory comes from `$JOBSCAN_DATA`, then `data_path:` in `~/.claude/jobscan-data/jobscan-config.md`, then `~/.claude/jobscan-data/`; the archive from `$JOBSCAN_ARCHIVE`, then `archive_path:`, then the working directory. Run it alone (`node paths.mjs`) to print every resolved path, which is the fastest way to tell a configuration problem from an empty result.
- **A read-only migration path.** A config file still sitting beside the scripts from an earlier install is read as before, with a one-line notice naming where to move it. Nothing is ever written back to the plugin directory, and onboarding moves the files when it next runs.

### Changed
- The `~1,950 postings / ~87% rejected` figure is now labelled as coming from a *tuned* 24-employer registry, with a note that a fresh registry returns far less until the employer list grows.
- `README.md` states that updating the plugin never touches the user's own files.

### Documentation (previously unreleased)

#### Added
- **"Keeping JobScan up to date" in the README.** Claude Code pins an installed plugin to its manifest `version`, and background auto-update is off by default for any marketplace that isn't Anthropic's own — JobScan's included. Users had no way to know a fix had shipped, or how to take it. The section gives the plain-words ask ("Update my JobScan plugin"), the two typed commands behind it (`/plugin marketplace update jobscan`, `/plugin update jobscan@jobscan`), and notes that installs from the community marketplace do refresh in the background.
- **`ARCHITECTURE.md` §9 documents both distribution paths.** JobScan's own marketplace doesn't auto-update; the community catalog pins a commit SHA but CI bumps that pin automatically as commits are pushed, so a merged change reaches the catalog without a fresh submission (nightly sync, so allow a day). Either way the `version` pin still gates delivery.

Documentation only; shipped as part of 0.3.0.

## [0.2.2] - 2026-08-24

### Changed
- **Existing `job-search` / `job-applications` skills are now an integration case, not a reason to stay away.** The README section previously told anyone with personal skills of those names not to install the plugin in the environment that runs their real search. That advice rested on a name collision that doesn't exist: Claude Code namespaces plugin skills, so JobScan's arrive as `/jobscan:job-search` and the personal skills keep their bare names, their files, and their behaviour. The section now covers the overlap that is real — both descriptions being listed to Claude, so a vague request matches two skills — and its three fixes (ask specifically, sharpen the personal skill's `description`, or set `disable-model-invocation: true`), noting that `skillOverrides` is not a lever because it doesn't apply to plugin skills. It then gives four ways to combine the two: take the generated data layer and point existing skills at the fixed config path, split the workflow between finder and drafter, borrow individual reference files, or keep them apart in a scratch project.
- **Onboarding checks for those skills before it asks anything.** It looks in `~/.claude/skills/` and the project's `.claude/skills/`, treats anything it finds as the production system (never edited, renamed, or deleted without permission), and offers a choice: build the data layer and configure *their* skill to read it, or run the full setup. Step 6 gained the corresponding branch — path resolution plus sources written into their `SKILL.md`, in their structure, with JobScan's verification and formatting rules offered rather than imposed. Existing profiles, résumés, and archives are read as interview material instead of being regenerated over.
- **`ARCHITECTURE.md` documents the integration seam** in a new §8: the fixed config path at `~/.claude/jobscan-data/jobscan-config.md` is what makes the data layer skill-agnostic, so onboarding has two legitimate exit points and both should keep working in any fork.

## [0.2.1] - 2026-08-24

### Fixed
- **Firecrawl now has an install path, and it needs no sign-up.** The README recommended Firecrawl without saying how a non-coder gets it, and the onboarding skill only mentioned the fallback when it was absent. Both now route through Firecrawl's keyless hosted MCP server at `https://mcp.firecrawl.dev/v2/mcp` — no account, no API key, and no second plugin marketplace to add. Onboarding runs the connection itself (`claude mcp add --scope user --transport http firecrawl …`), consistent with the rule that commands belong to Claude. A free API key, or the `firecrawl@claude-plugins-official` plugin from Anthropic's own marketplace, is offered only as an upgrade for higher limits, never as the entry point.
- **Firecrawl tool names were wrong throughout.** The skills referenced `firecrawl-scrape`, `firecrawl-search`, `firecrawl-map`, `firecrawl-agent`, `firecrawl-interact` and `firecrawl-monitor`; the server actually exposes `firecrawl_scrape`, `firecrawl_search`, `firecrawl_parse`, `firecrawl_map`, `firecrawl_agent`, `firecrawl_interact` and `firecrawl_monitor_create` (underscores). Every reference is corrected, so the guidance names tools that exist.
- **Keyless vs. keyed capabilities are now distinguished.** `firecrawl_scrape`, `firecrawl_search` and `firecrawl_parse` work without a key and cover what the scan needs; `firecrawl_map`, `firecrawl_agent` and the monitors require one. The job-search skill previously listed `firecrawl-map` and `firecrawl-agent` as preferred tooling, which would have failed silently for any user on the keyless tier.
- **The desktop plugin browser cannot add a third-party marketplace.** Claude Code's documentation states the browser lists plugins "from your configured marketplaces," so it cannot perform JobScan's first install step. The README's step 1 claimed otherwise; it now leads with the plain-words request Claude executes itself, keeps the two slash commands as the typed alternative, and says plainly what the desktop browser can and cannot do. The 0.2.0 changelog entry describing the browser as one of "two non-command ways to install the plugin" was mistaken on that point.

## [0.2.0] - 2026-08-22

### Added
- **CV-first onboarding.** Setup now opens by asking for the user's CV or résumé and any material that already answers the interview — an old profile, a personal statement, past cover letters, or answers they wrote out themselves in any format. Claude drafts answers to the 19 questions a CV can cover, confirms them in batches, and asks only the 22 a CV cannot know; three tooling questions are auto-detected instead of asked. Every question in `intake-questionnaire.md` is now tagged `[CV]` / `[ASK]` / `[AUTO]`, and the skill is instructed to *revise* the remaining questions against what the CV said — using the user's vocabulary, dropping questions that don't apply, and sharpening ambiguous ones — rather than reading a fixed script. Answering all 44 questions independently remains a first-class path, offered explicitly at the start.
- **Install step 0 — getting Claude Code.** The README previously assumed the reader already had it, which is the one prerequisite no amount of in-plugin wording can soften: the CLI is a terminal application. Step 0 now points at the desktop app, which installs plugins without a terminal, notes the Git-for-Windows requirement for its Code tab, and gives two non-command ways to install the plugin — the desktop plugin browser, or simply asking Claude to add the marketplace in plain words.
- `docs/INTERVIEW-QUESTIONS.md`: the onboarding interview written out for prospective users — all 44 questions in plain language, what to have ready, where answers are stored, and what setup produces. Linked from the README so the interview is visible before install rather than only after it.
- **ATS feed pipeline** (`plugins/jobscan/scripts/`). Pulls open roles directly from the public JSON job-board APIs of Greenhouse, Lever, SmartRecruiters, Ashby, Workable, Workday (CXS) and Paylocity. No API keys, no scraping. Includes zero-token title triage, dedup against the applied-index plus a persistent seen-URL cache, ATS discovery probes, and a regression test suite. All field-specific behaviour is config-driven through `triage-config.json`, so the pipeline is not tied to any one profession.
- `Work Search Log.template.md` for users claiming unemployment benefits, plus guidance that a weekly application quota changes what the scan optimizes for.
- `local-tooling.md`: recommended free local tools (Poppler, Tesseract, Pandoc, LibreOffice) with per-OS install commands, a check for whether a PDF has a text layer, and file-discovery habits.
- `Outcome` column in the applied-index template, so fit scores can be calibrated against what actually happened rather than assumed.
- `calibrate.mjs`: reads recorded outcomes and reports conversion by fit-score band, plus rules the user’s own outcomes contradict. Refuses to draw conclusions below eight resolved outcomes rather than presenting noise as signal. Closes the feedback loop that made scoring unfalsifiable.
- `pipeline.mjs`: models the application pipeline rather than the weekly snapshot — packets built but never submitted, applications stale enough to follow up on, and weekly quota tracking.

### Changed
- **Word or Pages only.** Packets are produced as `.docx` by the `docx` skill and opened in Microsoft Word or Apple Pages; PDFs come from those apps' own export. `docx-generation.md` is rewritten around this, with a no-install paste-in fallback and a warning about Pages silently saving `.pages` files employers can't open.
- **Non-coder posture throughout onboarding.** Claude runs every command rather than handing commands to the user, writes all config files itself, asks for locations in plain terms ("your Documents folder") and converts them to paths, and treats every technical step as declinable. The ATS pipeline is presented as "a faster, cheaper scan" the user opts into, and `job-search` now falls back to web search silently when it isn't set up instead of stalling mid-scan on a missing dependency.
- Fit scoring: hard gates are disqualifications rather than low scores; weights are written down rather than re-derived per posting; recorded outcomes are used to correct rules that prove wrong.
- Search guidance: ATS feeds run before keyword search; per-portal tool routing; scope open-web queries with `site:`; rotate sweep order so a tool timeout never starves the same sources every week.
- Operational rules: never spend metered credits on local files; verify a tool is genuinely unavailable before falling back; cap interactive browser sessions; check a monitor's recurring cost before creating it.
- Subagent guidance: fan out for context isolation, not speed, since scrape concurrency is capped per account.

### Removed
- The R `officer` script and Pandoc recipes for building `.docx` files, and the "Markdown→docx path" question they required at onboarding. Both assumed software a job seeker has no reason to own, and the question was the most confusing thing in setup for anyone who doesn't code.
- Pandoc, LibreOffice, `jq`, and `ripgrep` from the recommended local tooling. Word and Pages cover document conversion; the rest were agent conveniences presented as user prerequisites.

### Fixed
- Install instructions and the plugin `homepage` pointed at `MarioLuppino/JobScanPluggin`, the repository's name before it was renamed to `JobScanPlugin`. GitHub's rename redirect kept them working, but a redirect is not a guarantee: were the old name ever claimed by another account, `/plugin marketplace add` would resolve somewhere else entirely.

## [0.1.0] - initial release
- Initial release: `job-search`, `job-applications`, and `jobscan-onboarding` skills; field-agnostic references and fill-in templates; marketplace + plugin manifests; README and architecture guide.
