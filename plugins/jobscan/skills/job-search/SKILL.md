---
name: job-search
description: >-
  Weekly job scanner. Searches the web for ACTIVE job listings the user is a strong fit for, verifies each is
  live, scores it against their profile, ranks the top ~10, and writes a dated digest with direct apply links
  — then hands selected jobs to the job-applications skill. Use whenever the user wants to find jobs, run a
  job search, "scan for openings", get a weekly list of matches, or check what's out there — and also to
  read back a digest a previous or scheduled scan already wrote ("show me last week's digest", "what did
  Monday's scan find"). Prepares packets for review; never submits. Companion to job-applications.
---

# Job Search (weekly scanner)

This skill finds jobs; `job-applications` assesses and drafts.

Resolve paths first. Read the config at the fixed location `~/.claude/jobscan-data/jobscan-config.md`, which holds `data_path` (where personal files live) and `archive_path` (where application folders, digests, and `Applied Index.md` live). Throughout this skill, `<jobscan-data>` and `<archive>` mean those values. If the config is missing, tell the user to run `jobscan-onboarding` first and stop; don't guess paths.

Then read the user's compressed profile digest at `<jobscan-data>/profile-core.md`. Open the full `profile.md` only when the digest lacks a detail.

## Hard rules (do not violate)

- Prepare, never submit. Produce ready-to-submit packets and direct apply links; the user does the final submission. Never auto-submit, fill application forms, or create accounts on any job board or employer ATS. Read-only browsing only.
- Active listings only, no fabrication. Every listing must have a real, working canonical source URL actually loaded this run. Never reconstruct a posting from memory or an aggregator snippet. If you can't verify it's real and open, leave it out.
- Two-gate verification.
  - Gate 1 (digest): retrieve each posting; capture the canonical apply URL (employer ATS/careers page, not an aggregator), the exact title, and posted/closing date. Tag `VERIFIED-LIVE` or `UNVERIFIED`. A listing deliberately not retrieved this run is tagged `NOT-CHECKED` — see the depth rule under Fit scoring — and the three tags mean three different things: confirmed open, attempted and unconfirmable, and never looked at. Never let a `NOT-CHECKED` row acquire any detail a feed did not supply.
  - Gate 2 (pre-draft, HARD STOP): no application material is generated for any job unless its posting is re-confirmed live at draft time. No exceptions, however strong the fit.
- Firecrawl first, on every web read. `firecrawl_search` for discovery and `firecrawl_scrape` for a known URL are the default tool, not the fallback for hard pages: one call, JavaScript rendered, markdown back. A plain fetch is only for a URL already known to be server-rendered. A browser session is the last rung and the most expensive read in the system — it holds a page open and drives one tab at a time, so everything queues behind it; if a scan is spending its wall clock in a browser, the ladder was skipped. A firecrawl load of the real posting confirming title and open state counts as `VERIFIED-LIVE`; if nothing confirms it, leave `UNVERIFIED` and say so. With no Firecrawl at all, note it once and use built-in fetch/search plus browser tools.
- Never plain-fetch a known dynamic portal to see whether it works. USAJOBS, NEOGOV/governmentjobs (which is most US state and local agencies, including WA State Careers), CalCareers, Workday, iCIMS and Taleo return an empty shell to a plain fetch every time. That is structural, not transient, so the attempt is a guaranteed wasted round trip and the answer is already written down. USAJOBS also publishes a free JSON Search API, which turns the whole federal branch into one request. The routing table, the free key, the one-retry-then-down-the-ladder rule, and — the half that costs more — how much of a page to pull once it opens: `references/portals.md`. Read it before the first web read of a scan, and whenever a portal refuses a tool.
- No duplicates, no resurfacing. Before finalizing the digest and again at the pre-draft gate, screen every candidate against two files in `<archive>`: `Applied Index.md` (packets already built) and `Considered - Not Pursued.md` (roles seen and passed on). Read those two files, not every folder. Exact or near-exact employer+role match in either means exclude. Same employer, adjacent role means surface once as a possible duplicate and let the user decide. When the user tells you to drop a listing, or reviews a digest role and skips it, append a row to `Considered - Not Pursued.md` (`Employer | Role | Reason | Date | Permanent?`) so it doesn't reappear next scan.
- Only cache a verdict about a posting that was actually examined. The seen-URL cache is permanent and silent: a URL in it is skipped by every future scan with no line anywhere saying so. That is exactly right for a posting this scan opened, verified and rejected, and exactly wrong for one that was merely surfaced. Never record a listing carried at `NOT-CHECKED` depth, and never record a discovery sweep. See "Record what was judged" below for the command and what belongs in it.
- Hard gates, encoding the user's from onboarding: work-authorization/sponsorship logic; salary floor (plus higher relocation floor and any government pay-grade floor); location/political-lean handling; the fit floor (exclude anything below the chosen score); and the avoid-list (sectors that consistently don't work out). Write each as rule + reason + how-to-apply. Always surface salary in the digest.

