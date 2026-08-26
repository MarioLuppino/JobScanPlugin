# Where to search — source categories & query rules

**This is the shipped default, and it is never edited in place.** A `/plugin update` replaces this whole
directory, so onboarding writes the user's field employers, boards and keywords to `<data_path>/sources.md`
instead. `job-search` reads that file first and falls back to this one.

Keep the **categories** below; onboarding swaps in your field's specific employers, boards, and keywords.
The point is coverage across *kinds* of employer, not a fixed list.

## Source categories (fill each with your field's specifics)

1. **Federal** — the national government job portal (in the US, USAJOBS; use its API where possible for
   reliable structured search). Filter to the pay-grade floor from onboarding.
2. **State / provincial agencies** — often on NEOGOV / governmentjobs.com-style portals. These need JS
   rendering (Firecrawl or a browser) to read.
3. **University / research institutions** — HR boards, department pages, HigherEdJobs/Chronicle-style
   aggregators.
4. **Non-profit / mission organizations** — sector job boards and org careers pages.
5. **Industry / corporate** — company careers pages (often Workday/Greenhouse/Lever) for the private-sector
   employers in your field.
6. **Transferable-sector** — adjacent industries your fuller work history unlocks (list them from onboarding),
   so the search isn't limited to your single headline identity.
7. **Field society / niche boards** — the professional-society job board(s) for your discipline.

For each category, onboarding records: the boards/URLs, any API pattern, and the target employers.

## Search-term coverage (standing rule)

Run the **full core keyword set** against every site that supports keyword search — not a different subset per
site. Some terms are **asymmetric**: searching one does not surface postings titled with the other, so run
each as its own query. Onboarding records the user's asymmetric keyword pairs; treat each member as a separate
required query.

## Split quota (standing rule, if set)

If onboarding set a domestic/international split (e.g. 5 US / 5 international per scan), run the international
branches every scan — not only as a fallback. Apply sponsorship rules per listing. If genuine international
fits fall short after exhausting sources, report fewer and say so; never pad with an unverified listing.

## Query templates

- `"<keyword>" <role-cluster> <location OR remote> after:<recent-date>`
- Employer-direct: `site:<employer-careers-domain> "<keyword>"`
- Federal API: query by keyword + grade floor + location; parse the JSON.

Cross-check every aggregator hit against the **employer's own careers page** for the canonical live apply
link before including it in the digest.

## ATS feeds — run these BEFORE any keyword search

Most employers' listings live in an applicant tracking system that publishes a free, public JSON endpoint.
One request returns every open role at that employer: no keyword guessing, no scraping, no API key. This
replaces the bulk of a search sweep. See `scripts/README.md` for setup.

The scripts live in the plugin and the config lives in the user's data directory, so both halves need real
paths — a bare `node scripts/…` resolves against the wrong directory and fails:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/fetch-ats.mjs" \
  | node "${CLAUDE_PLUGIN_ROOT}/scripts/dedup.mjs" --record > candidates.json
```

| ATS | Endpoint |
|---|---|
| Greenhouse | `boards-api.greenhouse.io/v1/boards/{slug}/jobs` |
| Lever | `api.lever.co/v0/postings/{slug}?mode=json` |
| SmartRecruiters | `api.smartrecruiters.com/v1/companies/{slug}/postings` (supports server-side `q=`) |
| Ashby | `api.ashbyhq.com/posting-api/job-board/{slug}` |
| Workable | `apply.workable.com/api/v1/widget/accounts/{slug}` |
| Workday | `POST {host}/wday/cxs/{tenant}/{site}/jobs` — `searchText` filters server-side |
| Paylocity | no API; postings are embedded in the board HTML as a `"Jobs":[...]` array |

**Choosing a tool by portal type** matters more than it looks — the wrong one produces a false "dry" result:

- **Standard CMS sites** (small nonprofits, agencies hosting their own listings): site mapping works well.
- **Workday**: mapping returns nothing useful; use the CXS endpoint above.
- **Numeric-ID job boards** (many government portals): mapping returns opaque IDs including postings dead
  for years — never treat a mapped URL there as a live listing.
- **Portals that ignore URL keyword parameters**: some public-sector and EU research portals return the
  full unfiltered result set no matter what you put in the query string. They must be driven through their
  real search box, and reporting them as "nothing found" after a URL-parameter probe is a tooling failure.
- **Open web search**: always scope with `site:`. Bare keyword job queries return SEO content farms and
  aggregator category pages rather than canonical postings.

**Aggregators are for discovery only.** Always resolve to the employer's own posting before treating a
listing as real, and prefer a stable per-posting URL. Session-based portals can lose a search result
between the scan and when the user opens it.
