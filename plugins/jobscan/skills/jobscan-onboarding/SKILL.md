---
name: jobscan-onboarding
description: >-
  One-time guided setup for JobScan. Reads the user's CV or résumé first, pre-fills what it can, then asks
  only what's left about their background, constraints, and target roles — and generates their personal
  candidate profile, compressed digest, per-tier base résumés, voice file, and an empty applied-index, and
  configures paths. Use when the user says "set up jobscan", "run jobscan onboarding", "get me started with
  the job scanner", or when job-search/job-applications reports no profile exists yet.
---

# JobScan Onboarding

Conduct the interview, then generate the user's personal files from templates. Never leave them a blank profile.

## Assume the person you're talking to does not code

Most people who need this are job seekers, not developers. Unless they show otherwise, assume they have never used a terminal, don't know what a file path or JSON is, and don't want to learn today. Throughout:

- You run every command. Never paste one for the user to run, and never make setup wait on them doing something technical. Where an install genuinely needs their password, hand over one line, say what it does, and offer to skip it.
- No jargon in questions. Ask "where should I keep your job-search files? Your Documents folder is a good default", then turn that into a real path yourself. Never ask someone to type a path or explain `~`.
- No config files in their face. You write `triage-config.json`, `employers.json`, and the config file. They never open, name, or edit one.
- Everything technical is optional and skippable. Say so when you offer it, and mean it: the system works without Node, without Firecrawl, and without any local install.
- Word or Pages, nothing else. Documents are produced as `.docx` and opened in Microsoft Word or Apple Pages. Never offer, mention, or ask about Pandoc, LibreOffice, R, or a "Markdown to docx path".

## Before Step 1: check whether they already run their own job-search skills

Look for `job-search` or `job-applications` directories in `~/.claude/skills/` and the project's `.claude/skills/`. If either exists, theirs is the production system. JobScan's copies are namespaced (`/jobscan:job-search`) and don't replace it. Never edit, rename, or delete a skill of theirs, and never touch one at all without asking first.

Say that in a sentence, then offer the choice:

- "Build the files, leave my skills alone", the default, and the right answer for anyone with a routine that already works. Do Steps 1-5 and 7 as written, but in Step 6 configure their skill, not the plugin's (see that step). The generated files are plain Markdown at a fixed, discoverable path; any skill can read them.
- "Use JobScan's skills instead", full setup as written. Tell them their own skills keep the bare `/job-search` name and still work, but that a vague request now matches two descriptions. Offer the fix: sharpen their skill's `description` so it names what's specific to it, or add `disable-model-invocation: true` to its frontmatter so only they invoke it by name. Don't offer `skillOverrides`; it has no effect on plugin skills.

If they already have a profile, résumés, or an application archive from that routine, read them; don't regenerate over them. Existing material answers most `[CV]` questions and often the voice file too. Where their file and a template disagree, keep their file: offer to add anything the template has that theirs lacks, and write anything genuinely new alongside rather than in place of it.

## Setup can be interrupted, so write as you go

Forty-four answers lost to a closed window or a context limit is what happens when nothing is written until Step 4. Checkpoint after every section of the interview, not at the end:

1. As soon as the user names a location (Step 3), write the config file, so everything after it has somewhere to go. If they haven't chosen yet, use `~/.claude/jobscan-data/` and say you'll move it later if they want; the `where` skill moves it in one line.
2. After each section of `references/intake-questionnaire.md` is answered and confirmed, append it to `<data_path>/profile.md` under its own heading.
3. Keep a short `<data_path>/setup-state.md`: which sections are done, which are outstanding, and one line on anything the user deferred or declined. Update it in the same turn as the profile.

Say once, early, that stopping is safe: "we can stop any time and pick up where we left off."

