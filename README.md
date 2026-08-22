# JobScan

A reusable, **field-agnostic** weekly job-scan + tailored-application system for [Claude
Code](https://claude.com/claude-code), packaged as a plugin. It finds live job postings you're a strong fit
for, scores and ranks them into a digest, and — on your selection — drafts ATS-safe tailored résumés and
cover letters. It **prepares packets; it never submits applications.**

Built for research-to-industry transitions and designed to adapt to any field — plant pathology, data
science, ecology, whatever your profile is. A guided onboarding skill reads your CV, interviews you about
what it can't know, and builds your candidate profile, so you don't start from a blank file. **No coding
required at any point** — if something needs installing, Claude installs it.

## What's in the box

Two cooperating skills plus onboarding:

- **`job-search`** — the *finder*. Searches boards, de-dups, verifies each posting is live, scores fit, ranks
  a top ~10, writes a dated digest, and stops.
- **`job-applications`** — the *drafter*. Maps an employer's competencies to your evidence and produces a
  tailored résumé + cover letter (`.docx`) and interview prep.
- **`jobscan-onboarding`** — a one-time setup that starts from your CV, asks only what the CV can't answer,
  and generates your personal `profile.md`, its compressed `profile-core.md` digest, per-tier base résumés, a
  voice file, and an empty applied-index. You can read [every question it asks](docs/INTERVIEW-QUESTIONS.md)
  before installing anything.

It is built around **token-efficiency** (a compressed profile digest, per-tier résumé scaffolds you *edit*
rather than regenerate, a single de-dup index instead of rescanning folders) and **verification discipline**
(no listing is drafted against unless its posting is confirmed live at draft time).

## Install

**You don't need to know how to code.** Everything below is typed into Claude Code's chat box — the same
place you'd type a question — not into a terminal, and not into a file.

**1. Add the plugin.** Send these two lines, one at a time:

```
/plugin marketplace add MarioLuppino/JobScanPluggin
```
```
/plugin install jobscan@jobscan
```

**2. Do the setup interview, once.** Send:

```
Run jobscan onboarding
```

**Have your CV or résumé ready.** It's the first thing Claude asks for — drag the file into the chat — and
it answers 19 of the interview's 44 questions on its own. You confirm what it read, answer the 22 no CV can
know (salary floor, where you'll live, what you don't want to be sent, how you like to write), and Claude
detects the last few itself.

Would rather answer everything yourself? Ask for the full list and write your answers anywhere — a Word or
Pages document, an email to yourself, a photo of handwritten notes — then hand the file over.

> 📋 **See the questions first:** [What the setup interview asks](docs/INTERVIEW-QUESTIONS.md) — all 44 in
> plain language, which ones your CV answers for you, and what to have ready.

Your answers become files on **your own computer**, in a folder you choose — "my Documents folder" is a
perfectly good answer, and Claude sorts out the rest — plus an archive folder for your applications. Nothing
is uploaded here.

**3. Run your first scan.** Once setup finishes, send:

```
Run my weekly job search
```

## What you actually need

**Microsoft Word or Apple Pages.** That's the entire software requirement. Résumés and cover letters arrive
as `.docx` files you open and edit in whichever one you already have, and both export a PDF when a job portal
insists on one. No converters, no toolchains, no programming languages.

You never have to open a terminal, edit a configuration file, or run a command. Where setup needs something
installed, Claude installs it and tells you in a sentence what it did.

Three optional extras, each of which Claude offers during setup and each of which you can decline:

- **[Firecrawl](https://www.firecrawl.dev/)** — makes JavaScript-heavy government portals (NEOGOV, Workday,
  USAJOBS, CalCareers) cheaper and more reliable to read. Without it the scanner falls back to ordinary web
  search and still works.
- **A faster scanner.** Claude can pull openings straight from employers' own job boards instead of searching
  for them — far cheaper and more complete. It needs Node.js, which Claude installs for you. Decline it and
  the scan uses web search instead.
- **A weekly schedule**, so the scan runs without you having to ask.

## Already have skills named `job-search` / `job-applications`?

This plugin's skills use those names. Claude Code loads user-global skills (`~/.claude/skills/`) in every
project, so if you already run personal skills with the same names, installing this plugin will create a
**name collision** and the generic plugin versions may trigger instead of yours. If that's you (e.g. you built
this plugin *from* an existing personal routine), don't install it into the environment that runs your real
search — your personal skills are the production system. To trial the plugin without disturbing a live routine, install it in an isolated project just long
enough to confirm it loads, or fork it and rename the skills.

## Privacy

**This project ships the method, never anyone's career data.** Your profile, résumés, digests, and
application archive are created on your own machine and stay there. Nothing you tell Claude during setup is
published here, and the project is configured to refuse to commit those files even if you're working inside a
copy of it. When adapting or forking, keep it that way: share the machine, never the career data.

## Adapting to your field

Everything domain-specific lives in your generated `profile.md` and in `references/sources.md` (the boards and
keywords). The skills, formatting rules, verification gates, and filing system are field-agnostic. See
[`docs/HANDOFF.md`](docs/HANDOFF.md) for the full architecture and a step-by-step adaptation guide.

## License

MIT — see [LICENSE](LICENSE).
