# JobScan

A reusable, **field-agnostic** weekly job-scan + tailored-application system for [Claude
Code](https://claude.com/claude-code), packaged as a plugin. It finds live job postings you're a strong fit
for, scores and ranks them into a digest, and — on your selection — drafts ATS-safe tailored résumés and
cover letters. It **prepares packets; it never submits applications.**

Built for research-to-industry transitions and designed to adapt to any field — plant pathology, data
science, ecology, whatever your profile is. A guided onboarding skill reads your CV, interviews you about
what it can't know, and builds your candidate profile, so you don't start from a blank file. **You never have
to write, read, or understand a line of code** — if something needs installing, Claude installs it, though it
will ask your permission first and [those prompts look technical](#about-those-permission-prompts).

## What's in this plugin

Two cooperating skills plus onboarding:

- **`job-search`** — the *finder*. Searches boards, de-dups, verifies each posting is live, scores fit, ranks
  a top ~10, writes a dated digest, and stops.
- **`job-applications`** — the *drafter*. Maps an employer's competencies to your evidence and produces a
  tailored résumé + cover letter (`.docx`) and interview prep.
- **`jobscan-onboarding`** — a one-time setup that starts from your CV, asks only what the CV can't answer,
  and generates your personal `profile.md`, its compressed `profile-core.md` digest, per-tier base résumés, a
  voice file, and an empty applied-index. You can read [every question it asks](docs/INTERVIEW-QUESTIONS.md)
  before installing anything. It can be **stopped and resumed** — answers are saved as you give them.

Plus five small skills for afterwards, so nothing is set in stone:

- **"check my job scanner"** — reports every part of the setup that isn't working, in plain words, with the
  one fix for each. It also runs automatically before every scan, so a broken piece is named rather than
  silently skipped.
- **"change my salary floor"** (or your locations, avoid-list, fit floor, writing voice) — changes one
  setting without re-running the interview.
- **"add employers to my job scan"** — adds or drops the organizations it watches and updates the job titles
  it matches. This is the one you'll use most: a target list grows all year.
- **"where does jobscan keep my files"** — shows where everything is, and moves it if you want it elsewhere.
- **"start my jobscan setup over"** — rebuilds the profile from a fresh interview when something foundational
  was wrong, keeping every application you've already filed. It also covers removing JobScan entirely, and
  says what stays behind when you do.

It is built around **token-efficiency** (a compressed profile digest, per-tier résumé scaffolds you *edit*
rather than regenerate, a single de-dup index instead of rescanning folders) and **verification discipline**
(no listing is drafted against unless its posting is confirmed live at draft time).

## Install

**You don't need to know how to code.** Everything below is typed into Claude Code's chat box — the same
place you'd type a question — not into a terminal, and not into a file.

**0. Get Claude Code.** Skip this if you already use it. If you don't, install the **desktop app** — it's an
ordinary application:

- [Download for macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect) ·
  [Download for Windows](https://claude.ai/api/desktop/win32/x64/setup/latest/redirect) ·
  [all download options](https://code.claude.com/docs/en/desktop) (Linux, Windows on ARM, or if a link above
  doesn't work)
- Install it, open it, sign in, then click the **Code** tab.
- **Windows only:** the Code tab needs [Git for Windows](https://git-scm.com/downloads/win) installed first.
  Install it, then restart Claude.

**1. Add the plugin.** The simplest way is to ask for it in plain words. In the chat box, copy and paste, then send:

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

**Then switch it on.** Installing a plugin and *loading* it are two different things, and the second one is
easy to miss. Claude Code tells you which happened:

- **"Plugin is now active"** — nothing to do, carry on to step 2.
- **"Run `/reload-plugins` to activate"** — send exactly that, on its own. (If it warns that reloading will
  re-read the conversation, send `/reload-plugins --force`.)
- **Installed from the chat box, no message either way** — send `/reload-plugins`, or just close Claude and
  reopen it. Both work.

**If Claude says it doesn't know what JobScan is**, this is why, and it's the most common hiccup in the whole
setup. It is not a failed install: the plugin is on your disk, this session just started before it arrived.
Reload or restart and ask again.

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

Those files are plain text, not documents you're meant to open and edit: say *"read me my profile"* or
*"change my salary floor"* and Claude handles it. The résumés and cover letters you actually send are
separate, and those are real Word files.

**3. Run your first scan.** Once setup finishes, send:

```
Run my weekly job search
```

### What the first scan is like

**It's the biggest run you'll do.** A full scan pulls thousands of postings from employers' job boards,
throws most of them out on the job title alone, then reads, verifies and scores what survives. Expect it to
take a while and to use a meaningful chunk of whatever plan you're on — later scans are much cheaper, because
everything already seen is skipped.

**Stopping partway is safe.** The digest file is written from the first batch onward, not at the end, so if
you run out of usage or just close the window, you keep what was found up to that point — it's on your disk,
not in the chat. Ask for the scan again later and everything already screened is skipped, so you don't pay
twice for the same postings.

**Expect a short first list.** The scanner is only as good as the employer list behind it, and yours starts
nearly empty. Day one is a handful of employers and a handful of matches. Say *"add employers to my job scan"* 
whenever another one occurs to you — that single list is what makes the difference, and it grows all year.

**Nothing is ever submitted for you.** The scan stops at a digest; drafting happens when you pick a job, and
you send the application yourself.

### About those permission prompts

Setup installs a few small things for you — a PDF reader, Node.js for the fast scanner, a connection to
Firecrawl. In Claude Code's default mode, **you'll be asked to approve each command before it runs**, and the
prompt shows the raw command line. It looks technical because it is, and one of them may ask for your
computer's password.

That's the system working, not something going wrong. What you'll see is roughly:

- `claude plugin marketplace add …` / `claude plugin install …` — installing JobScan itself, in step 1
- `winget install …` / `brew install …` / `sudo apt install …` — installing a free tool
- `claude mcp add … firecrawl …` — connecting the page reader
- `node …` — running the scanner

**The first one arrives before you've seen anything JobScan does**, which makes it the easiest to refuse out
of caution. It is the plain-words request from step 1 being carried out — the same two commands printed
there, run for you instead of typed by you.

**Every one of the rest is optional.** Declining any prompt is a valid answer: setup carries on and tells you
what you'll be missing. If you'd rather not decide in the moment, say *"skip anything that needs
installing"* at the start and Claude won't offer them at all.

### Keeping JobScan up to date

**Plugins do not quietly update themselves.** Claude Code pins an installed plugin to the version in its
manifest, and background auto-update is **off by default for any marketplace that isn't one of Anthropic's
own** — JobScan's is one of those. Install it today and you keep that copy until you ask for a newer one,
however many fixes have shipped in the meantime.

So when you want the latest, send:

```
Update my JobScan plugin
```

Claude refreshes the catalog and pulls the new version. Typed out, that's two commands sent one at a time —
plus `/reload-plugins` if Claude Code asks for it:

```
/plugin marketplace update jobscan
```
```
/plugin update jobscan@jobscan
```

**There is one place to get JobScan, and it's the one step 1 added.** It isn't in Anthropic's community
catalog, so no copy of it updates itself in the background — asking is the only way a new version reaches
you. Worth doing every month or so.

[`CHANGELOG.md`](CHANGELOG.md) says what changed in each version.

**Updating never touches your own files.** Your profile, résumés, archive and the scanner's employer list and
caches all live in the folder you chose during setup, not inside the plugin. A plugin update replaces only
the plugin's own code, so there is nothing to back up first.

### Starting over, or removing it

**If something foundational went wrong early** — Claude misread your CV, you named the wrong field, you
regret a location — say *"start my jobscan setup over"*. It rebuilds the profile from a fresh interview and
**keeps every application you've already filed**, along with your digests and your employer list. You don't
have to live with a bad answer given in the first ten minutes, and you don't have to delete anything by hand
to escape it.

**To remove the plugin**, send *"uninstall the jobscan plugin"*, or type `/plugin uninstall jobscan@jobscan`.
**Your files stay.** Everything JobScan created for you lives in the folder you chose during setup, not
inside the plugin, so uninstalling removes the code and leaves your profile, résumés, digests and application
archive exactly where they are. If you want those gone too, say so — *"delete my jobscan data"* — and Claude
will show you what it's about to remove and ask about your application archive separately, because that one
is a record of what you actually did.

## What you actually need

**Claude Code, and Microsoft Word or Apple Pages.** Nothing else has to be bought or learned. Résumés and
cover letters arrive as `.docx` files you open and edit in whichever office app you already have, and both
export a PDF when a job portal insists on one. No converters, no toolchains, no programming languages.

You never have to open a terminal, edit a configuration file, or type a command. Where setup needs something
installed, Claude runs the command itself and tells you in a sentence what it did — you approve it, and
[you can decline any of them](#about-those-permission-prompts).

**One caveat, and it depends on where you're applying.** The three extras below are genuinely optional for a
search aimed at company job boards. If you're aiming at government agencies, universities or large
enterprises, the first of them — Firecrawl — is not optional in practice, for the reason spelled out under
it. It's free and needs no account, so this costs you a permission prompt rather than money; it's listed here
so nobody discovers it after a fruitless first scan.

Three extras, each of which Claude offers during setup and each of which you can decline:

- **[Firecrawl](https://www.firecrawl.dev/)** — reads JavaScript-heavy job portals (NEOGOV, Workday,
  USAJOBS, CalCareers, Paylocity) that an ordinary page fetch cannot see at all. **Whether you can skip it
  depends entirely on where you're applying**, so be honest with yourself about your own target list:
  - **Applying mostly to government agencies, universities, or big enterprises?** Their postings live on
    exactly those portals. JobScan refuses to draft an application against a posting it can't confirm is
    still open — that rule is what keeps it from inventing jobs — so without Firecrawl (or browser tools)
    those roles reach your digest marked `UNVERIFIED` and **no packet gets written for them.** For a
    public-sector search, this extra is effectively required, not optional.
  - **Applying mostly to companies on Greenhouse, Lever, SmartRecruiters, Ashby or Workable?** Ordinary
    fetching reads those fine, and **declining is genuinely fine.**

  Onboarding checks which of the two you are once it knows your employers, and tells you which case you're
  in. If you want it, say *"set up Firecrawl for my job scan"* and Claude takes one of two routes — neither
  needs a terminal, and neither needs you to add another plugin marketplace:
  - **Free, no sign-up.** Claude connects Firecrawl's hosted server at `https://mcp.firecrawl.dev/v2/mcp`.
    No account and no API key. It's rate-limited per day, and covers reading a page and searching — which is
    what the scan uses it for.
  - **Higher limits.** Firecrawl is a plugin in *Anthropic's own* marketplace, which Claude Code already
    has, so it installs with `/plugin install firecrawl@claude-plugins-official`. Then `/firecrawl:setup`
    asks for a free API key from [firecrawl.dev](https://www.firecrawl.dev/), which raises the daily limits
    and unlocks the rest of its tools.

  Either way, **restart Claude Code once after connecting it.** Tools like this are loaded when a session
  starts, so a scan run in the same session behaves as if Firecrawl were never set up.
- **A faster scanner.** Claude can pull openings straight from employers' own job boards instead of searching
  for them — far cheaper and more complete. It needs Node.js, which Claude installs for you. Decline it and
  the scan uses web search every week instead: slower and more expensive, but it works. (On older Linux
  systems the version in the package manager is too old to run it; Claude checks and installs a current one.)
- **A weekly schedule**, so the scan runs without you having to ask. Worth knowing before you count on it:
  JobScan can't install a scheduler itself, and not every version of Claude offers one. If yours does, Claude
  registers the weekly run for you; if it doesn't, the alternative is your operating system's own scheduler,
  which is genuinely technical. Either way the machine has to be awake at the time, and asking for the scan
  yourself once a week is a perfectly good substitute. **Claude will tell you which of those you're getting**
  rather than reporting a schedule you don't have.

  A scan that runs on Monday morning finishes while you're asleep, so it saves its results to a file instead
  of a chat message you'd never see: one dated digest per scan, in your **Job Search Digests** folder. Say
  *"show me last week's digest"* whenever you want it — that's the whole retrieval.

## Already have skills of your own?

If you already write Claude Code skills — and especially if you have your own `job-search` or
`job-applications` — JobScan is built to sit alongside them rather than replace them: plugin skills are
namespaced, so your commands keep their bare names, and onboarding can build the data layer and stop.

> 🔧 [Using JobScan alongside your own job-search skills](docs/USING-WITH-YOUR-OWN-SKILLS.md) — namespacing,
> automatic triggering, and the four ways to combine the two.

## Privacy

**This project ships the method, never anyone's career data.** Your profile, résumés, digests, and
application archive are created on your own machine and stay there. Nothing you tell Claude during setup is
published here, and the project is configured to refuse to commit those files even if you're working inside a
copy of it. When adapting or forking, keep it that way: share the machine, never the career data.

## Adapting to your field

Everything domain-specific lives in your generated `profile.md` and in `references/sources.md` (the boards and
keywords). The skills, formatting rules, verification gates, and filing system are field-agnostic. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full architecture and a step-by-step adaptation guide.

## License

MIT — see [LICENSE](LICENSE).