## Token-efficient staged workflow (STANDING RULE)

Run in distinct stages; treat context as a limited resource. Goal: output indistinguishable from a full-context workflow at the lowest token cost. Don't narrate intermediate reasoning.

1. Discovery to structured summary, then discard the posting. Search, de-dup, drop expired. Distill each surviving posting to a compact summary (title, org, location, required/preferred quals, responsibilities, skills/tools, certs, ATS keywords, research area/industry, seniority, salary, dates, canonical URL + verification status). Drop boilerplate, benefits and legal text. Do this server-side with Firecrawl where available (`firecrawl_scrape` + immediate distill, or `firecrawl_agent` structured extraction if a key is configured) so the bulky posting never enters context. Prefer `firecrawl_search` over fetch+search round-trips.
2. Candidate retrieval: read `profile-core.md` once per run and reuse it for every listing.
3. (Résumé tailoring and 4. cover letter run in `job-applications` on selection. See that skill.)

Two-stage extraction. Never pull a full posting just to learn it fails a gate. The saving is in the fetch that never happens, not in extracting less from a page already retrieved — once a page is loaded it has been paid for. So stage one reads title, salary, open/closed, location and any hard credential requirement off the feed or the search result line, without loading anything; only postings clearing the gates are worth a load, and that single load yields the full extraction. Most die at stage one, unloaded. Cheapest first, always: a title pattern costs nothing, the feed's own metadata (location, posting date, and any pay range it publishes) costs nothing, and only after both is a posting worth fetching. Anything a gate can decide from metadata should never reach a fetch.

Then a third stage, which is the one that decides the run's cost: only the top few survivors are extracted in full. See "Verify in depth at the top, list the rest" under Fit scoring.

### Run it as a coordinator, not as a searcher

You are the coordinator. **Do not retrieve postings yourself.** Run the scripts, split the work, dispatch workers, merge what comes back, score, rank, write. A scan where the main thread is opening pages is a scan running at one posting a minute, and the symptom is visible from outside: a single browser tab, one page at a time, for an hour.

Fan out for both reasons, and the wall-clock one is real. A posting read is latency, not computation — the run is waiting on a portal, and waiting parallelises. Rate limits cap how wide the pool can go; they do not make width worthless. The context win is separate and also real: ten postings read inside a worker and returned as ten small objects are ten postings that never entered this thread.

- **Every retrieval and every source sweep goes to a worker**, on the cheapest model tier the surface offers. Retrieval and extraction are mechanical: fetch, read fields off a page, fill a schema.
- **Default 5 workers in flight**, batches of 6-10 postings. Dispatch a whole wave in one turn. Sending one worker and waiting for it is the serial scan with extra overhead.
- **Never split judgement.** Dedup, fit scoring, ranking, the digest and the handoff stay here. Scores from separate workers are not comparable, which breaks the ranked list, the fit floor and `calibrate.mjs` at once. Scoring is cheap anyway: it runs on the returned extraction, with no fetching in it.
- **A worker reads nothing.** No config, no profile, no skill file — all of that is fixed overhead multiplied by the number of workers. Everything it needs is inline in its brief, as literal values.
- **Check the wave before using it.** A worker that returned nothing and a source that had nothing are opposite facts that look identical in a merged list. Every dispatched worker returns rows or an explicit empty-with-reason; anything else is a failed branch, named in the Process note and re-dispatched once if the budget allows.

