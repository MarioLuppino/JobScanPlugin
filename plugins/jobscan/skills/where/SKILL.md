---
name: where
description: >-
  Shows where JobScan keeps the user's files, and moves them somewhere else safely. Use when the user asks
  where their profile, résumés, digests or applications are stored, wants to move their job-search folder,
  moved it themselves and broke the scan, or says "where does jobscan keep my files".
---

# Where JobScan keeps things

Two locations, chosen at onboarding and changeable at any time:

- **Data path** — `profile.md`, `profile-core.md`, `base-resumes/`, `cover-letter-voice.md`, `sources.md`,
  and `ats/` (the scanner's employer registry, job-title config and caches).
- **Archive path** — numbered application folders, `Job Search Digests/`, `Applied Index.md`,
  `Considered - Not Pursued.md`, and `Work Search Log.md` if they have one.

One file is fixed and never moves: **`~/.claude/jobscan-data/jobscan-config.md`**. It holds both paths, and
every skill and script reads it first. That fixed location is what makes everything else movable.

## Showing where things are

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/paths.mjs"
```

Prints every resolved path: the plugin's scripts, the config file, the data folder, the ATS config, the
archive and the applied index. Translate it for the user — folder names in the words they'd see in Finder or
File Explorer, not `~` and not absolute paths, unless they ask.

If `${CLAUDE_PLUGIN_ROOT}` is empty, derive the plugin root from where this `SKILL.md` sits (two levels above
`skills/where/`).

## Moving them

Do it in this order, and do all of it — a half-move leaves a scan reading one folder and writing another.

1. **Ask which one they mean.** "Everything" usually means both; someone moving to a new laptop means both,
   someone tidying Documents often means just the archive.
2. **Move the files first**, preserving the folder structure. Never copy-and-leave: two copies of a profile
   diverge, and the wrong one gets read. If they've already moved the folder themselves, skip to step 3.
3. **Update `jobscan-config.md`** — `data_path`, `archive_path`, or both.
4. **Verify** with `paths.mjs` again, and then
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs"`, which confirms the new locations are writable and that
   `Applied Index.md` is found. An index that reads as empty after a move is a path problem, never a finding
   about the user's record-keeping.
5. **Say what moved, in one line**, and that nothing else needs doing.

**Windows:** prefer a location near the drive root. Deep folder trees plus long application file names hit
the 260-character path limit, and it fails at packet-writing time — long after the move looks fine.

**Never move anything into the plugin folder.** `/plugin update` replaces it wholesale, and everything there
is destroyed. If a check reports personal files still sitting beside the scripts, that is a pre-0.3.0 install:
move them to `<data_path>/ats/` and tell the user in one sentence why.

## Environment overrides

`$JOBSCAN_DATA`, `$JOBSCAN_ARCHIVE` and `$JOBSCAN_INDEX` win over the config file. They exist for running the
scripts against a second setup without editing anything. If a path resolves somewhere the user doesn't expect
and the config looks right, check whether one of these is set — that is the usual cause.
