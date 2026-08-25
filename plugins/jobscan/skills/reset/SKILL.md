---
name: reset
description: >-
  Starts a JobScan setup over, clears what the scanner remembers, or removes JobScan and the files it
  created. Use when the user wants to redo the setup interview because something early was wrong (a misread
  CV, the wrong field, a location they regret), wants jobs they already passed on to be shown again, wants to
  delete their JobScan data, or asks how to uninstall the plugin — "start my jobscan setup over", "redo my
  jobscan interview", "delete my jobscan data", "how do I remove jobscan". For changing one setting, use the
  profile or employers skill instead; for moving files somewhere else, use the where skill.
---

# Starting over, and leaving

Every other lever in JobScan got a skill: `profile` changes a setting, `employers` changes the targets,
`where` moves the files. **Nothing removed anything.** Someone whose setup went wrong in the first ten
minutes — a CV read wrong, the wrong target field, a location they regret naming — had no sentence to say,
because re-running onboarding *resumes*, which is right for an interrupted interview and exactly wrong for a
setup built on a bad answer.

This is that sentence. It is also the only place that says out loud how to leave, and what stays behind when
you do.

## Rules that hold on every route

1. **Show before you touch.** Never delete or move anything until the user has seen what exists, counted in
   plain words — "a profile, three base résumés, 14 digests, 9 application folders" — and said yes to that
   list. They cannot consent to a list they have not seen.
2. **Move it aside; don't delete it.** Rename to `<name> (replaced YYYY-MM-DD).<ext>` in the same folder
   rather than removing. A regretted reset is common and unrecoverable; a stale copy costs nothing and is
   easy to clean up later. Delete outright only when the user has explicitly asked for deletion.
3. **The archive is not yours to clear.** Application folders, digests, `Applied Index.md` and especially
   `Work Search Log.md` are the user's record of what they *did*, not JobScan's working files. A work-search
   log is often required evidence for unemployment benefits. Keep the archive by default on every route, and
   ask about it as a separate question with its own yes.
4. **Never touch anything outside the two configured paths.** Resolve `data_path` and `archive_path` from
   `~/.claude/jobscan-data/jobscan-config.md` first. If the config is missing or its paths look wrong, ask —
   never guess a folder and never widen the blast radius to a parent directory.
5. **The config goes last.** It is what resolves the other two paths, so removing it first leaves you unable
   to find the thing you were asked to remove.
6. **Nothing here touches the plugin folder.** No personal file lives there, and uninstalling is a separate
   act with its own command (below).

## Which of these do they actually mean?

"Start over" covers four different requests. Ask if it is not obvious from what they said:

| What they said | What they want | Where it goes |
|---|---|---|
| "My salary floor is wrong", "stop showing me sales roles" | one setting changed | **`profile` skill** — not here |
| "Add/remove an employer", "it's matching the wrong job titles" | the target list changed | **`employers` skill** — not here |
| "My files are in the wrong place" | files moved | **`where` skill** — not here |
| "You misread my CV", "I picked the wrong field", "redo the interview" | rebuild the profile, keep the archive | **Route A** |
| "It keeps showing me the same jobs", "I passed on that by mistake" | clear what the scanner remembers | **Route B** |
| "Delete my data", "how do I uninstall this", "I got the job" | remove data, plugin, or both | **Route C** |

**If they have described one wrong answer, say so and hand it to `profile`.** Running 44 questions again to
change a salary floor is exactly what those three skills exist to prevent. Offer Route A only if the thing
that is wrong is genuinely foundational — the CV, the career direction, the whole shape of the profile.

## Route A — redo the setup, keep everything they've done

The mechanism is small: **onboarding resumes because `setup-state.md` and a partial `profile.md` exist.**
Move those aside and it starts a real interview instead of continuing an old one.

1. **Show what exists.** Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs"` and read the data folder. Say
   what will be rebuilt and what will be untouched:
   - **Rebuilt:** the profile, its digest, the base résumés, the cover-letter voice file.
   - **Kept, always:** every application folder, every digest, `Applied Index.md`,
     `Considered - Not Pursued.md`, `Work Search Log.md`, and the employer registry with its job titles —
     those took real work and a misread CV is no reason to lose them.
