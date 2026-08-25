# Running JobScan on a weekly schedule

The scan works fine on demand ("run my weekly job search"). To automate it, register a recurring task with
whatever scheduler your Claude surface offers. The plugin can't install a scheduler for you — this is the
scaffold to set one up.

## First, check what this surface actually offers

**Scheduling is the one part of JobScan that depends on where Claude is running, and the honest answer is
sometimes "not here".** A desktop app, a web session, a terminal and an IDE extension do not all offer the
same thing, and the options below are possibilities, not guarantees.

So look for a scheduling capability in *this* session — a scheduled-tasks or routines feature, a
`schedule`-style skill, a cron tool — **before** telling the user a weekly run is set up. If there is none,
say so in one plain sentence and give them the two real alternatives: their operating system's own
scheduler, which is genuinely technical and worth naming as such, or asking for the scan themselves once a
week, which costs one sentence and works everywhere.

**Never report a schedule as registered when what actually happened was a fallback**, and never quietly
write a cron entry for someone who was promised they would never see a terminal. A schedule the user
believes in and does not have is worse than no schedule: they stop asking for the scan.

## What to schedule

- **Prompt to run:** `Run my weekly job search`
- **Cadence:** weekly is the intended rhythm (e.g. Monday 07:00 local). Job boards refresh continuously, so a
  weekly cadence catches most new postings without noise. Don't schedule daily — it mostly re-scans the same
  listings and burns tokens.
- **What it does unattended:** scan → verify live → score → rank → write the dated digest. It **stops at the
  digest** and never drafts or submits without you.

## Where an unattended run leaves its result

A scan the user is present for ends by listing the top matches with apply links in the chat. **A scheduled
run is by definition one where they are not there**, and a chat message nobody is in the room for is not a
delivery. The durable output is the file, which every scan writes either way:

```
<archive>/Job Search Digests/<YYYY-MM-DD> digest.md
```

So when a schedule is registered, say two things in the same breath, and say them again in whatever message
confirms it:

1. **Where Monday's result will be** — by folder name, the way they'd see it in Finder or File Explorer
   ("your Job Search Digests folder, one file per scan, dated"), never as a path.
2. **The sentence that gets it back:** *"show me last week's digest"*. Without that sentence, a week with no
   matches and a week where the scan never ran look identical from the chat, and a schedule nobody can
   verify is a schedule nobody trusts.

If this surface can deliver a notification the user will genuinely see — a push, an email, a message waiting
in their next session — use it, and keep it to the match count, the top few, and where the file is. **The
digest is the deliverable; a notification is only a pointer to it.**

## Options by surface

- **A scheduled-tasks or routines feature, where the surface has one:** ask Claude to "schedule my weekly job
  search every Monday at 7am" — it registers a recurring task that runs this prompt. Confirm the feature
  exists in this session first; several surfaces have nothing of the kind.
- **OS cron / Task Scheduler:** run your Claude CLI headless with the prompt on a weekly trigger. This is
  terminal work, and the user should hear that before it starts, not partway through.
- **Firecrawl monitors (between scans):** point `firecrawl_monitor_create` at a few high-yield saved
  searches / careers pages to surface *new* postings mid-week as deltas — a complement to, not a replacement
  for, the full weekly scan. Monitors need a Firecrawl API key; they are unavailable on the keyless server.
- **No scheduler available:** a recurring calendar reminder that says "run my weekly job search". Unglamorous
  and completely reliable, and the right answer more often than it sounds.

## Preconditions for an unattended run

- The machine is on and Claude can run at the scheduled time.
- **Firecrawl** (or a browser tool) is reachable — dynamic government portals can't be verified without JS
  rendering. If neither is available that run, listings on those portals come back `UNVERIFIED`; the digest
  says so in its Process note.
- The config at `~/.claude/jobscan-data/jobscan-config.md` exists (run `jobscan-onboarding` first).
- The archive folder is writable. An unattended run that cannot write its digest has produced nothing at all,
  and there is nobody there to see it fail — `jobscan-doctor` checks this before every scan.

## Sample task definition

See `templates/weekly-scan-task.template.md` for a ready-to-register task prompt + metadata you can hand to
your scheduler.
