# Running JobScan on a weekly schedule

The scan works fine on demand ("run my weekly job search"). To automate it, register a recurring task with
whatever scheduler your Claude surface offers. The plugin can't install a scheduler for you — this is the
scaffold to set one up.

## What to schedule

- **Prompt to run:** `Run my weekly job search`
- **Cadence:** weekly is the intended rhythm (e.g. Monday 07:00 local). Job boards refresh continuously, so a
  weekly cadence catches most new postings without noise. Don't schedule daily — it mostly re-scans the same
  listings and burns tokens.
- **What it does unattended:** scan → verify live → score → rank → write the dated digest → notify with the
  top matches + apply links inline. It **stops at the digest** and never drafts or submits without you.

## Options by surface

- **Claude Code `schedule` skill / scheduled agents (routines):** ask Claude to "schedule my weekly job search
  every Monday at 7am" — it registers a cron-backed routine that runs this prompt.
- **OS cron / Task Scheduler:** run your Claude CLI headless with the prompt on a weekly trigger.
- **Firecrawl monitors (between scans):** point `firecrawl_monitor_create` at a few high-yield saved
  searches / careers pages to surface *new* postings mid-week as deltas — a complement to, not a replacement
  for, the full weekly scan. Monitors need a Firecrawl API key; they are unavailable on the keyless server.

## Preconditions for an unattended run

- The machine is on and Claude can run at the scheduled time.
- **Firecrawl** (or a browser tool) is reachable — dynamic government portals can't be verified without JS
  rendering. If neither is available that run, listings on those portals come back `UNVERIFIED`; the digest
  says so in its Process note.
- The config at `~/.claude/jobscan-data/jobscan-config.md` exists (run `jobscan-onboarding` first).

## Sample task definition

See `templates/weekly-scan-task.template.md` for a ready-to-register task prompt + metadata you can hand to
your scheduler.
