# JobScan

A reusable, **field-agnostic** weekly job-scan + tailored-application system for [Claude
Code](https://claude.com/claude-code), packaged as a plugin. It finds live job postings you're a strong fit
for, scores and ranks them into a digest, and — on your selection — drafts ATS-safe tailored résumés and
cover letters. It **prepares packets; it never submits applications.**

Built for research-to-industry transitions and designed to adapt to any field — plant pathology, data
science, ecology, whatever your profile is. A guided onboarding skill interviews you and builds your candidate
profile, so you don't start from a blank file.

## What's in the box

Two cooperating skills plus onboarding:

- **`job-search`** — the *finder*. Searches boards, de-dups, verifies each posting is live, scores fit, ranks
  a top ~10, writes a dated digest, and stops.
- **`job-applications`** — the *drafter*. Maps an employer's competencies to your evidence and produces a
  tailored résumé + cover letter (`.docx`) and interview prep.
- **`jobscan-onboarding`** — a one-time guided interview that generates your personal `profile.md`, its
  compressed `profile-core.md` digest, per-tier base résumés, a voice file, and an empty applied-index. You
  can read [every question it asks](docs/INTERVIEW-QUESTIONS.md) before installing anything.

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

Claude then interviews you about your background, what you're looking for, and where to keep your files —
conversationally, a few questions at a time. It's 44 questions, so set aside a real block of time and have
your CV handy.

> 📋 **See the questions first:** [What the setup interview asks](docs/INTERVIEW-QUESTIONS.md) — the full
> list in plain language, plus what to have ready before you start.

Your answers become files on **your own computer**, in a folder you choose (the default is
`~/.claude/jobscan-data/`) plus an archive folder for your applications. Nothing is uploaded here.

**3. Run your first scan.** Once setup finishes, send:

```
Run my weekly job search
```

## Optional but recommended

- **[Firecrawl](https://www.firecrawl.dev/) plugin/API key** — lets the scanner read JavaScript-rendered
  government portals (NEOGOV, Workday, USAJOBS, CalCareers) cheaply and do server-side posting→summary
  extraction. Without it, the system falls back to built-in web fetch/search + browser tools.
- **A Markdown→`.docx` path** — the drafter writes packets in Markdown then renders Word files. Any reliable
  path works (pandoc, the Claude `docx` skill, R's `officer` package, or Word/Docs).
- **A scheduler** — to run the scan weekly unattended.

## Already have skills named `job-search` / `job-applications`?

This plugin's skills use those names. Claude Code loads user-global skills (`~/.claude/skills/`) in every
project, so if you already run personal skills with the same names, installing this plugin will create a
**name collision** and the generic plugin versions may trigger instead of yours. If that's you (e.g. you built
this plugin *from* an existing personal routine), don't install it into the environment that runs your real
search — your personal skills are the production system. To trial the plugin without disturbing a live routine, install it in an isolated project just long
enough to confirm it loads, or fork it and rename the skills.

## Privacy

**This repo ships methodology only.** Your real profile, résumés, digests, and application archive are
generated locally and are git-ignored — they never enter the repository. When adapting or forking, keep it
that way: share the machine, never the career data.

## Adapting to your field

Everything domain-specific lives in your generated `profile.md` and in `references/sources.md` (the boards and
keywords). The skills, formatting rules, verification gates, and filing system are field-agnostic. See
[`docs/HANDOFF.md`](docs/HANDOFF.md) for the full architecture and a step-by-step adaptation guide.

## License

MIT — see [LICENSE](LICENSE).