2. **Ask about the employer list separately.** Keeping it is right when the CV was misread; rebuilding it is
   right when the *field* was wrong, because the employers and job-title patterns follow the field. Say which
   you think applies and let them decide.
3. **Move aside, in the data folder:** `profile.md`, `profile-core.md`, `setup-state.md`, `sources.md`, and
   `base-resumes/` and `cover-letter-voice.md` if the résumés are being rebuilt. Renamed, not deleted —
   rule 2. The old profile is also the fastest source of answers to the questions that were *right*.
4. **Ask whether the CV is still the right one**, and get the new one first if it isn't. That is the input
   the whole interview is built on, and re-running with the same wrong file rebuilds the same wrong profile.
5. **Hand over to `jobscan-onboarding`**, telling it plainly that this is a deliberate restart, not a
   resume, and that a previous profile exists to draw correct answers from.
6. **Offer to clear the `(replaced …)` copies** once the new profile is confirmed — later, not now.

## Route B — clear what the scanner remembers

Two files hold the memory, and they do different jobs:

- **`<data_path>/ats/seen-urls.json`** — every posting already screened out. Clearing it makes the next scan
  as expensive as a first scan and re-surfaces everything.
- **`<archive>/Considered - Not Pursued.md`** — roles seen and deliberately passed on. Clearing it lets those
  roles come back.

**Usually they want one row removed, not the file emptied.** "I said no to that one too fast" is a
single-line edit to `Considered - Not Pursued.md`. Offer that first; it is almost always the real request.

**Say the cost before doing the whole file.** A cleared seen-URL cache means the next scan re-reads and
re-scores thousands of postings they have already paid to screen once. That is a real charge on their plan,
and it should be their decision made with the number in front of them, not a surprise on Monday.

**Never clear `Applied Index.md` on this route.** It is the dedup record of applications actually submitted;
emptying it makes the scan cheerfully re-suggest jobs they have already applied for. If they want a *record*
corrected, edit the row.

## Route C — remove it

Three separate things, and most people asking mean only the first. Name all three and let them pick.

**1. The plugin — the code.** Sent as a plain request ("uninstall the jobscan plugin") or typed:

```
/plugin uninstall jobscan@jobscan
```

To also stop JobScan's marketplace from being checked for updates, `/plugin marketplace remove jobscan`.
**Uninstalling removes the plugin folder and nothing else.** Every file JobScan created lives outside it, by
design — that is the same rule that keeps a `/plugin update` from destroying an employer registry — so an
uninstall leaves the profile, résumés, archive and config exactly where they are. Say that explicitly:
someone who uninstalls expecting their data to go with it has been told wrong.

**2. Their JobScan data** — the profile, its digest, the base résumés, the voice file, their `sources.md`,
the scanner's registry and caches in `ats/`, and finally the config file at
`~/.claude/jobscan-data/jobscan-config.md`. This skill removes these, on an explicit yes, in that order —
config last, per rule 5.

**3. Their archive** — application folders, `Job Search Digests/`, `Applied Index.md`,
`Considered - Not Pursued.md`, `Work Search Log.md`. **Ask separately and default to keeping it.** This is a
record of months of work: what they applied for, when, and what came of it. If they are leaving because they
got the job, keeping it is almost always right, and a work-search log may be something they are still
required to produce. Never fold this into a yes given for the data folder.

Before deleting anything on this route, list it with counts and get one clear confirmation. Offer to move the
whole lot to a single dated folder instead — the same instinct as rule 2, one level up.

## Finish

One or two sentences: what was rebuilt, moved, or removed; where anything kept now lives; and the single next
step ("say *run jobscan onboarding*" / "your archive is untouched in your Documents folder"). Then run
`node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs"` and confirm the state you just created is the state you
intended — a half-finished reset reads to every later scan as a broken install.

If `${CLAUDE_PLUGIN_ROOT}` is empty in your shell, derive the plugin root from where this `SKILL.md` sits
(two levels above `skills/reset/`).