Three tiers of labour, and work never drifts upward: a **script** does anything mechanical for free (filtering, counting, projecting fields, deduping — a model reading a thousand rows to pick fifty is the most expensive possible `grep`); a **worker** does anything that needs a model but not the whole picture; the **coordinator** does only what compares listings to each other. Before doing anything yourself, ask which tier it belongs to.

Brief templates, the return schema, the tier table and the concurrency rules: `references/worker-brief.md`. Read it before the first dispatch. The briefs are written the way they are because a smaller model needs the gate values as numbers rather than as references, a closed output schema rather than an instruction to summarise, and an explicit list of what not to do — it will not infer any of the three.

### Run budget (STANDING RULE)

A scan expands to fill whatever it is given, and the user pays for that in usage limits, not just in time. So fix the budget before the first dispatch and hold to it. A run cannot meter its own tokens, so the budget is written in things it can count:

- **Deep verifications:** the number the depth rule sets (top three, or the weekly quota, whichever is more), plus at most two replacements for ones that fail to confirm. Not more, however interesting the list gets.
- **Attempts per posting:** two. Then `UNVERIFIED`, one clause saying why, move on.
- **Worker waves:** four. **Tool calls per worker:** about 15 for a sweep, two per URL for verification.
- **Wall clock:** check the time at each wave boundary, not per posting. Stop widening the sweep at 30 minutes; stop dispatching at 45; a scan should finish inside an hour and a registry-driven one should finish in a fraction of that.

Whichever runs out first ends the dispatching, and ending is not failing: rank what exists, finish the digest, write the handoff, and say in the Process note that the budget closed the run and which branch was left unsearched. Next week's scan starts there — rotate it to the front. A user can set `scan_budget` in `jobscan-config.md` to override the defaults; treat a number there as the ceiling.

The one thing that never gets cut for budget is verification depth on what the user will actually act on. Cut the sweep's width, cut the wave count, cut the `NOT-CHECKED` tail. Never hand back a list where nothing was confirmed open.

## The first scan is a discovery run

The registry is what makes every later scan nearly free, and it starts as whatever the user could name at onboarding. A posting expires in weeks; a confirmed feed returns every future opening at that employer for nothing. So when the registry is thin, an expensive sweep's durable output is the **employer list**, not the job list — collect the employer behind every posting that clears title triage, and keep them.

Mechanics, commands and what to report: `references/discovery-run.md`. Read it on a first scan, on a registry under about a dozen employers, or after any sweep that covered ground the registry does not reach. On a scan where the registry is already working, skip it — it changes nothing about a normal run.

## Where to search

STEP 0: check the setup, then pull the ATS feeds before spending anything on search. Most employers' listings live in an applicant tracking system with a free public JSON endpoint, and one request returns every open role.

Resolve the scripts directory first, because a bare `node scripts/…` will not work. The scripts ship inside the plugin, not in the user's project, so a relative path resolves against whatever directory the user happens to be in and fails. Use `${CLAUDE_PLUGIN_ROOT}/scripts/`. If that variable is empty in your shell, derive the absolute path from the location of this `SKILL.md` (the plugin root is two levels above `skills/job-search/`) and use it in full. Confirm the whole picture in one command before spending anything:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs"
```

It reports every precondition in one pass: paths, config, profile, job titles, employer registry, feeds, archive, applied index. `paths.mjs` alone still prints just the resolved paths if that is all you need. Follow the `jobscan-doctor` skill's triage: fatal (no config, no profile) stops the scan and offers onboarding; degrading (no registry, no Node, no Firecrawl, no way to dispatch workers) continues on the fallback path and goes in the digest's Process note; thin (few employers, no recorded outcomes) is mentioned once at the end — and a thin registry is the trigger for the discovery run above, not just a remark. Also confirm Firecrawl by calling it rather than trusting the config line, since a server connected during onboarding isn't loaded until Claude Code restarts. A surface with no subagent tool is the one degradation that changes nothing about the output and multiplies the run time, so say it in the Process note rather than letting a slow scan look normal.

Then run the cheap half of the scan:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fetch-ats.mjs" \
  | node "${CLAUDE_PLUGIN_ROOT}/scripts/dedup.mjs" --record > candidates.json
```

