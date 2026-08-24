# Weekly scan — scheduled task definition

Register this with your scheduler (the Claude `schedule` skill, a scheduled agent/routine, or OS cron). Adjust
the day/time to your preference.

```yaml
name: jobscan-weekly
schedule: "0 7 * * 1"          # cron: Mondays 07:00 local (adjust as desired)
prompt: "Run my weekly job search"
notify: true                   # deliver the top matches + apply links + digest location on completion
```

## Notes
- The prompt triggers the `job-search` skill, which resolves paths from
  `~/.claude/jobscan-data/jobscan-config.md`, runs scan → verify → score → rank, writes the dated digest, and
  **stops** (no drafting/submitting without you).
- Requires: machine on at run time; Firecrawl or a browser tool reachable for dynamic portals; onboarding
  completed.
- To add mid-week delta alerts, set up `firecrawl_monitor_create` on a few saved searches separately
  (needs a Firecrawl API key — not available on the keyless server).
