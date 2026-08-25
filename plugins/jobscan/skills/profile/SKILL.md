---
name: profile
description: >-
  Changes a JobScan setting after setup — salary floor, work locations, the avoid-list, fit floor, weekly
  application quota, writing voice, or anything else in the candidate profile — without re-running the whole
  onboarding interview. Use when the user wants to raise or lower their salary floor, stop seeing a kind of
  job, add a location, change how their cover letters sound, or says "update my jobscan profile".
---

# Change a JobScan setting

Onboarding is a one-time interview, but the answers are not permanent. Before this skill existed, the only
documented way to change a salary floor was to run all 44 questions again — so people lived with a setting
that was wrong.

Every lever lives in a file the user was deliberately never shown. **They should never have to see one now
either.** They say what they want changed; you find it, change it, and say what it will do differently.

## Resolve first

Read `~/.claude/jobscan-data/jobscan-config.md` for `data_path` and `archive_path`. No config → the user
hasn't set up yet: offer `jobscan-onboarding` instead. Then read `<data_path>/profile-core.md`, and open the
full `profile.md` only for the section you're actually changing.

## What lives where

| What the user asks to change | Where it is |
|---|---|
| Salary floor, relocation floor, pay-grade floor | `profile.md` constraints → mirrored in `profile-core.md` |
| Work authorization / sponsorship | `profile.md` constraints |
| Locations, remote, political-lean handling | `profile.md` constraints |
| Avoid-list (sectors, employers, role types) | `profile.md` constraints |
| Fit floor, split quota | `jobscan-config.md` overrides + `profile-core.md` |
| Weekly application quota (benefits) | `jobscan-config.md`, and `Work Search Log.md` in the archive |
| Job titles the scanner matches | **not here** — use the `employers` skill |
| Where files live | **not here** — use the `where` skill |
| Writing voice, tone, phrases to avoid | `<data_path>/cover-letter-voice.md` |
| Anything about their history, skills, numbers | `profile.md` → then re-derive `profile-core.md` |

## Rules

**`profile.md` is the source of truth; `profile-core.md` is derived.** Never edit the digest alone — a scan
reads the digest, so a change made only there is silently lost the next time the profile is re-derived, and a
change made only in `profile.md` never reaches a scan. Change the profile, then update the digest's
corresponding line in the same turn. Keep the "Propagation on edit" note at the top of `profile.md`.

**Show the before and after in one line each**, in the user's words, not as a diff. "Salary floor was
$85,000; now $95,000. Next scan will drop anything below that instead of surfacing it."

**Say what it costs.** Raising a floor or adding to the avoid-list makes the weekly digest shorter, and
someone who is not told that reads a thinner list as the scanner getting worse. If the change would likely
empty a digest, say so before making it.

**A gate the user's own outcomes contradict is a bug.** If they ask for a rule that
`node "${CLAUDE_PLUGIN_ROOT}/scripts/calibrate.mjs"` shows has already screened out roles they went on to
want, say so once, then make the change they asked for.

**Never edit a filled profile without showing what you're about to write**, and never regenerate a whole
file to change one line.

## Add, don't reopen

If the change reveals a question onboarding never asked — a new certification, a career change, a second
target field — ask *that* question and fold the answer in. Do not restart the interview.
