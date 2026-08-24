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

**0. Get Claude Code.** Skip this if you already use it. If you don't, install the **desktop app** — it's an
ordinary application, and no terminal is involved at any point:

- [Download for macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect) ·
  [Download for Windows](https://claude.ai/api/desktop/win32/x64/setup/latest/redirect) ·
  [all download options](https://code.claude.com/docs/en/desktop) (Linux, Windows on ARM, or if a link above
  doesn't work)
- Install it, open it, sign in, then click the **Code** tab.
- **Windows only:** the Code tab needs [Git for Windows](https://git-scm.com/downloads/win) installed first.
  Install it, then restart Claude.

**1. Add the plugin.** The simplest way is to ask for it in plain words. In the chat box, send:

```
Add the plugin marketplace at MarioLuppino/JobScanPlugin, then install the jobscan plugin
```

Claude runs both steps for you. If you'd rather type the commands yourself, they are these two, sent one at
a time:

```
/plugin marketplace add MarioLuppino/JobScanPlugin
```
```
/plugin install jobscan@jobscan
```

The desktop app's plugin browser (**+** next to the prompt box → **Plugins** → **Add plugin**) only lists
marketplaces you have already added, so it can't do the first step — but once JobScan's marketplace is
added, the plugin shows up there like any other.

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

**Claude Code, and Microsoft Word or Apple Pages.** That's the whole list. Résumés and cover letters arrive
as `.docx` files you open and edit in whichever office app you already have, and both export a PDF when a job
portal insists on one. No converters, no toolchains, no programming languages.

You never have to open a terminal, edit a configuration file, or run a command. Where setup needs something
installed, Claude installs it and tells you in a sentence what it did.

Three optional extras, each of which Claude offers during setup and each of which you can decline:

- **[Firecrawl](https://www.firecrawl.dev/)** — makes JavaScript-heavy government portals (NEOGOV, Workday,
  USAJOBS, CalCareers) cheaper and more reliable to read. **Declining is genuinely fine:** without it the
  scanner falls back to ordinary web search and still works. If you want it, say *"set up Firecrawl for my
  job scan"* and Claude takes one of two routes — neither needs a terminal, and neither needs you to add
  another plugin marketplace:
  - **Free, no sign-up.** Claude connects Firecrawl's hosted server at `https://mcp.firecrawl.dev/v2/mcp`.
    No account and no API key. It's rate-limited per day, and covers reading a page and searching — which is
    what the scan uses it for.
  - **Higher limits.** Firecrawl is a plugin in *Anthropic's own* marketplace, which Claude Code already
    has, so it installs with `/plugin install firecrawl@claude-plugins-official`. Then `/firecrawl:setup`
    asks for a free API key from [firecrawl.dev](https://www.firecrawl.dev/), which raises the daily limits
    and unlocks the rest of its tools.
- **A faster scanner.** Claude can pull openings straight from employers' own job boards instead of searching
  for them — far cheaper and more complete. It needs Node.js, which Claude installs for you. Decline it and
  the scan uses web search instead.
- **A weekly schedule**, so the scan runs without you having to ask.

## Already have skills named `job-search` / `job-applications`?

Install it anyway — the two sets coexist, and JobScan is more useful *alongside* a routine you've already
tuned than as a replacement for it. This is the likely case if you built your own version first, or if you
built this plugin *from* a personal routine.

**Your commands stay yours.** Claude Code gives plugin skills a `plugin:skill` namespace, so JobScan's arrive
as `/jobscan:job-search`, `/jobscan:job-applications`, and `/jobscan:jobscan-onboarding`. Your personal
`/job-search` and `/job-applications` keep their bare names and keep running your files. Nothing is renamed,
overwritten, or shadowed, and uninstalling the plugin leaves your skills untouched.

**The one real overlap is automatic triggering.** Claude picks a skill by reading the name and description of
every skill available, so a vague *"find me some jobs this week"* now matches two entries. Settle it once:

- **Be specific when you ask.** "Run my weekly job search" for yours; `/jobscan:job-search` for JobScan's.
- **Or sharpen your own description.** Edit the `description` in `~/.claude/skills/job-search/SKILL.md` to
  name what makes it yours — your boards, your field, your archive folder. The more specific description wins
  the ambiguous asks.
- **Or take yours off auto entirely.** Add `disable-model-invocation: true` to your skill's frontmatter and
  drive it only by typing `/job-search`.

Note that the `skillOverrides` setting is not a lever here — it doesn't apply to plugin skills. To silence
JobScan's, disable the plugin from `/plugin`.

Then pick how much of JobScan you actually want:

**Take the data layer, keep your skills.** Onboarding's real output isn't the skills — it's a set of plain
Markdown files any skill can read: your `profile.md`, the ~1-page `profile-core.md` digest, per-tier base
résumés with `⟪TAILOR⟫` slots, a reverse-engineered cover-letter voice file, and an append-only
`Applied Index.md`. Run `/jobscan:jobscan-onboarding` — it looks for skills of your own before it asks
anything, and offers to build those files and stop rather than take over. Pointing your own skills at them is
two lines at the top of your `SKILL.md`, which onboarding offers to add for you:

> Read `~/.claude/jobscan-data/jobscan-config.md` first — it holds `data_path` and `archive_path`.
> Then read `<data_path>/profile-core.md` for the candidate profile.

That fixed config path is the whole integration contract. Your skills gain a compressed profile and a dedup
index; JobScan's own skills sit unused unless you call them by name.

**Or split the workflow between them.** The two halves are independent: `job-applications` needs a posting
plus the profile files, nothing from `job-search`. So you can keep your finder and use
`/jobscan:job-applications` to draft the packet, or scan with `/jobscan:job-search` and hand the digest to
your own drafter.

**Or borrow just the rules.** The parts worth stealing are in the reference files — the ATS and résumé-format
rules, the writing playbook, the digest template, the two-gate live-verification discipline. Ask Claude to
read JobScan's copy and fold what you want into your own skill's references; your skill stays the one that
runs.

**Or keep them completely apart.** Install into a scratch project to trial the plugin without touching a live
routine, or fork it and rename the skills.

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