**Never read `candidates.json` into context.** It is the output of the free stage and it holds every surviving posting from every registered board — on a tuned registry, a few hundred records, pretty-printed, and the `review` bucket alone can be most of them. Reading it undoes the entire saving the pipeline exists to produce: the postings were filtered without a model precisely so no model would have to look at them. Project what you need with a command and leave the file on disk:

```
node -e 'const c=require("./candidates.json");console.log(c.length);const b={};for(const j of c)b[j.verdict]=(b[j.verdict]||0)+1;console.log(b)'
node -e 'require("./candidates.json").filter(j=>j.verdict==="match").slice(0,40).forEach(j=>console.log([j.employer,j.title,j.location,j.salaryMin||"",j.url].join(" | ")))'
```

Counts first, then one projected line per posting, then URLs only when handing a batch to a worker. A worker gets a list of URLs, never the file. `fetch-ats.mjs --summary` prints per-employer counts to stderr if that is all you need.

That pulls every registered employer, applies zero-token title triage, and screens against the applied-index and seen-URL cache. Triage rejects on the title, on any pay range the feed publishes (converted to an annual figure first, so an hourly rate is not compared against an annual floor), and on posting age where the user has set a cutoff — all for nothing, before a single fetch. A posting the feed says nothing about is never rejected for the silence. On a tuned 24-employer registry this returned ~1,950 postings for zero API cost with ~87% rejected before anything reached context; a fresh registry returns far less, which is what the discovery run above exists to fix rather than a reason to expect little. Only then spend search budget on what the registry does not cover. Setup and the per-ATS details are in `scripts/README.md`.

The scripts never write inside the plugin. Every personal file (`employers.json`, `triage-config.json`, `ats-feeds.json`, `workday-candidates.json`, `seen-urls.json`) lives in `<jobscan-data>/ats/`, because the plugin directory is replaced on `/plugin update` and anything stored there is destroyed. `paths.mjs` resolves that from `$JOBSCAN_DATA`, then `data_path` in the config, then `~/.claude/jobscan-data/`. If a script reports it is reading config from the plugin folder, that install predates the split: move those files to `<jobscan-data>/ats/` and say you did.

If the pipeline can't run (no `employers.json`, Node missing because the user declined it at onboarding, or `paths.mjs` erroring), search the boards directly and record one line in the digest's Process note saying the ATS feeds were skipped and why. Never stop to ask the user to install something mid-scan, and never let the fallback pass unrecorded: a silent downgrade is indistinguishable from a working scan.

Read the user's sources first, the plugin's second. Onboarding writes the field-specific employers, boards and keywords to `<jobscan-data>/sources.md`; read that if it exists. The plugin's own `references/sources.md` is the shipped default (categories, API patterns, query templates, and the search-term-coverage and split-quota rules) and is never edited in place, because a plugin update overwrites it. Keep the source categories (federal, state agency, university/research, non-profit, industry, transferable-sector) whichever file supplies the specifics. Cross-check aggregator hits against the employer's own careers page for the live apply link.

Firecrawl availability: `firecrawl_search` for discovery, `firecrawl_scrape` for any known URL, `firecrawl_parse` for documents. These three work on the keyless hosted server (`https://mcp.firecrawl.dev/v2/mcp`), which needs no account or API key; if Firecrawl is missing entirely, that is the setup to offer. `firecrawl_map` (canonical posting URL) and `firecrawl_agent` need an API key, so treat them as a bonus, not a dependency. All fall back gracefully to built-in fetch/search/browser tools; note the fallback in the digest's Process note. Never use `firecrawl_interact` (or browser form-fill) to submit anything.

