# Release notes, house style

Live examples, newest first — read one before writing:
[v0.4.0](https://github.com/MarioLuppino/JobScanPlugin/releases/tag/v0.4.0),
[v0.3.0](https://github.com/MarioLuppino/JobScanPlugin/releases/tag/v0.3.0),
[v0.2.2](https://github.com/MarioLuppino/JobScanPlugin/releases/tag/v0.2.2).

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
things the documentation had been wrong about. Do not invent a section to fill space.

## Title

`vX.Y.Z — <clause>`, where the clause is a claim about the user's experience, not a feature name:

- v0.4.0 — Nothing fails quietly, and nothing is set in stone
- v0.3.0 — The pipeline actually runs when you install it
- v0.2.2 — Coexist with your own job-search skills

## Opening

State the defect first, in the terms someone hit it in, and only then say what the release does about it.
0.3.0 opens with "Before this release, the fastest and most complete half of JobScan only worked if you had
*cloned* this repository" — not with "improved plugin path resolution".

## Body items

Bold lead-in, then mechanism, then what it stops costing. The lead-in is either the sentence a user would
actually say, or the plain-language effect:

> **"Add employers to my job scan."** Adds or drops the organizations the scanner watches, re-runs feed
> discovery, and updates the job titles it matches. This is the one that matters most: a target list grows
> all year, and that list is what decides whether a scan finds anything.

> **`calibrate.mjs` and `pipeline.mjs` find your applied index.** Both looked for `Applied Index.md` in the
> working directory, so from anywhere but the archive folder they reported an empty index [...] A path bug
> was reporting itself as a diagnosis about your habits.

Every item names what went wrong without it. An item that reads as a feature announcement is not finished.

## Upgrading

Always present, always says plugins do not update themselves, always gives both the plain-words ask and the
typed commands. Then one line on migration — so far always that there is none:

```markdown
## Upgrading

Plugins don't update themselves. Send `Update my JobScan plugin`, or type `/plugin marketplace update
jobscan` then `/plugin update jobscan@jobscan`.

Nothing to migrate: 0.5.0 <what it adds> and changes no file format.
```

If a file format *did* change, say exactly what happens to a user who skipped the previous version.

## Voice

- Second person, present tense, concrete nouns. Name the real file, command and error string.
- Admit the defect plainly. These notes have said "was true about typing and false about consent" and "a
  broken pipeline was indistinguishable from one you had declined". That candour is the house voice.
- Em dashes and italics for the pivotal word are used freely here, unlike handoff documents.
- Backticks for every path, command, filename and config key.
- No branches, SHAs or PR numbers in the body. v0.2.2 carried a supporting block with them; v0.3.0 and
  v0.4.0 dropped it and read better. Leave it out unless the user asks.
- 400 to 900 words. Longer than that means the changelog is being restated.
