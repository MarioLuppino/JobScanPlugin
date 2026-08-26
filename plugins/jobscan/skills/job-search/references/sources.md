# Where to search — source categories & query rules

**This is the shipped default, and it is never edited in place.** A `/plugin update` replaces this whole
directory, so onboarding writes the user's field employers, boards and keywords to `<data_path>/sources.md`
instead. `job-search` reads that file first and falls back to this one.

Keep the **categories** below; onboarding swaps in your field's specific employers, boards, and keywords.
The point is coverage across *kinds* of employer, not a fixed list.

## Source categories (fill each with your field's specifics)

1. **Federal** — the national government job portal (in the US, USAJOBS, whose public site is
   JavaScript-only; use its free JSON Search API, see `references/portals.md`). Filter to the pay-grade
   floor from onboarding.
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

The rule is about not *dropping* terms, not about running every term everywhere. Some terms are
**asymmetric**: searching one does not surface postings titled with the other, so each member of an
asymmetric pair is its own required query and neither may be skipped as a synonym. Onboarding records the
user's pairs.

It is not a licence for a full cross-product. Keywords times sites grows fast — eight terms across seven
categories is fifty-six searches before a single posting is read, and that is where a sweep silently becomes
an hour. So:

- Run the **full core set** against each category's one or two **primary** boards, the ones that actually
  index that category. Run the **asymmetric pairs plus the two highest-yield terms** against the rest.
- Cap the sweep at roughly **25 queries per scan**, ten results each, page one only. Depth comes from a more
  specific query, not from a second page or a fourteenth synonym.
- Dispatch them as a wave of workers, one source branch per worker, not as a list to walk. See
  `worker-brief.md`.
- When the cap binds, say which terms did not run, and rotate them to the front next week.

## Split quota (standing rule, if set)

If onboarding set a domestic/international split (e.g. 5 US / 5 international per scan), run the international
branches every scan — not only as a fallback. Apply sponsorship rules per listing. If genuine international
fits fall short after exhausting sources, report fewer and say so; never pad with an unverified listing.

## Query templates

- `"<keyword>" <role-cluster> <location OR remote> after:<recent-date>`
- Employer-direct: `site:<employer-careers-domain> "<keyword>"`
- Federal API: query by keyword + grade floor + location; parse the JSON.

Resolve an aggregator hit to the **employer's own posting** at the point it is verified in depth, not on the
way into the digest. Every resolution is a fetch, and a digest carries about ten rows of which only the top
few are retrieved at all, so cross-checking all of them buys canonical links for listings nobody opened and
contradicts the depth split. A `NOT-CHECKED` row keeps the URL the feed or search result gave it, which is
exactly what its tag says it is. A row promoted to `VERIFIED-LIVE` gets the canonical employer URL as part
of the one load that verifies it.

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

**Choosing a tool by portal type** matters more than it looks — the wrong one produces a false "dry" result,
and the wrong first attempt is where a scan's wall clock goes. The routing table lives in one place,
`references/portals.md`: which portals are JavaScript-driven, what to use on each, USAJOBS' free JSON API,
and the one-retry-then-down-the-ladder rule. It is not repeated here, and it is not copied into a user's
generated sources file, because the same rule in two files is a rule that will drift.

Three things that belong to searching rather than to routing:

- **Numeric-ID job boards** (many government portals): a mapped URL there can be a posting dead for years.
  Never treat one as a live listing without loading it.
- **Portals that ignore URL keyword parameters**: some public-sector and EU research portals return the
  full unfiltered result set no matter what you put in the query string. They must be driven through their
  real search box, and reporting them as "nothing found" after a URL-parameter probe is a tooling failure.
- **Open web search**: always scope with `site:`. Bare keyword job queries return SEO content farms and
  aggregator category pages rather than canonical postings.

**Aggregators are for discovery only.** Always resolve to the employer's own posting before treating a
listing as real, and prefer a stable per-posting URL. Session-based portals can lose a search result
between the scan and when the user opens it.