Resuming. If `<data_path>/setup-state.md` or a partial `profile.md` exists when this skill starts, do not begin again. Read them, tell the user in one line what's already done, and ask only what's outstanding. "Resume my jobscan setup" and "set up jobscan" arrive here the same way; the state file decides which one it is. A completed setup that is re-run should offer the `profile`, `employers` and `where` skills instead, because changing one setting never needs the interview again.

Resuming is the wrong answer exactly once: when the user wants to start over because something early was wrong. A misread CV or the wrong target field is not an interrupted interview, and continuing one rebuilds the same mistake. If that is what they are describing, hand it to the `reset` skill, which moves the old profile and `setup-state.md` aside, keeps the archive, and hands back here for a genuine fresh start.

## Step 1: ask for their CV before you ask them anything else

Opening with question 1 of 44 makes someone re-type a career they already wrote down. Start here instead:

1. "Do you have a CV or résumé? Drag it into the chat, or tell me where it is." Word, PDF, or plain text all work. Read it from disk if they name a folder.
2. "Anything else that already answers these questions?" An old profile or biosketch, a personal statement, a LinkedIn export, past cover letters (the best raw material for the voice file), or answers they've already written out. Accept any format: a Word or Pages document, an email to themselves, a photo of handwritten notes.
3. "Would you rather I pull what I can from your CV and check it with you, or give you the whole list to answer yourself?" Both are real options. If they want the full list, give them all 44 questions from `references/intake-questionnaire.md`, grouped by section, and let them answer at their own pace and in their own format, then read their answers back in and skip to Step 3.

No CV and nothing written down is fine; run the interview as a conversation. Say once that a CV would cut the time roughly in half, in case one exists they didn't think to mention.

Read what they give you before asking anything. If a PDF turns out to be a scan with no text layer, see `references/local-tooling.md`: read it locally, don't spend metered credits on a file already on disk.

## Step 2: interview, confirming what you read and asking only what's missing

Work from `references/intake-questionnaire.md`, which tags each of the 44 questions:

- `[CV]` (19 of them): draft the answer from their CV and confirm it in batches. "From your CV I have 12 publications, $1.4M in funding, and six years supervising a four-person lab, anything wrong or missing?" Never re-ask what they already handed you.
- `[ASK]` (22): a CV can't know these. Salary floor, work authorization, locations, the avoid-list, writing voice, interview stories. Always ask.
- `[AUTO]` (3): runtime, Firecrawl, browser tools. Detect these yourself; don't make them a question.

Revise the questions you still have to ask, based on the CV. The list is a checklist of what you need to know, not a script to read aloud. Use their vocabulary, drop what doesn't apply (no publications, no DOI question; not academic, no dissertation question), and sharpen anything the CV left ambiguous: "your CV lists 12 publications, are all 12 published with DOIs or are some in review?" rather than "how many publications do you have?"

Two things a CV will always be missing, so ask for them explicitly: the numbers behind its bullets (scale, budget, headcount, audience), and the non-academic jobs people trim off but that prove the transferable skills.

Nothing read from a CV is fact until they confirm it. Where they don't confirm, mark it rather than quietly keeping it. And confirm the standing rules they want enforced:

- Never list in-review work as published (DOI-only)? (Recommend yes.)
- Salary floor, preferred range, relocation floor, any government pay-grade floor.
- Location/political-lean handling; remote exemption.
- Fit floor (recommend 50); the avoid-list.
- Split quota (domestic/international per scan), if any.

## Step 3: choose where their files live, and write the config

Ask in plain terms, "where should I keep your job-search files?", and offer their Documents folder as the default. Two locations, which can be the same parent:

- Data path: their personal files. Profile, base résumés, voice file, their `sources.md`, and an `ats/` folder for the scanner's config and caches. Default `~/.claude/jobscan-data/`.
- Archive path: application folders, digests, and the applied index.

Convert their answer into a real path yourself. On Windows, prefer a location near the drive root: deep folder trees plus long file names hit the 260-character limit.

