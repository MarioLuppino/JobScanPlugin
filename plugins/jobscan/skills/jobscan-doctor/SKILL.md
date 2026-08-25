---
name: jobscan-doctor
description: >-
  Checks that everything JobScan's weekly scan depends on is actually working — config paths, the employer
  registry, Node, Firecrawl, the docx skill, the archive — and reports each in plain words with the one fix
  for it. Runs automatically as step zero of every job-search run. Use when the user says "check my job
  scanner", "why did my scan find nothing", "is jobscan set up right", "jobscan isn't working", or when a
  scan returned far less than expected.
---

# JobScan Doctor

Every problem this skill looks for used to be invisible. A config at the wrong path, an employer list that
was never filled, a Firecrawl connection recorded as working that no session ever loaded — each of these
produces **a scan that looks like it worked** and quietly returns a fraction of what it should have.

So the rule is: degrading is fine, degrading in silence is not. This skill turns every silent degradation
into one visible line.

## Run it

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs"
```

If `${CLAUDE_PLUGIN_ROOT}` is empty in your shell, derive the absolute path from where this `SKILL.md` sits —
the plugin root is two levels above `skills/jobscan-doctor/`. A bare `node scripts/doctor.mjs` will not work
from an installed plugin.

That covers everything checkable from disk: Node's version, the scripts themselves, the config file and its
two paths, the data folder, `profile-core.md`, the job-title patterns, the employer registry, the feed list,
the seen-URL cache, the archive folder and its writability, `Applied Index.md`, and any personal file
stranded inside the plugin folder by a pre-0.3.0 install.

## Then check the four things a script cannot

The script can see files. It cannot see what is loaded in *this* session. Check these yourself, and report
them in the same list.

1. **Firecrawl — call it, don't look for it.** A `firecrawl: connected` line in the config records what
   onboarding *did*, not what this session *has*. MCP servers load at session start, so a server connected
   during onboarding is not available until Claude Code restarts. Make one real, cheap call —
   `firecrawl_scrape` against any stable public page — and report what happened:
   - answers → `ok`
   - tools not present but the config says connected → **restart Claude Code**, that is the whole fix
   - not configured at all → offer the keyless server (`jobscan-onboarding` Step 7 has the one command),
     and say which of the user's own target employers this actually affects (see below)
2. **The `docx` skill.** Availability varies by surface and version; it is not safe to assume. Check whether
   it is loaded. If it isn't, say so plainly — packets still get produced through the paste-into-Word path in
   `job-applications/references/docx-generation.md`, but the user does the formatting, and they should hear
   that before a packet is due, not during one.
3. **Browser tools.** The fallback for JS-heavy portals when Firecrawl is absent. If neither exists, dynamic
   portals cannot be verified at all, and Gate 2 will refuse to draft for them.
4. **`${CLAUDE_PLUGIN_ROOT}`.** If the variable is empty, say which absolute path you used instead, so a
   later failure isn't mistaken for a missing pipeline.

### Firecrawl matters more for some fields than others

Read the user's employers (`<data_path>/ats/employers.json`) and their `<data_path>/sources.md` before
judging how bad a missing Firecrawl is. It is not a uniform "nice to have":

- **Government and large-enterprise portals** — NEOGOV/governmentjobs, Workday, USAJOBS, CalCareers,
  Paylocity — cannot be read by a plain fetch. With no Firecrawl and no browser tools, those postings stay
  `UNVERIFIED`, and `job-search`'s Gate 2 is a hard stop: **no packet is ever drafted for them.** For someone
  whose target list is mostly public-sector, declining Firecrawl doesn't degrade the scan, it ends it at the
  digest. Say that in those words.
- **Greenhouse, Lever, SmartRecruiters, Ashby, Workable boards** — plain fetch reads these fine. Declining
  Firecrawl really is fine here.

## Report it like a person, not a linter

Group into what works, what is broken, and what is merely thin. Lead with the problem that costs the most.
Give **one** fix per problem, in the words the user would use to ask for it ("say *add employers to my job
scan*"), never a file path they have to open or a command they have to type. Offer to do each fix now.

If everything passes, say so in one line and stop. A clean check should not produce a report.

## As step zero of a scan

`job-search` runs this before spending anything. There, the output is not for display — fold it into the
scan:

- **Fatal** (no config, no profile) → stop and offer to run `jobscan-onboarding`. Don't scan blind.
- **Degrading** (no employer registry, Node missing, Firecrawl absent, feeds never probed) → continue on the
  fallback path, and **record one line in the digest's Process note** saying what was unavailable and what
  that cost. Never let a downgrade pass unmentioned; that is the failure mode this whole skill exists to
  end.
- **Thin** (few employers, empty seen-cache, no recorded outcomes) → don't interrupt the scan. Mention it
  once at the end, with the fix.
