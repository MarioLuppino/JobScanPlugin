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

Turn a new user into a working JobScan setup. You conduct the interview, then **generate their personal
files from templates** — never leave them a blank profile.

## Assume the person you're talking to does not code

Most people who need this are job seekers, not developers. Unless they show otherwise, assume they have
never used a terminal, don't know what a file path or JSON is, and don't want to learn today.

That means, throughout:

- **You run every command.** Never paste one for the user to run, and never make setup wait on them doing
  something technical. Where an install genuinely needs their password, hand over one line, say what it does,
  and offer to skip it.
- **No jargon in questions.** Ask "where should I keep your job-search files? Your Documents folder is a good
  default" — then turn that into a real path yourself. Never ask someone to type a path or explain `~`.
- **No config files in their face.** You write `triage-config.json`, `employers.json`, and the config file.
  They never open, name, or edit one.
- **Everything technical is optional and skippable.** Say so when you offer it, and mean it — the system
  works without Node, without Firecrawl, and without any local install.
- **Word or Pages, nothing else.** Documents are produced as `.docx` and opened in Microsoft Word or Apple
  Pages. Never offer, mention, or ask about Pandoc, LibreOffice, R, or a "Markdown to docx path."

## Step 1 — Ask for their CV before you ask them anything else

Opening with question 1 of 44 makes someone re-type a career they already wrote down. Start here instead:

1. **"Do you have a CV or résumé? Drag it into the chat, or tell me where it is."** Word, PDF, or plain text
   all work. Read it from disk if they name a folder.
2. **"Anything else that already answers these questions?"** An old profile or biosketch, a personal
   statement, a LinkedIn export, past cover letters (the best raw material for the voice file), or answers
   they've already written out. Accept any format — a Word or Pages document, an email to themselves, a
   photo of handwritten notes.
3. **"Would you rather I pull what I can from your CV and check it with you, or give you the whole list to
   answer yourself?"** Both are real options. If they want the full list, give them all 44 questions from
   `references/intake-questionnaire.md`, grouped by section, and let them answer at their own pace and in
   their own format — then read their answers back in and skip to Step 3.

No CV and nothing written down is fine — run the interview as a conversation. Say once that a CV would cut
the time roughly in half, in case one exists they didn't think to mention.

**Read what they give you before asking anything.** If a PDF turns out to be a scan with no text layer, see
`references/local-tooling.md` — read it locally, don't spend metered credits on a file already on disk.

## Step 2 — Interview: confirm what you read, ask only what's missing

Work from `references/intake-questionnaire.md`, which tags each of the 44 questions:

- **`[CV]` (19 of them)** — draft the answer from their CV and **confirm it in batches**. "From your CV I
  have 12 publications, $1.4M in funding, and six years supervising a four-person lab — anything wrong or
  missing?" Never re-ask what they already handed you.
- **`[ASK]` (22)** — a CV can't know these: salary floor, work authorization, locations, the avoid-list,
  writing voice, interview stories. Always ask.
- **`[AUTO]` (3)** — runtime, Firecrawl, browser tools. Detect these yourself; don't make them a question.

**Revise the questions you still have to ask, based on the CV.** The list is a checklist of what you need to
know, not a script to read aloud. Use their vocabulary, drop what doesn't apply (no publications → no DOI
question; not academic → no dissertation question), and sharpen anything the CV left ambiguous — "your CV
lists 12 publications, are all 12 published with DOIs or are some in review?" rather than "how many
publications do you have?"

**Two things a CV will always be missing**, so ask for them explicitly: the *numbers* behind its bullets
(scale, budget, headcount, audience), and the non-academic jobs people trim off but that prove the
transferable skills.

**Nothing read from a CV is fact until they confirm it.** Where they don't confirm, mark it rather than
quietly keeping it. And confirm the standing rules they want enforced:

- Never list in-review work as published (DOI-only)? (Recommend yes.)
- Salary floor, preferred range, relocation floor, any government pay-grade floor.
- Location/political-lean handling; remote exemption.
- Fit floor (recommend 50); the avoid-list.
- Split quota (domestic/international per scan), if any.

## Step 3 — Choose where their files live, and write the config

Ask in plain terms — "where should I keep your job-search files?" — and offer their Documents folder as the
default. Two locations, which can be the same parent:

- **Data path** — their personal files. Default `~/.claude/jobscan-data/`.
- **Archive path** — application folders, digests, and the applied index.

Convert their answer into a real path yourself. On Windows, prefer a location near the drive root: deep
folder trees plus long file names hit the 260-character limit.

**Write `~/.claude/jobscan-data/jobscan-config.md`** (a FIXED, discoverable location — `job-search` and
`job-applications` read it first on every run to resolve `<jobscan-data>` and `<archive>`) from
`references/templates/jobscan-config.template.md`, filling in both paths. This is what lets a later scan find
a non-default archive. The data path may differ from the config's own folder, but the config file itself
always lives at `~/.claude/jobscan-data/jobscan-config.md` so it's always findable.

## Step 4 — Generate personal files (into the data path)

Use the templates in `references/templates/` — fill placeholders from the interview and the CV; **do not
ship or commit these filled files** (they're the user's private data):

1. **`profile.md`** — from `profile.template.md`. Populate every section. **Keep the "Propagation on edit"
   note at the top.** This is the source of truth.
