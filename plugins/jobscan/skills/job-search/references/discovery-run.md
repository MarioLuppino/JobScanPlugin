# Discovery run — turning a sweep into permanent free feeds

Read this when the employer registry is thin (under about a dozen), on a user's first scan, or after any
sweep that had to cover a category the registry does not reach. On a scan where the registry is already
doing its job, skip it — nothing here changes a normal run.

## Why the employers, not the postings

A search sweep produces two things and only one of them has ever been kept. The postings expire in weeks.
The **employers behind them** are the durable find: an employer who posts these roles once posts them
again, and a confirmed ATS feed returns every future opening for nothing — including the one nobody thought
to search for.

The registry is what makes a weekly scan nearly free, and on a first run it holds whatever the user could
name at onboarding: a handful of employers, weighted toward the ones famous enough to come to mind. Asked
cold, nobody produces more than that, so the gap is not the user's memory. It is that the expensive sweep
already surfaces exactly the right employers and then throws them away.

## The run

While the sweep runs, collect the employer behind **every** posting that clears title triage — not only the
ones worth applying to, and including ones rejected for salary, location or timing. The employer is still
the right employer; the point is next month's opening, not this one.

Collect **names**, not postings. An employer name is a string already present in a search result, so
harvesting is free: it never justifies opening a page, and a posting opened to learn who posted it has cost
more than the entry is worth. Dedupe the names as you go and stop at about 60 per run — beyond that the
probe step below is doing more work than a first scan can use, and the ones you drop will surface again next
week from a sweep that costs less. Give the harvest to a worker if the sweep is already running in workers:
pulling employer names out of result lines is exactly tier-two work.

Write them one per line as `Employer Name | sector` (blank lines and `#` comments ignored; a third field
takes slugs you already know: `Acme Group | industry | acmejobs`), then:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/harvest-employers.mjs" --sector industry < names.txt
node "${CLAUDE_PLUGIN_ROOT}/scripts/discover-ats.mjs"
node "${CLAUDE_PLUGIN_ROOT}/scripts/discover-workday.mjs"
```

`harvest-employers.mjs` turns each name into candidate board slugs; `discover-ats.mjs` probes them against
five public ATS APIs and keeps the ones answering with real postings; `discover-workday.mjs` covers the
large employers the first probe misses. All three merge rather than replace, so a hand-corrected slug is
never lost and re-running them is safe.

## What to say afterwards

One line, in the chat and in the digest's Process note: employers found, employers confirmed, and that next
week's scan pulls those boards directly for nothing. A registry that grew is invisible otherwise.

A discovery run that confirmed **nobody** is worth saying too. It almost always means the title patterns are
still the shipped demo ones, not that the field has no employers — check `triage-config.json` before
concluding anything about the market.
