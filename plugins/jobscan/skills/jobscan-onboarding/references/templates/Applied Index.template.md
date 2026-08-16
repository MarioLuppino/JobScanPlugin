# Applied / Prepared Index — de-dup source of truth

**Purpose:** one line per application packet ever built, so the weekly scan screens for duplicates by reading
**this one file** instead of opening every numbered folder. Append a row the moment a packet is filed. Keep it
in sync — a packet not listed here is invisible to dedup.

**Columns:** `N` = folder number · `Employer` · `Role` · `Status` (applied / prepared) · `Filed` (YYYY-MM) ·
`Fit` · `Outcome`. Use `—` when a value wasn't recorded; fill going forward.

**`Outcome` is what makes fit scores mean anything.** Record what actually happened: `interviewed`,
`rejected`, `no response`, `offer`, `accepted`, `withdrawn`. Without it there is no way to learn whether
your 85s really outperform your 70s, and the scoring rubric can never improve from evidence. Fill it in
whenever you hear back, even months later — the scan reads this file every week and the signal compounds.

A real example of why this pays: one user's rules screened out an entire government pay grade as too
junior. They were later hired at exactly that grade, because it carried a promotion ladder to a much
higher one — so the rule had been silently discarding the best role available. Only a recorded outcome
surfaces that kind of error.

**Machine-read by `scripts/dedup.mjs`,** which parses this table using the first three columns. Adding
columns at the end is safe; reordering or renaming the first three is not.

| N | Employer | Role | Status | Filed | Fit | Outcome |
|---|----------|------|--------|-------|-----|---------|
| | | | | | | |

<!-- If backfilling from existing application folders, add one row per folder here (employer + role from the
     folder name is enough for dedup; dates/fit/outcome can be filled later). -->
