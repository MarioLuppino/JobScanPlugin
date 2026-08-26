# Reading the web cheaply — which tool, and how much of the page

Read this before the first web read of a scan, and whenever a portal refuses a tool. Two separate questions
live here and both are load-bearing: **which tool opens a page** (the ladder and the portal table), and
**how much of that page reaches context** (the size rules at the end). Getting the first one wrong wastes a
round trip; getting the second one wrong is where a scan's token bill actually comes from.

The tool half exists because the
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

## How much of a page to pull

The call is not the expensive part. **The page is.** A tool call to a job board costs a few hundred tokens;
the posting it returns costs several thousand, and a scan reads dozens. So the size rules matter more than
the tool choice, and they are the ones with no natural floor — nothing stops a page getting bigger.

- **Ask for the content, not the document.** Every scrape uses main-content extraction (`onlyMainContent` on
  Firecrawl) and markdown output. Navigation, cookie banners, footers, "related jobs" rails and the
  employer's site chrome are pure cost: they are the majority of most job pages by volume and they carry
  nothing a digest or a résumé ever uses.
- **Distil on arrival, then drop the page.** A retrieved posting becomes the extraction schema and nothing
  else. Do not summarise it in prose first, do not quote it back, do not keep it "in case". Boilerplate that
  never survives distillation: benefits, EEO and legal text, "about our company", application instructions,
  accessibility statements, salary-history-ban notices.
- **One load per posting, ever.** The load that confirms a posting is open is the same load that yields the
  extraction. A run that verifies first and fetches again for detail has paid twice for one page. This
  applies at the pre-draft gate too, where re-confirmation and full deconstruction are one read.
- **Cap search results, and do not paginate.** Ten results per query in a sweep, page one only. Depth comes
  from a more specific query, never from a second page: page two of a job-board search is where the noise
  lives, and it costs the same as page one.
- **Prefer the search result to the page.** A search result line usually carries title, employer, location
  and date. If that is enough to fail a gate, the posting is never worth opening. Only a gate that needs the
  body of the posting justifies a scrape.
- **Never follow a link out of a posting.** Not the employer's other openings, not the "similar roles" list,
  not the department page. Anything found that way belongs to the employer registry, as a name, not as a
  page to read now.
- **Never read a local file with a metered tool.** Paid scrape and OCR are for the web. `local-tooling.md`
  in `jobscan-onboarding/references/` has the free local equivalents and their install commands.

## Three tiers of labour, cheapest first

Same idea as the three cost tiers for postings, applied to the work itself. Before doing anything, ask which
tier it belongs to, and never let work drift upward:

1. **A script does it for free.** Filtering, sorting, deduping, counting, field projection, JSON reshaping,
   date maths. A model reading a thousand rows to pick fifty is the most expensive way to run `grep`. The
   pipeline in `scripts/` already covers title triage, salary gates, age cutoffs and dedup; anything else
   mechanical is a `node -e` one-liner, not a read.
2. **A worker does it cheaply.** Anything that needs a model but not the whole picture: retrieving pages,
   extracting fields, classifying an ambiguous title against a literal pattern list, harvesting employer
   names out of sweep results.
3. **The coordinator does it, because nothing else can.** Only what compares listings to each other or
   writes the output: dedup decisions across sources, fit scoring, ranking, the digest, the handoff.

The rule that follows: **never pull a file into context to do something a command could do to it.**
`candidates.json` is the standing example — see the projection rule in `SKILL.md`.
