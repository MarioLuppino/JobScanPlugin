# Release notes, house style

**This document is the whole specification. Do not fetch a previous release page before writing.** Every
rule the published pages demonstrate is written down below, including the ones that are easy to absorb by
reading and hard to state: how long a body item runs, how the opening turns, how the terse sections play
against the fat ones. Reading a live page costs a network round trip to re-derive what is already here, and
what a session brings back is a summary of the voice rather than the voice.

Published pages, kept for the record and not as required reading:
[v0.7.0](https://github.com/MarioLuppino/JobScanPlugin/releases/tag/v0.7.0),
[v0.4.0](https://github.com/MarioLuppino/JobScanPlugin/releases/tag/v0.4.0),
[v0.3.0](https://github.com/MarioLuppino/JobScanPlugin/releases/tag/v0.3.0),
[v0.2.2](https://github.com/MarioLuppino/JobScanPlugin/releases/tag/v0.2.2).
Read one only to settle a question this document does not answer — and when that happens, the fix is to
write the answer in here so the next session does not have to go looking either.

A release page is prose for the person who installed the plugin. `CHANGELOG.md` is the per-change record for
whoever maintains it. Write the page from the user's side and let the changelog carry the detail — do not
paraphrase it into a second list.

## Shape

```
vX.Y.Z — <what is now true that was not before>

<one or two paragraphs: the defect as it was experienced, then the one line that names the fix>

## What's new          (or "What's fixed", whichever the release mostly is)
**<the thing, in plain words>** <mechanism, then the consequence it removes>
...

## Also fixed          (optional, bulleted, the smaller items)

## Upgrading           (always)

Full changelog: https://github.com/MarioLuppino/JobScanPlugin/blob/main/CHANGELOG.md
```

Extra `##` sections are fine where a release earns one — 0.4.0 used **What's now said out loud** for four
things the documentation had been wrong about, and 0.7.0 used **What was quietly costing you** for three
rules that had been overcharging without ever failing. Do not invent a section to fill space, and drop
`Also fixed` rather than pad it.

Section names that have been used, so a new one is a deliberate choice rather than a coinage: `What's new`,
`What's fixed`, `Also fixed`, `What's now said out loud`, `What was quietly costing you`, `Upgrading`.

## Title

`vX.Y.Z — <clause>`, where the clause is a claim about the user's experience, not a feature name:

- v0.7.0 — The scan stops doing everything one page at a time
- v0.4.0 — Nothing fails quietly, and nothing is set in stone
- v0.3.0 — The pipeline actually runs when you install it
- v0.2.2 — Coexist with your own job-search skills

Two clauses joined by "and" is fine. A noun phrase naming the feature is not: the title says what changes
for the reader, so `v0.8.0 — Archive, diagnosis and federal tiers` fails and
`v0.8.0 — Your scan stops screenshotting, and federal jobs finally show up` passes.

## Opening

Two or three short paragraphs, in this order, and then stop:

1. **The defect as it was experienced**, with the real number in it if there is one. 0.7.0 opens on "over
   55 minutes and roughly a third of a five-hour usage limit to hand back ten listings — one browser tab
   open, one posting a minute, for an hour." Not "improved concurrency". 0.3.0 opens on "the fastest and
   most complete half of JobScan only worked if you had *cloned* this repository." Not "fixed plugin path
   resolution."
2. **A second defect paragraph** only when the release has a genuinely separate second story. Skip it
   otherwise.
3. **One short pivot line on its own**, naming the release and what it does about all of the above:
   "0.7.0 rewrites how a scan spends its time." One sentence, no list, no promises beyond the sections that
   follow.

Numbers in the opening are ratios and durations the reader could reproduce, never totals from one
contributor's run.

## Body items

**A body item is a paragraph, not a bullet.** 60 to 130 words, four to six sentences, and it runs
bold-lead-in → mechanism → the consequence it removes. Items materially shorter than that read as a
feature list; a page of five fat items and one terse section is the shape these pages have always had.

The lead-in is either the sentence a user would actually say, or the plain-language effect — never the
filename:

> **"Add employers to my job scan."** Adds or drops the organizations the scanner watches, re-runs feed discovery, and updates the job titles it matches. This is the one that matters most: a target list grows all year, and that list is what decides whether a scan finds anything.

> **Your scan runs a team now, not a queue.** Retrieving a posting is mostly _waiting_ — on a slow government portal, on a careers page that takes six seconds to render — and waiting is the one thing that can happen in parallel. Scans now send out waves of small, cheap helpers (five at a time by default) while the main scan opens no pages itself. What it keeps is everything that compares listings to each other: de-duplication, fit scoring, ranking, writing your digest. Those have to stay in one place, because a ranked top ten only means something if every score came off the same ruler.

> **`calibrate.mjs` and `pipeline.mjs` find your applied index.** Both looked for `Applied Index.md` in the working directory, so from anywhere but the archive folder they reported an empty index [...] A path bug was reporting itself as a diagnosis about your habits.

Every item names what went wrong without it. An item that reads as a feature announcement is not finished.

Three habits worth copying from the items above:

- **End on the cost, not the capability.** "because a ranked top ten only means something if every score
  came off the same ruler", "that list is what decides whether a scan finds anything". The last sentence is
  where the item earns its place.
- **Italicise the pivotal word**, once per item at most: *waiting*, *cloned*, *more expensively*.
- **Explain a term the first time in the sentence that uses it**, in a dash clause, rather than in a
  glossary or a following sentence.

`Also fixed` is the deliberate contrast: single-sentence bullets, one line each, no bold lead-in, for
things too small to carry a paragraph.

> * A search credit was spent confirming Firecrawl worked, every single scan. Whether the tool is loaded is free to check, and the scan's first real page load answers the rest.
> * Drafting could pay twice for one page — verify the posting is open, then load it again for the details. It is one load now, which matters most for a listing picked out of the unchecked tail.

**A "fix" to code that is new in the same release does not go on the page.** The reader has never run the
broken version, so it reads as noise. It belongs in `CHANGELOG.md`, and the decision to leave it off belongs
below the cut line.

## Upgrading

Always present, always says plugins do not update themselves, always gives both the plain-words ask and the
typed commands. Then one line on migration — so far always that there is none:

```markdown
## Upgrading

Plugins don't update themselves. Send `Update my JobScan plugin`, or type `/plugin marketplace update jobscan` then `/plugin update jobscan@jobscan`.

Nothing to migrate: 0.5.0 <what it adds> and changes no file format.
```

If a file format *did* change, say exactly what happens to a user who skipped the previous version.

## Voice

- Second person, present tense, concrete nouns. Name the real file, command and error string.
- Admit the defect plainly. These notes have said "was true about typing and false about consent" and "a
  broken pipeline was indistinguishable from one you had declined". That candour is the house voice.
- Em dashes and italics for the pivotal word are used freely here, unlike handoff documents.
- **One paragraph, one line.** No hard wrapping anywhere in the file, on either side of the cut line: the
  page wraps to the reader's window and a wrapped command does not run. See **One paragraph, one line** in
  `SKILL.md`.
- Backticks for every path, command, filename and config key.
- No branches, SHAs, PR numbers or verification logs in the body. They are not gone — they go below the cut
  line, see **The deliverable** below.
- 400 to 900 words. Longer than that means the changelog is being restated. A one-defect patch can be 350.

## The deliverable

Release notes are handed over as **one file with two parts and a cut line between them**, because the two
audiences are different and only one of them is the public.

```
v0.5.0 — <title>

---

<the public body — this is what gets pasted into the GitHub release form>

════════════════════════════════════════════════════════════════════
  EVERYTHING BELOW THIS LINE IS FOR YOUR RECORDS — DO NOT PASTE
════════════════════════════════════════════════════════════════════

## Supporting information
...
```

Write the file to the session scratchpad and send it with `SendUserFile`, so pasting is a file operation
rather than a copy out of terminal scrollback. Put the public body in the chat too, but never the supporting
block: the file is where that lives.

**The cut line is not decoration.** v0.2.2's release page carries its supporting block in public, naming
commit SHAs, the session git proxy and an HTTP 403 — none of which means anything to someone who installed a
job scanner. The marker exists so that cannot happen by accident again.

### What belongs below the cut

The maintainer's record of the release, which the page deliberately omits:

- **What shipped** — version and the version it came from, the merge commit the tag points at, the PRs and
  commits in the range, the diffstat, and the diffstat *restricted to `plugins/`* when the range carries
  repository work as well.
- **What is deliberately not on the release page** — anything under `.claude/` that shipped in the same
  merge. Naming it here is what makes leaving it off the page a decision rather than an oversight.
- **Plugin behaviour change** — which skills change, and which are untouched.
- **Breaking changes** — and if none, say none.
- **Verification run before merge** — the actual gate output, and the fact that there is no CI in this
  repository so validation is manual by design.
- **Why the version bump mattered** — Claude Code pins an installed plugin to the `version` string.
- **Tagging** — the tag has to be created in the browser; the session git proxy refuses tag pushes with
  HTTP 403.

The v0.2.2 release page is the format reference for this block. Read it for the shape, then keep it private.