2. **`profile-core.md`** — from `profile-core.template.md`. Distill `profile.md` into the ~1-page digest
   (positioning, constraints, quantified anchors, condensed skills/roles, publishable pubs, translation
   table, ATS keyword bank, role archetypes). Mark it DERIVED.
3. **`base-resumes/`** — copy `base-resumes/README.md` and the three `*.template.md` scaffolds; fill the
   stable content (contact, education, publications, certs, core skills, experience bullets) and leave the
   `⟪TAILOR⟫` slots. Drop any tier the user won't use.
4. **`cover-letter-voice.md`** — from `cover-letter-voice.template.md`. If they shared past letters that
   landed interviews, reverse-engineer their real voice; otherwise draft a first version using the drafting
   mechanics in the **`job-applications` skill's `references/writing-playbook.md`** and mark it living.

**Then show them what you built.** Walk through the profile in the chat and invite corrections — this is the
moment misreadings of a CV surface, and it's much cheaper to fix here than in a submitted application.

## Step 5 — Set up the archive

In the archive path, create **`Applied Index.md`** from `references/templates/Applied Index.template.md`
(header only, or backfilled from existing folder names if they already have application folders),
**`Considered - Not Pursued.md`** from its template (the do-not-resurface list for roles seen and passed on),
and a `Job Search Digests/` folder.

**Ask whether the user is claiming unemployment benefits.** If they are, also create **`Work Search Log.md`**
from `references/templates/Work Search Log.template.md` and have them fill in the requirement block from
their own agency's rules (the required count, the week boundary, and what counts all vary by jurisdiction —
they must confirm it, not you). A weekly application quota changes what the scan is *for*: the deliverable
becomes **enough genuinely applyable roles to clear the quota**, not a tidy ranked ten. Tell the
`job-search` skill the number. Never let a quota lower the fit floor.

## Step 6 — Field-specific search config (you do this, not them)

Edit the **`job-search` skill's `references/sources.md`** working copy (or a user override) to swap in the
user's field employers, boards, APIs, and domain keywords (keep the source categories). Encode the
asymmetric-keyword pairs that must both be searched.

**Then set up the ATS feed pipeline — the highest-value step in onboarding.** It pulls open roles straight
from employers' job-board APIs, which is far cheaper and more complete than keyword search. Describe it to
the user as "a faster, cheaper scan," ask only **which employers they'd love to work for**, and do the rest
yourself. In `plugins/jobscan/scripts/`: copy `triage-config.example.json` → `triage-config.json` and replace
`matchTitlePatterns` with the job titles from question 35 (without this almost nothing matches), copy
`employers.example.json` → `employers.json` with their employers, then run `node discover-ats.mjs` and, for
large employers, `node discover-workday.mjs`. Verify with `node fetch-ats.mjs --summary` and
`node test-triage.mjs`. See `scripts/README.md`.

This needs Node.js. If it isn't installed, offer to install it in one sentence (`references/local-tooling.md`
has the per-OS command — **you** run it). **If they'd rather not, skip the whole pipeline**: say the scan
will use web search instead, which is slower and costs more but works, and continue. Never let this step
become the reason someone abandons setup.

## Step 7 — Confirm tooling & finish

Check what's available yourself rather than asking: Skills feature, Firecrawl, browser tools.

**If Firecrawl isn't connected, offer it in one sentence and set it up yourself.** It makes JS-heavy
government portals cheaper and more reliable to read. Never send them to a sign-up page mid-interview, and
never make it a condition of finishing — the scan works without it on built-in fetch/search + browser tools.
Two routes, in this order:

1. **Hosted, keyless — the default offer.** Connect Firecrawl's remote MCP server at
   `https://mcp.firecrawl.dev/v2/mcp`. No account, no API key, no marketplace to add. **You** run it:
   `claude mcp add --scope user --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp`. The keyless
   tier is rate-limited per day and serves `firecrawl_scrape`, `firecrawl_search` and `firecrawl_parse` —
   which is what the scan needs.
2. **Keyed, only if they ask for more.** Firecrawl is a plugin in Anthropic's *official* marketplace, which
   Claude Code configures automatically, so there is no third-party marketplace involved:
   `/plugin install firecrawl@claude-plugins-official`, then `/firecrawl:setup` to paste a free API key from
   firecrawl.dev. This raises the limits and unlocks the rest of its tools. Only mention this if the keyless
   route gets rate-limited or they ask for it — a sign-up is exactly the barrier this setup avoids.

Record the outcome as `firecrawl: connected | not-connected` in the config file. If they decline, say once
that dynamic portals may come back `UNVERIFIED` and move on.

Then offer, per `references/local-tooling.md`, to install the free PDF tools (Poppler, and Tesseract for
scanned documents), because without them the agent burns metered credits reading files already on disk. Run
the installs yourself. On Windows, tell them a restart of the terminal or app is needed before a new install
shows up — *before* they conclude it failed.

Ask the one document question: **Word or Pages?** Both work; it only changes the two-line instructions you
give when they edit a file themselves. Nothing to install. See the `job-applications` skill's
`references/docx-generation.md`.

Offer the weekly scheduled run (register the task from `references/templates/weekly-scan-task.template.md` —
see the `job-search` skill's `references/scheduling.md`). Then summarize what was created, in plain language
and by what it does rather than by filename, and tell them to run **"run my weekly job search"**.

**Privacy reminder:** everything generated in Steps 4–5 is personal career data. If the user is working
inside a clone of the repo, confirm `.gitignore` is excluding it. Never commit a filled profile, résumé,
digest, or index.
