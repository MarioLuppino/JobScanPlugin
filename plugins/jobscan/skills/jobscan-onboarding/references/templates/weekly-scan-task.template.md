# Weekly scan — scheduled task definition

Register this with whatever scheduler this surface actually offers (a scheduled-tasks / routines feature, or
OS cron). **Check that one exists before promising a schedule** — see the `job-search` skill's
`references/scheduling.md`. Adjust the day and time to the user's preference.

```yaml
name: jobscan-weekly
schedule: "0 7 * * 1"          # cron: Mondays 07:00 local (adjust as desired)
prompt: "Run my weekly job search"
notify: true                   # only if this surface delivers something the user will actually see
```

## Notes
- The prompt triggers the `job-search` skill, which resolves paths from
  `~/.claude/jobscan-data/jobscan-config.md`, runs scan → verify → score → rank, writes the dated digest, and
  **stops** (no drafting/submitting without you).
- **The digest file is the deliverable, not the notification.** Every run writes
  `<archive>/Job Search Digests/<YYYY-MM-DD> digest.md`, and that file is the only output that survives a run
  nobody was present for. `notify` is a pointer to it and may reach nobody at all, depending on the surface.
- **Tell the user two things when you register this:** which folder the weekly file lands in, in the words
  they'd see in Finder or File Explorer, and that *"show me last week's digest"* brings it back. Otherwise a
  quiet week and a scan that never ran are indistinguishable.
- Requires: machine on at run time; Firecrawl or a browser tool reachable for dynamic portals; a writable
  archive folder; onboarding completed.
- To add mid-week delta alerts, set up `firecrawl_monitor_create` on a few saved searches separately
  (needs a Firecrawl API key — not available on the keyless server).
