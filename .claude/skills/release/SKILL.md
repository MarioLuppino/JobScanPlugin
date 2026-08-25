---
name: release
description: Ship a JobScan version or open its pull request — version bump, the gates that stand in for CI, the CHANGELOG entry, the PR, and release notes in this repo's house style. Use when asked to ship, cut, tag, release or publish a version, to open a PR for a branch, or to write release notes.
argument-hint: "[version, e.g. 0.5.0]"
---

Everything from "is there anything to ship?" to "the release page is live". A session can do all of it
except two steps: **creating the tag and publishing the release page are browser work.** Step 6 says why.

If the ask is only "open a PR", run Steps 0 to 5 and stop. Step 1 still applies: a plugin change that
reaches nobody has not shipped.

## Step 0 — Establish there is something to ship

A version number is a promise that something changed for the person who installed the plugin. Being handed
one does not skip this step: "cut a 0.4.1" is a request to find out whether a 0.4.1 exists, not permission
to invent one.

- **A patch is triggered by a defect, so find and reproduce it before anything else.** Name the wrong
  behaviour, run it, keep the output. A patch whose defect was never reproduced is a guess, and the release
  notes cannot honestly describe what it fixes.
- **A minor is triggered by work already done.** Read what has landed since the last tag:
  `git log --oneline $(git describe --tags --abbrev=0)..origin/main`.
- **Changes under `.claude/` are never a release.** The marketplace installs `./plugins/jobscan` and nothing
  else, so maintainer tooling reaches no user. If nothing under `plugins/` changed, there is no version to
  cut.

Where the defects have actually been: the newest code, and anywhere two callers resolve the same thing by
different routes. 0.4.1 was `doctor.mjs` reading the personal config files straight from `<data_path>/ats`
while every scanner script resolved them through `paths.mjs` — so a working install was reported broken by
the one tool whose job is reporting the truth. **Comparing what a script says against what the scan does is
the highest-yield check in this repository.**

**If nothing turns up, say so and stop.** An empty version bump costs every install a re-download and adds a
`CHANGELOG.md` section that says nothing. "There is no 0.4.1 here" is a complete answer.

## Step 1 — Set the version

`plugins/jobscan/.claude-plugin/plugin.json` holds the **only** version string in this repository.
`.claude-plugin/marketplace.json` deliberately carries none, so the two cannot drift. Do not add one there.

Bump it on every release. Claude Code pins an installed plugin to that string, so **commits alone reach
nobody**: a merge to `main` without a bump leaves every existing install on its cached copy no matter how
much changed. This has been the single most consequential step in every release so far.

- **Patch** (0.4.0 → 0.4.1) — a fix inside existing behaviour. No new skill, script or file.
- **Minor** (0.4.0 → 0.5.0) — a new skill or script, a new user-visible capability, or changed behaviour in
  an existing skill. Every release so far has been minor.
- **Major** — reserved for breaking a file a user already has on disk. Nothing has needed one. If you think
  something does, say so and let the user decide rather than bumping quietly.

Adding or removing a skill also means editing the `skills` array in the same file.

## Step 2 — Run the gates

There is no CI in this repository: `.github/workflows` does not exist, and the checks are manual by design.
They are not optional, and they are one command:

```
bash .claude/skills/release/scripts/preflight.sh
```

It runs, and reports one line each: both plugin validators, the 44-question invariant from `CLAUDE.md`, the
triage unit tests, a load check on `paths.mjs` and `doctor.mjs`, and a consistency check that the version in
`plugin.json` has a matching section in `CHANGELOG.md`. It exits non-zero if any gate fails.

Fix what it reports. Do not push past a red gate, and do not describe a gate as passing without having run
it — the release notes for every version so far state the verification, and that statement has to be true.

## Step 3 — Write the CHANGELOG entry

`CHANGELOG.md` is the in-repo record and the one place per-change detail belongs. Keep a Changelog format,
newest first, directly under the intro paragraph:

```
## [0.5.0] - YYYY-MM-DD

One or two sentences framing what this release is for.

### Added
### Changed
### Fixed
```

Drop any of the three that would be empty. Take the date from the environment context rather than guessing
it. Each bullet leads with the user-visible thing in bold, then the defect it closes — not the file that
changed. `git log` already records files.

**Only plugin changes go in it.** `CHANGELOG.md` is read by people who installed a job scanner and want to
know what is new in it, so a change under `.claude/` never appears there — nor on a release page. The commit
message and the PR body are the record for maintainer tooling. The same goes for the vocabulary: handoffs,
containers, scratchpads and this proxy's HTTP 403 are session mechanics, invisible to a user, and belong in
neither file. 0.3.0 shipped a changelog entry about handoff-document layout and dark-mode tokens; it had to
be taken back out.