Operational rules learned the expensive way:

- Check the tool is available before declaring it unavailable. Read the authentication line of a status check and only that line. A transient network error ("could not fetch account info", DNS failure) is not a missing key, so retry it. Misreading one downgraded an entire scan to basic web search while the tool sat authenticated and funded.
- Search boxes are allowed; submitting is not. Some portals ignore `?keyword=` URL parameters entirely and respond only to their real search UI, so typing a query into a site's own search box and clicking search is fine. Never use form-fill to complete, advance, or submit an actual application, create an account, or log in. And never report a portal as "dry" when it was only probed with URL parameters: that is a tooling failure, not an absence of jobs.
- Never spend a metered credit on a LOCAL file. Paid scrape and OCR services are for the web. A saved posting, an offer letter, or a scanned form on disk should be handled by free local tooling, and if that tooling is missing, tell the user which one-line install fixes it for their OS rather than quietly billing an API. Check a PDF for a text layer first with `pdftotext -layout f.pdf - | tr -d '[:space:]' | wc -c`; near zero means image-only, so render it with `pdftoppm` or OCR it locally. Full list and per-platform install commands: `jobscan-onboarding/references/local-tooling.md`. Give install commands for the user's actual OS; an `apt` command on Windows is worse than useless.
- Don't map marketing domains. A company homepage's `/careers` page is usually a marketing shell with no listings on it. Employers belong in the ATS registry, not a map sweep.
- Cap every interactive session with an explicit timeout and an explicit stop in the same command. One session left open billed 50 credits for a single 7-minute run. This is a second reason a browser is the last rung, not the first.
- Monitors are not free. Check the estimated recurring cost when creating one: a naive daily monitor with four queries came to over half a monthly credit budget, while two queries at five results was a quarter of that. Never monitor what the free ATS feeds already cover.
- Rotate sweep order. Whatever sits last in a fixed list is what a timeout or an exhausted budget cuts, and it will be the same sources every single week. Rotate the order so the tail moves, dispatch the branches as one wave rather than in sequence, and say explicitly in the digest when a branch was skipped.

## Fit scoring