Write `~/.claude/jobscan-data/jobscan-config.md` from `references/templates/jobscan-config.template.md`, filling in both paths. That location is fixed and discoverable: `job-search` and `job-applications` read it first on every run to resolve `<jobscan-data>` and `<archive>`, and it is what lets a later scan find a non-default archive. The data path may differ from the config's own folder, but the config file itself always lives at `~/.claude/jobscan-data/jobscan-config.md` so it's always findable.

## Step 4: generate personal files (into the data path)

Use the templates in `references/templates/`, filling placeholders from the interview and the CV. Do not ship or commit these filled files; they are the user's private data.

1. `profile.md`, from `profile.template.md`. Populate every section, and keep the "Propagation on edit" note at the top. This is the source of truth.
2. `profile-core.md`, from `profile-core.template.md`. Distill `profile.md` into the ~1-page digest (positioning, constraints, quantified anchors, condensed skills/roles, publishable pubs, translation table, ATS keyword bank, role archetypes). Mark it DERIVED.
3. `base-resumes/`: copy `base-resumes/README.md` and the three `*.template.md` scaffolds; fill the stable content (contact, education, publications, certs, core skills, experience bullets) and leave the `⟪TAILOR⟫` slots. Drop any tier the user won't use.
4. `cover-letter-voice.md`, from `cover-letter-voice.template.md`. If they shared past letters that landed interviews, reverse-engineer their real voice; otherwise draft a first version using the drafting mechanics in the `job-applications` skill's `references/writing-playbook.md`, and mark it living.

Then show them what you built. Walk through the profile in the chat and invite corrections: this is where a misread CV surfaces, and fixing it here is cheaper than in a submitted application.

If you have been checkpointing (see above), most of `profile.md` is already on disk by now and this step is completing it. The derived files (`profile-core.md`, the résumé scaffolds, the voice file) are built from the finished profile, and `setup-state.md` records which of them exist.

## Step 5: set up the archive

In the archive path, create `Applied Index.md` from `references/templates/Applied Index.template.md` (header only, or backfilled from existing folder names if they already have application folders), `Considered - Not Pursued.md` from its template (the do-not-resurface list for roles seen and passed on), and a `Job Search Digests/` folder.

Ask whether the user is claiming unemployment benefits. If they are, also create `Work Search Log.md` from `references/templates/Work Search Log.template.md` and have them fill in the requirement block from their own agency's rules: the required count, the week boundary, and what counts all vary by jurisdiction, so they must confirm it, not you. A weekly application quota changes what the scan is for. The deliverable becomes enough genuinely applyable roles to clear the quota, not a tidy ranked ten. Tell the `job-search` skill the number. Never let a quota lower the fit floor.

## Step 6: field-specific search config (you do this, not them)

Write `<data_path>/sources.md`, never the plugin's copy. Start from the `job-search` skill's `references/sources.md`, keep the source categories, and swap in the user's field employers, boards, APIs and domain keywords. Encode the asymmetric-keyword pairs that must both be searched. The plugin's own file stays untouched: it is replaced wholesale on `/plugin update`, so an edit made there is deleted the first time the user takes a new version. `job-search` reads `<data_path>/sources.md` first and falls back to the shipped default.

If they chose to keep their own skills (see the check before Step 1), configure those instead. Ask permission, show what you're changing, and make two edits to their `SKILL.md`:

1. Path resolution, so their skill finds what you just generated: read `~/.claude/jobscan-data/jobscan-config.md` for `data_path` and `archive_path`, then read `<data_path>/profile-core.md` for the profile.
2. Sources: the same field employers, boards, and keywords, written into whatever file their skill already uses for them, matching its structure rather than JobScan's.

Then offer, without pushing, anything of JobScan's their routine doesn't already have: the two-gate live-verification rule, the ATS and résumé-format rules, the writing playbook, the digest template, or `Applied Index.md` as a single dedup read. Their skill stays the one that runs.