The preflight script fails if `plugin.json` says 0.5.0 and no `## [0.5.0]` heading exists, which catches the
half-done bump in both directions.

## Step 4 — Commit and push

One commit for the release is normal in this repository; several is fine if they are genuinely separate
changes. Subjects are imperative sentences describing the effect, no conventional-commit prefixes:

```
Make every silent failure visible, and let setup be changed
Keep code in the plugin and user data out of it
```

Push to the session's designated branch with `git push -u origin <branch>`. Branch pushes work; see Step 6
for what does not.

## Step 5 — Open the pull request

Only when the user has asked for one. Use `mcp__github__create_pull_request` against
`MarioLuppino/JobScanPlugin`, base `main`.

**Title the PR for what it contains, not for its branch.** Session branch names are auto-generated and are
routinely left over from an earlier task: 0.4.0 shipped from a branch called
`claude/v0-3-0-release-notes-r3cwb0`. Reuse the release commit's subject and the title will be right.

There is no PR template in this repository. The body that has worked: one line saying what the PR closes,
then one bullet per change naming the thing and the defect it fixes, then `Version 0.5.0.` on its own last
line. [PR #10](https://github.com/MarioLuppino/JobScanPlugin/pull/10) is the reference.

End the body, and every other comment posted to GitHub, with the attribution footer:

```
---
_Generated by [Claude Code](https://claude.ai/code)_
```

## Step 6 — The two browser steps

After the merge, two things remain and **neither can be done from a session**:

1. **The tag.** The session git proxy allows branch pushes and refuses tag pushes and ref deletions with
   HTTP 403. That is policy, not a network fault, so retrying with backoff is wasted effort. It is already
   recorded in `CLAUDE.md`.
2. **The release page.** The GitHub MCP server in these sessions exposes read tools only — `list_releases`,
   `get_release_by_tag`, `list_tags`, `get_tag`. There is no create-release and no create-tag tool. Check
   before assuming this is still true; if one appears, this step stops being manual.

Hand over three things, wherever they end up delivered:

- the exact tag name (`v0.5.0`) and **the commit it points at — the merge commit on `main`, not the branch
  head**;
- the release notes file, written per `references/release-notes.md` in this skill directory. **It has two
  parts and a cut line**: the public body above it, the maintainer's supporting information below it. Write
  it to the scratchpad and send it with `SendUserFile` so pasting is a file operation, not a copy out of
  terminal scrollback;
- the URL that opens the form pre-filled:
  `https://github.com/MarioLuppino/JobScanPlugin/releases/new?tag=v0.5.0`

Only the part above the cut line is ever pasted into the form. The supporting block — SHAs, PRs, diffstat,
gate output, what was deliberately kept off the page — exists so the release is reconstructable later, and
it lives in the file and nowhere public.

**Where those three go depends on whether the user is still here, and the two cases are exclusive.** Never
do both: `CLAUDE.md` forbids the same content living in two places, and the release body is long.

- **They are acting on it now.** All three in one chat message, the body in a fenced block so it pastes as
  raw Markdown.
- **The session is ending with the steps outstanding.** They are remaining work, which `CLAUDE.md` sends to
  a handoff document rather than the chat — and the release body in particular has no home on disk and dies
  with the container. All three go in the handoff; the chat gets its link and one line of context, nothing
  else. Ask the user to run `/handoff`, which carries `disable-model-invocation` and so cannot be invoked on
  their behalf.

When it is unclear which case applies, it is the second. A merge you are waiting on is not the user acting
now.

## Step 7 — Confirm it actually landed

Do this at the start of any session that picks a release back up, before writing anything. A previous
session cannot see what the user did in the browser afterwards, and asking is slower than looking:

```
git fetch origin --prune --tags
git ls-remote --tags origin          # is the tag there?
git log --oneline -1 origin/main     # does the tag's SHA match this?
```

Then `mcp__github__list_releases` for the published pages, and `mcp__github__list_pull_requests` with
`state: all` for the PRs. Two things read wrong at a glance and are worth knowing:

- A merged PR shows as **closed**. GitHub's `is:closed` filter includes merged PRs, so a list of closed PRs
  with nothing open is the normal, healthy state, not evidence of something rejected. Check `merged_at`.
- The MCP server HTML-escapes release bodies in its response and strips anything shaped like a tag, so
  `` `<data_path>/ats/` `` comes back as `` `/ats/` ``. The published page is fine. Confirm with `WebFetch`
  on the release URL before "correcting" it.

Nothing needs resubmitting downstream. Anthropic's community catalog pins an approved plugin to a commit SHA
and CI bumps that pin as commits land, syncing nightly, so a merge to `main` reaches it on its own. See
`docs/ARCHITECTURE.md` section 9.