Apply the `job-applications` competency-mapping method. Gate checks (must pass): authorized (or sponsored), active, meets hard/required quals (or a marked near-miss). Assign a fit score 0-100 with a one-line rationale, top 1-2 matches, biggest gap, and a tier tag (federal / state agency / industry / academic / sales) that drives the résumé template. Rank by fit; keep the top ~10 (apply the user's split quota if set), and verify them to two different depths — see below. Exclude anything below the fit floor, and never pad the count by lowering it.

Gate failures are disqualifications, not low scores. A role that fails a hard gate (below the salary floor, not authorized to work there, closed, a required credential the user genuinely lacks) is excluded outright; no strength elsewhere redeems it. Score only what clears the gates. Keep the weighted dimensions and their weights written down rather than re-derived per posting, or scores will not be comparable between listings or between scans.

### Verify in depth at the top, list the rest

The digest's length and the digest's cost are different things. A row in the ranked table is nearly free. Gate 1 — retrieving the posting, confirming it open, extracting it in full — is the expensive part, and doing it ten times does it seven times more than the user will act on this week.

So split the list by depth instead of shortening it. The top three by provisional score — or enough to cover a weekly application quota, whichever is more — get the full treatment: retrieved, confirmed live, scored against the full posting, written up as per-job blocks, tagged `VERIFIED-LIVE`. Everything below that is carried as a table row only, from what the feed already reported (title, employer, location, salary, date), with a provisional score written `~72` and the tag `NOT-CHECKED`. Never write a per-job block for a listing nobody retrieved: its fields are precisely the ones a feed cannot answer, and filling them from a title is fabrication.

This is safe because of Gate 2, not in spite of it. No application material is ever generated against a posting that has not been re-confirmed live at draft time, so a shallow entry the user picks fails loudly at the gate instead of quietly producing a packet for a role that closed a month ago.

Keep the list itself at about ten. Cutting it to three costs three things that are not obvious from inside a single scan: a user with a weekly application quota needs volume, and the rule below says plainly that a scan returning less than the quota has failed at its primary job; `calibrate.mjs` reports conversion by score band, which needs listings spread across bands before it can say anything; and `Considered - Not Pursued.md` only ever records a decision about a role that was surfaced to be declined. What is scarce is depth, not rows.

A provisional score still obeys the fit floor — never carry a `NOT-CHECKED` row below it, and never pad the list by relaxing it. But never present a provisional score as a fit, either. It is a prediction from a title, a location and a salary line, and the reason it is marked at all is that the full posting moves it often.

Let recorded outcomes correct the rules, and actually read them. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/calibrate.mjs"` periodically: it reports conversion by score band and flags rules the user's own outcomes contradict. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/pipeline.mjs"` at the start of a scan for what is still live, what is stale enough to follow up on, and whether a weekly quota is being met. Both find `Applied Index.md` through `archive_path` in the config; if either reports no index, that is a path problem to fix, not a finding that the user never recorded outcomes. The `Outcome` column in `Applied Index.md` exists so gates can be checked against reality. One user's rule screened out an entire government pay grade as too junior; they were later hired at exactly that grade, which carried a promotion ladder to a far higher one. Whenever an outcome contradicts a gate, fix the gate and say so: a rule that would have discarded a job the user actually took is a bug, not a preference.

### If the user has a weekly application quota

Some users must apply to a minimum number of jobs per week to maintain unemployment benefits. When that is set, it changes what the scan is for: the deliverable is no longer a tidy ranked ten, it is enough genuinely applyable roles to clear the quota. A scan that surfaces fewer has failed at its primary job, so say so plainly and widen immediately.

A quota also sets the verification depth, not just the count. A `NOT-CHECKED` row is a lead, not an applyable role: it has not been confirmed open. So verify in full at least as many as the quota requires, and if the sweep cannot produce that many, say the number that was actually verified rather than reporting the table's length.

Never let a quota lower the fit floor or relax verification. The answer to a thin week is a wider sweep, never a padded list. A prepared packet does not count toward a quota; only a submitted application does, and the user submits it. Log submissions in `Work Search Log.md`.

## Output: the weekly digest

Write to `<archive>/Job Search Digests/<YYYY-MM-DD> digest.md` using `references/digest-template.md`: a ranked table plus a per-job block. The digest lists candidates only; it does not create folders. Do not repeat the findings in chat — see the handoff below, which is where the ranked list is delivered.

Write the digest as you go, not at the end. A full scan (thousands of postings pulled, workers fanned out, every survivor verified live and scored) is a large consumption event, and a user on a lower plan can hit a limit partway through. If the file is only written at the end, they have nothing: no partial list, no record of what was already checked, no way to resume. So create the digest file as soon as the first batch is scored, marked `IN PROGRESS`, and append each batch to it. Re-rank when the scan completes and drop the marker.

Say up front what a first scan involves if this is the user's first run: roughly how long, that it is the most expensive run they'll do, and that stopping is safe because the digest is on disk from the first batch onward. Say what makes the later ones cheap, because it is the reason this one costs what it does — the scan keeps the employers it finds, and next week it pulls their boards directly instead of searching for them again. The first run buys the registry; every run after it spends the registry.

### Record what was judged

`dedup.mjs --record` caches only the duplicates it found itself. What it cannot see is a posting this scan opened, verified and rejected — so that posting is fetched and judged again next week, and every week after, which is the exact cost the cache exists to remove. Close the loop at the end of a run:

```
cat rejected.json | node "${CLAUDE_PLUGIN_ROOT}/scripts/dedup.mjs" --record --record-verdict passed
```

Only genuinely examined postings belong in that file: deep-verified and scored below the fit floor, or shown to the user and declined. Nothing carried at `NOT-CHECKED` depth, nothing from a discovery sweep. The verdict is permanent and nothing ever announces it again, so recording an unexamined posting removes it from every future scan without anyone having decided to.

### Then the handoff, and stop

Every finished scan writes a second file: `<archive>/Job Search Digests/<YYYY-MM-DD> handoff.md`, written as soon as the digest is re-ranked and its `IN PROGRESS` marker is dropped. It carries the ranked list best-first, how to read the tags and the scores, the deadlines worth knowing this week, and what the scan could not cover. Format and the interpretation guidance: `references/handoff.md`.

It exists because drafting happens in a **new chat**. By the time a scan ends, this one is holding thousands of postings' worth of history that packet-drafting cannot use, and drafting here pays for the whole scan a second time — usually running into a limit mid-letter. The handoff is the only thing that crosses over.

So the reply that ends a scan is two lines: where the files are, and the sentence to paste into a new chat (`Read "<archive>/Job Search Digests/<YYYY-MM-DD> handoff.md" and start my application packets.`). **Never list the findings in the chat the scan ran in** — not the top three, not a preview, not the apply links. They are already on disk, and writing them again costs the most at the moment the run is most expensive.

### Reading back a digest that already exists

"Show me last week's digest", "what did Monday's scan find", "did my job search run": do not start a scan. Read `<archive>/Job Search Digests/`, take the most recently dated file (or the one they named), and give them the count, the top few with their apply links, and the date on it. Offer the rest rather than pasting the whole file, and go straight to `job-applications` if they pick something, since a digest written last week still needs Gate 2 re-confirming the posting is live, so a stale pick fails loudly rather than quietly.

This is the only route back to a run nobody was present for, so treat an empty folder as an answer rather than an error: no digest file means no scan has ever finished here. Say that, and run `jobscan-doctor` if they were expecting one, because a scheduled run that silently never fired looks exactly like a quiet week.

Digest first, then draft on selection, in the chat the handoff opens. If the user picks jobs here anyway, that is their call: file each pick into the numbered archive and invoke `job-applications` as below.

### Filing a selected application

0. PRE-DRAFT GATE (every time, hard stop): (a) duplicate-check against `Applied Index.md`; (b) re-load the canonical URL and confirm title + employer + open state. If not confirmable live, STOP and report; do not create a folder or materials.
1. Next number: highest existing numbered folder + 1 (ignore year folders).
2. Create `<archive>/<N> <Job Title>/`.
3. Populate: `Resume - <role>.docx`, `Cover Letter - <role>.docx`, `Job Posting.md` (downloaded copy), `NOTES.txt` (direct apply link + what still needs verifying), and `Outreach Email - <role>.md` only for ideal-fit-but-no-sponsorship cases (draft, never sent).
4. Append one row to `<archive>/Applied Index.md` (`N | Employer | Role | Status | Filed | Fit`). Missing this silently breaks dedup.

## Running as the weekly routine

With the user present: run scan, score, rank, write digest, write the handoff, then the two-line reply — where the files are and the sentence to paste into a new chat. The findings go in the handoff, not in the reply. If genuine fits fall short of the target count after a real search effort, say so in one line and put the shortfall in the handoff too; never lower the bar.

On a schedule, nobody is reading the chat. A scheduled run's only durable output is the two files in `<archive>/Job Search Digests/`, so finish by making sure both are complete, correctly dated and carrying the Process note, not by composing a summary no one will see. The handoff matters more on an unattended run, not less: it is what the user opens on Monday morning without having watched anything happen. Anything that would have been said in chat and matters (a source branch skipped, Firecrawl unavailable, zero matches this week) belongs in the file, because the file is all that survives the run.

Whoever registers the schedule owes the user two sentences at that moment: which folder the weekly file lands in, and that "show me last week's digest" brings it back. To automate the weekly run, see `references/scheduling.md`.
