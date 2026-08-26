# Portals and the tool ladder — pick the right tool on the first attempt

Read this before the first web read of a scan, and whenever a portal refuses a tool. It exists because the
expensive failure in a scan is not a hard portal, it is a *wasted first attempt*: a plain fetch against a
JavaScript portal returns an empty shell, costs a round trip, and teaches nothing, and the agent then pays
again for the tool it should have used first. Two or three of those per source is where a scan's wall clock
goes.

## The ladder

Try one rung. If it fails, go **down** one rung, not sideways, and never repeat a rung with the same input.

1. **A public JSON feed**, if the employer has one. `fetch-ats.mjs` already covers Greenhouse, Lever,
   SmartRecruiters, Ashby, Workable and Workday. Never scrape a board that has a feed.
2. **`firecrawl_search`** for discovery, **`firecrawl_scrape`** for a known URL. This is the **default for
   every web read**, not a fallback for hard pages. It renders JavaScript, returns markdown instead of a DOM,
   and costs one call. Reach for it first even when a page looks static: guessing wrong costs more than the
   call.
3. **Plain fetch** (`WebFetch` / `curl`) only for a URL already known to be server-rendered — a JSON
   endpoint, an RSS feed, a plain HTML careers page you have read before this run.
4. **Browser tools** last, and only with a reason worth writing in the Process note. A browser session is the
   most expensive read in the system: it holds a page open, it drives one tab at a time, and it serialises
   everything behind it. If a scan is spending most of its wall clock in a browser, the ladder was skipped.
   Legitimate reasons: a portal that only responds to its real search box, or a firecrawl call that failed
   twice on a source that matters.

**Never use step 3 to test whether a portal in the table below is dynamic.** That answer is already known,
and the test costs a round trip to re-learn it.

## Known portals

| Portal | What a plain fetch returns | Use this instead |
|---|---|---|
| **USAJOBS** (`usajobs.gov`) | An empty JavaScript shell. It will never work. | The Search API (below), or `firecrawl_scrape` on the posting URL |
| **NEOGOV / governmentjobs.com** (most US state and local agencies, including **WA State Careers**, `careers.wa.gov`) | A shell; search results are session-scoped | `firecrawl_scrape`. Drive the site's own search box if URL parameters are ignored |
| **CalCareers** (`calcareers.ca.gov`) | A shell; navigation is form-postback | `firecrawl_scrape` |
| **Workday** (`*.myworkdayjobs.com`) | A shell; site mapping returns nothing useful | The CXS endpoint: `POST {host}/wday/cxs/{tenant}/{site}/jobs`, `searchText` filters server-side |
| **iCIMS, Taleo/Oracle, Brassring** | A shell | `firecrawl_scrape` |
| **Paylocity** (`recruiting.paylocity.com`) | Full HTML, with the postings embedded as a `"Jobs":[...]` array | Plain fetch is fine; parse the embedded array rather than the rendered list |
| **Greenhouse, Lever, Ashby, SmartRecruiters, Workable** | Works, but pointless | Their JSON feed, via `fetch-ats.mjs` |

Anything not in the table: assume dynamic and start at `firecrawl_scrape`. When a new portal turns out to be
one or the other, say so in the digest's Process note so it can be added here.

## USAJOBS specifically

USAJOBS is the single most-searched source in a US federal scan and the single most common wasted attempt,
so it gets its own paragraph. The public site is entirely JavaScript-driven: `WebFetch` against a search URL
or a posting URL returns a shell with no listing in it, every time, and it is not a transient failure to
retry.

The structured route is the **Search API**, which is free:

```
GET https://data.usajobs.gov/api/search?Keyword=<term>&LocationName=<city, state>&PayGradeLow=<NN>&ResultsPerPage=50
Headers:  Authorization-Key: <key>
          User-Agent: <the email address the key was registered with>
```

The key is self-service and free from `developer.usajobs.gov`: register an email, get a key back, no approval
and no usage fee. The `User-Agent` header is the registered **email address**, not a browser string, which
inverts the usual meaning of that header and is the usual cause of an authorization error against a valid
key. Results arrive under `SearchResult.SearchResultItems`, each with the full announcement in
`MatchedObjectDescriptor`. Useful filters: `Keyword`, `PositionTitle`, `LocationName`, `JobCategoryCode`,
`Organization`, `PayGradeLow` / `PayGradeHigh`, `DatePosted`, `ResultsPerPage` (up to 500) and `Page`.

Without a key, `firecrawl_scrape` on the canonical posting URL is the route, and it is enough for Gate 1.
If a scan is repeatedly slow on federal listings, offering the free key is the fix worth naming — it turns
the whole federal branch into one JSON request.

## When a call fails

- **Never retry a failed command unchanged.** A command that failed for a structural reason (wrong tool,
  wrong endpoint shape, a portal that needs JavaScript) fails identically the second time. Change the tool
  or change the input, or stop.
- **One retry, then down the ladder, then stop.** Attempt the right rung; on failure take one different
  attempt; on a second failure tag the listing `UNVERIFIED`, record why in one clause, and move on. There is
  no third attempt on a single posting. A scan that spends six calls confirming one listing has bought
  nothing the digest can show.
- **`HTTP 429` and `HTTP 403` are rate limits, not page errors.** Back the whole worker pool off — drop
  concurrency by half and pause briefly — rather than retrying the one call. Retrying into a rate limit is
  how a scan stalls without failing.
- **A tool error is not an empty source.** "Nothing found" after a failed or wrongly-tooled probe is a
  tooling failure, and reporting it as a dry source is the more expensive mistake, because next week's scan
  believes it.
- **Workday**: `HTTP_422` means a wrong tenant/site path; `HTTP_500` means the path is right and the tenant
  is erroring.