Then set up the ATS feed pipeline, the highest-value step in onboarding. It pulls open roles straight from employers' job-board APIs, which is far cheaper and more complete than keyword search. Describe it to the user as "a faster, cheaper scan", ask only which employers they'd love to work for, and do the rest yourself.

Two directories, and never mix them. The scripts live in the plugin at `${CLAUDE_PLUGIN_ROOT}/scripts/` and are read-only: a `/plugin update` replaces that directory wholesale. Everything personal goes in `<data_path>/ats/`, which nothing but you and the user ever touches. If `${CLAUDE_PLUGIN_ROOT}` is empty in your shell, derive the absolute path from where this `SKILL.md` sits (the plugin root is two levels above `skills/jobscan-onboarding/`) and use it in full. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/paths.mjs"` once: it prints every resolved path, and it is the fastest way to confirm the config you wrote in Step 3 is being found.

Then, writing into `<data_path>/ats/`:

1. Copy the plugin's `scripts/triage-config.example.json` to `<data_path>/ats/triage-config.json` and replace `matchTitlePatterns` with the job titles from question 35. Without this almost nothing matches.
2. Copy `scripts/employers.example.json` to `<data_path>/ats/employers.json` with their employers.
3. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/discover-ats.mjs"` and, for large employers, `node "${CLAUDE_PLUGIN_ROOT}/scripts/discover-workday.mjs"`. Both write `ats-feeds.json` into `<data_path>/ats/` themselves.
4. Verify with `node "${CLAUDE_PLUGIN_ROOT}/scripts/fetch-ats.mjs" --summary` and `node "${CLAUDE_PLUGIN_ROOT}/scripts/test-triage.mjs"`.

See `scripts/README.md`. If a script reports it is reading config from the plugin folder, this is a setup from before the split: move those `.json` files into `<data_path>/ats/`, tell the user in one sentence that you moved them so a plugin update can't delete them, and carry on.

This needs Node.js v18 or newer. If it isn't installed, offer to install it in one sentence (`references/local-tooling.md` has the per-OS command, and you run it), then check the version you actually got with `node --version`. On Debian and Ubuntu, `sudo apt install nodejs` still ships a version far too old for these scripts, and every one of them dies with a `ReferenceError` about `fetch` that reads like a bug in the plugin; `local-tooling.md` has the working command for those systems. If they'd rather not install anything, skip the whole pipeline: say the scan will use web search instead, which is slower and costs more but works, and continue. Never let this step become the reason someone abandons setup.

## Step 7: confirm tooling and finish

Check what's available yourself rather than asking: Skills feature, Firecrawl, browser tools.

If Firecrawl isn't connected, offer it in one sentence and set it up yourself. It makes JS-heavy government portals cheaper and more reliable to read. Never send them to a sign-up page mid-interview, and never make it a condition of finishing: the scan works without it on built-in fetch/search and browser tools. Two routes, in this order:

1. Hosted, keyless, the default offer. Connect Firecrawl's remote MCP server at `https://mcp.firecrawl.dev/v2/mcp`: no account, no API key, no marketplace to add. You run it: `claude mcp add --scope user --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp`. The keyless tier is rate-limited per day and serves `firecrawl_scrape`, `firecrawl_search` and `firecrawl_parse`, which is what the scan needs.
2. Keyed, only if they ask for more. Firecrawl is a plugin in Anthropic's official marketplace, which Claude Code configures automatically, so there is no third-party marketplace involved: `/plugin install firecrawl@claude-plugins-official`, then `/firecrawl:setup` to paste a free API key from firecrawl.dev. This raises the limits and unlocks the rest of its tools. Only mention this if the keyless route gets rate-limited or they ask for it; a sign-up is exactly the barrier this setup avoids.

