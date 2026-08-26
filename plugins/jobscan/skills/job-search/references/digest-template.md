# Weekly digest — output format

Write to `<archive>/Job Search Digests/<YYYY-MM-DD> digest.md`. Two parts: a ranked table, then a per-job
block. Always include the apply link inline in the chat summary too.

The table carries the whole ranked list; the per-job blocks carry only the listings verified in depth. A row
and a block are different claims — that difference is the point of the format.

## Header

```
# Job Search Digest — <YYYY-MM-DD>

Scanned: <categories/sites covered>. Verification: <tooling used; note any fallback>. Fits at or above the
fit floor: <count>, of which <count> verified live this run.
Process: <fallbacks, skipped branches, employers discovered/confirmed — anything that made this run
differ from a clean one>.
```

## Ranked table

| # | Title | Org | Location / Remote | Salary | Posted / Closes | Fit | Tier | Status | Apply |
|---|-------|-----|-------------------|--------|-----------------|-----|------|--------|-------|
| 1 | ...   | ... | ...               | ...    | ...             | 92  | federal | VERIFIED-LIVE | <url> |
| 4 | ...   | ... | ...               | ...    | ...             | ~74 | industry | NOT-CHECKED | <url> |

`Tier` ∈ {federal, state agency, industry, academic, sales}.

`Status` says what was actually done to the listing, and the three values are not degrees of confidence in
the same thing:

- `VERIFIED-LIVE` — retrieved this run, title and open state confirmed, scored against the full posting.
- `UNVERIFIED` — retrieval was attempted and could not confirm it. Say why in the block.
- `NOT-CHECKED` — deliberately not retrieved. Everything in the row is as the feed or the search result
  reported it, and the fit is a prediction, written with a leading `~`.

A `~` score is provisional and must stay marked as one everywhere it appears, including the chat summary.
It still obeys the fit floor: a listing whose provisional score is below the floor does not go in the table
at all.

## Per-job block (one per listing that was retrieved)

```
### <#>. <Title> — <Org>  (Fit <score>, <tier>, <status>)
- **Location / Remote:** ...
- **Salary:** ... (flag if below the preferred floor or requires relocation)
- **Posted / Closes:** ...
- **Why it fits:** one line
- **Top 1–2 matches:** ...
- **Biggest gap:** ... (note if likely fatal)
- **Apply:** <canonical URL>
- **Flags:** sponsorship / location lean / duplicate-of-<folder> / etc., as applicable
```

## Rules

- Candidates only — the digest never creates application folders.
- Never include a listing below the fit floor, even labeled "(reach)".
- Never pad to a target count with an unverified or stale listing; report fewer and say what was searched.
- A per-job block is written only for a listing that was retrieved — `VERIFIED-LIVE`, or `UNVERIFIED` with
  the block saying what blocked confirmation. Its fields (why it fits, top matches, biggest gap) are exactly
  the ones a feed cannot answer, so writing one from a title is fabrication, not a shortcut. A `NOT-CHECKED`
  listing is a table row and nothing more.
- `NOT-CHECKED` is a statement about this run, not about the listing. It is the cheap half of a deliberate
  split — verify the top few in depth, list the rest — and never a way to report more findings than were
  actually checked. If nothing was verified in depth, the scan is not finished.