Then say that Claude Code has to restart before it can use it. MCP servers are loaded when a session starts, so the tools you just connected do not exist in this session: the first scan run without a restart behaves exactly as though Firecrawl were never set up, and government portals come back `UNVERIFIED` for no visible reason. This is the same trap as the Windows `PATH` note below, and it needs saying at the same moment, not after they conclude it failed.

Record the outcome as `firecrawl: connected | not-connected` in the config file, and record what it means for them, because it is not the same for everyone. You know their target employers by now (Step 6):

- Mostly government or large-enterprise portals (NEOGOV/governmentjobs, Workday, USAJOBS, CalCareers, Paylocity): say plainly that these can't be read without JavaScript rendering, and that `job-search`'s second gate refuses to draft anything it can't re-confirm live, so declining Firecrawl means digests with no packets behind them, not a slightly worse scan. Do not soften this.
- Mostly Greenhouse, Lever, SmartRecruiters, Ashby or Workable boards: ordinary fetching reads these fine, and declining really is fine. Say that too.

If they decline, note it once and move on.

Then offer, per `references/local-tooling.md`, to install the free PDF tools (Poppler, and Tesseract for scanned documents), because without them the agent burns metered credits reading files already on disk. Run the installs yourself. On Windows, tell them a restart of the terminal or app is needed before a new install shows up, before they conclude it failed.

Ask the one document question: Word or Pages? Both work; it only changes the two-line instructions you give when they edit a file themselves. Nothing to install. See the `job-applications` skill's `references/docx-generation.md`.

Check the `docx` skill is actually there rather than assuming it; its availability varies by surface and version. If it's missing, say so now, in one sentence: packets still get built through the paste-into-Word path, but the user formats them, which they should hear during setup rather than the first time a résumé is due.

Offer the weekly scheduled run, but check first that this surface can actually do it. Register the task from `references/templates/weekly-scan-task.template.md`; the `job-search` skill's `references/scheduling.md` carries the rules. Two things matter more than the registration itself:

- Don't promise a schedule this surface doesn't offer. Scheduling is the one capability that varies by where Claude is running. If there is nothing here to register with, say so in one sentence and offer the honest alternatives: an OS scheduler, which is real terminal work, or a calendar reminder to ask for the scan themselves. A schedule someone believes in and does not have is worse than none, because they stop asking.
- Say where an unattended run leaves its result, and how to get it back. Nobody is reading the chat at 07:00 on a Monday. The scan writes a dated file into their `Job Search Digests` folder, and "show me last week's digest" is the sentence that retrieves it. Without that, a week with no matches and a week where the scan never ran look identical.

Finish with the check, and read it out. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs"` (the `jobscan-doctor` skill covers the rest) and confirm in plain words that everything the scan depends on is in place, or name what isn't and why it was skipped. Then summarize what was created, by what it does rather than by filename, and tell them to run "run my weekly job search".

Say once what these files are, because the format surprises people. Everything you just generated is plain text ending in `.md`, and on Windows double-clicking one asks which app to open it with, which reads as something broken. Tell them, in a sentence: they never need to open one, asking you to read it back or change it is the intended way, and any text editor opens them if they want to look. The résumés and cover letters are the exception and they should hear that in the same breath: those arrive as real Word `.docx` files, one per application.

Say what the first scan is like before they run it: it's the most expensive run they'll do, later scans skip everything already seen, the digest is written as it goes so stopping partway keeps what was found, and nothing is ever submitted for them. Tell them every scan leaves a dated file in their `Job Search Digests` folder, and that "show me last week's digest" reads it back without running anything.

Tell them the four things they can change later without another interview: "change my salary floor" and anything else in the profile, "add employers to my job scan", "where does jobscan keep my files", and, if this setup turns out to be built on something they got wrong, "start my jobscan setup over". Say that last one once, plainly.

Privacy reminder: everything generated in Steps 4-5 is personal career data. If the user is working inside a clone of the repo, confirm `.gitignore` is excluding it. Never commit a filled profile, résumé, digest, or index.
