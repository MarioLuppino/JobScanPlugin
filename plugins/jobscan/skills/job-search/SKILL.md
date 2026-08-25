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
  - Gate 1 (digest): retrieve each posting; capture the canonical apply URL (employer ATS/careers page, not an aggregator), the exact title, and posted/closing date. Tag `VERIFIED-LIVE` or `UNVERIFIED`.
  - Gate 2 (pre-draft, HARD STOP): no application material is generated for any job unless its posting is re-confirmed live at draft time. No exceptions, however strong the fit.
- Dynamic portals (NEOGOV/governmentjobs, Paylocity, USAJOBS, CalCareers, Workday) can't be read by a plain fetch. Use `firecrawl_scrape` (renders JS) first: a firecrawl load of the real posting confirming title and open state counts as `VERIFIED-LIVE`. Fall back to browser tools if firecrawl is blocked. If neither confirms, leave `UNVERIFIED` and say so. With no Firecrawl at all, note it once and use built-in fetch/search plus browser tools.
- No duplicates, no resurfacing. Before finalizing the digest and again at the pre-draft gate, screen every candidate against two files in `<archive>`: `Applied Index.md` (packets already built) and `Considered - Not Pursued.md` (roles seen and passed on). Read those two files, not every folder. Exact or near-exact employer+role match in either means exclude. Same employer, adjacent role means surface once as a possible duplicate and let the user decide. When the user tells you to drop a listing, or reviews a digest role and skips it, append a row to `Considered - Not Pursued.md` (`Employer | Role | Reason | Date | Permanent?`) so it doesn't reappear next scan.
- Hard gates, encoding the user's from onboarding: work-authorization/sponsorship logic; salary floor (plus higher relocation floor and any government pay-grade floor); location/political-lean handling; the fit floor (exclude anything below the chosen score); and the avoid-list (sectors that consistently don't work out). Write each as rule + reason + how-to-apply. Always surface salary in the digest.

## Token-efficient staged workflow (STANDING RULE)

Run in distinct stages; treat context as a limited resource. Goal: output indistinguishable from a full-context workflow at the lowest token cost. Don't narrate intermediate reasoning.

1. Discovery to structured summary, then discard the posting. Search, de-dup, drop expired. Distill each surviving posting to a compact summary (title, org, location, required/preferred quals, responsibilities, skills/tools, certs, ATS keywords, research area/industry, seniority, salary, dates, canonical URL + verification status). Drop boilerplate, benefits and legal text. Do this server-side with Firecrawl where available (`firecrawl_scrape` + immediate distill, or `firecrawl_agent` structured extraction if a key is configured) so the bulky posting never enters context. Prefer `firecrawl_search` over fetch+search round-trips.
2. Candidate retrieval: read `profile-core.md` once per run and reuse it for every listing.
3. (Résumé tailoring and 4. cover letter run in `job-applications` on selection. See that skill.)

Two-stage extraction. Never pull a full posting just to learn it fails a gate. The first pass extracts only title, salary, open/closed, location and any hard credential requirement; only postings clearing the gates get a full extraction. Most die at stage one.

If you fan out to subagents, do it for context isolation, not speed. Scraping tools are usually rate-limited per account, so parallel agents contend for the same slots and buy little wall-clock. The real win is that an agent reading ten postings and returning ten structured verdicts keeps ten full postings out of the main context. So: the main thread runs the ATS feeds and cheap sweeps (already filtered, fast); subagents do per-posting deep reads and scoring, returning schema-shaped data, never prose; the main thread keeps dedup, ranking and digest-writing, which need the whole picture and go inconsistent when split. Fan out only above roughly 8-10 postings, since each agent re-reads the profile and rules as fixed overhead. Add a final completeness check that every source branch was actually searched: a batch that times out silently looks identical to a source that had nothing.

## Where to search

STEP 0: check the setup, then pull the ATS feeds before spending anything on search. Most employers' listings live in an applicant tracking system with a free public JSON endpoint, and one request returns every open role.

Resolve the scripts directory first, because a bare `node scripts/…` will not work. The scripts ship inside the plugin, not in the user's project, so a relative path resolves against whatever directory the user happens to be in and fails. Use `${CLAUDE_PLUGIN_ROOT}/scripts/`. If that variable is empty in your shell, derive the absolute path from the location of this `SKILL.md` (the plugin root is two levels above `skills/job-search/`) and use it in full. Confirm the whole picture in one command before spending anything:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs"
```

It reports every precondition in one pass: paths, config, profile, job titles, employer registry, feeds, archive, applied index. `paths.mjs` alone still prints just the resolved paths if that is all you need. Follow the `jobscan-doctor` skill's triage: fatal (no config, no profile) stops the scan and offers onboarding; degrading (no registry, no Node, no Firecrawl) continues on the fallback path and goes in the digest's Process note; thin (few employers, no recorded outcomes) is mentioned once at the end. Also confirm Firecrawl by calling it rather than trusting the config line, since a server connected during onboarding isn't loaded until Claude Code restarts.

Then run the cheap half of the scan:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fetch-ats.mjs" \
  | node "${CLAUDE_PLUGIN_ROOT}/scripts/dedup.mjs" --record > candidates.json
```

That pulls every registered employer, applies zero-token title triage, and screens against the applied-index and seen-URL cache. On a tuned 24-employer registry this returned ~1,950 postings for zero API cost with ~87% rejected before anything reached context; a fresh registry returns far less until onboarding's employer list grows. Only then spend search budget on what the registry does not cover. Setup and the per-ATS details are in `scripts/README.md`.

The scripts never write inside the plugin. Every personal file (`employers.json`, `triage-config.json`, `ats-feeds.json`, `workday-candidates.json`, `seen-urls.json`) lives in `<jobscan-data>/ats/`, because the plugin directory is replaced on `/plugin update` and anything stored there is destroyed. `paths.mjs` resolves that from `$JOBSCAN_DATA`, then `data_path` in the config, then `~/.claude/jobscan-data/`. If a script reports it is reading config from the plugin folder, that install predates the split: move those files to `<jobscan-data>/ats/` and say you did.

If the pipeline can't run (no `employers.json`, Node missing because the user declined it at onboarding, or `paths.mjs` erroring), search the boards directly and record one line in the digest's Process note saying the ATS feeds were skipped and why. Never stop to ask the user to install something mid-scan, and never let the fallback pass unrecorded: a silent downgrade is indistinguishable from a working scan.

Workday is searchable via its CXS endpoint (`searchText` filters server-side) despite having no sitemap. `HTTP_422` there means a wrong tenant/site path; `HTTP_500` means the path is right and the tenant is erroring.

Read the user's sources first, the plugin's second. Onboarding writes the field-specific employers, boards and keywords to `<jobscan-data>/sources.md`; read that if it exists. The plugin's own `references/sources.md` is the shipped default (categories, API patterns, query templates, and the search-term-coverage and split-quota rules) and is never edited in place, because a plugin update overwrites it. Keep the source categories (federal, state agency, university/research, non-profit, industry, transferable-sector) whichever file supplies the specifics. Cross-check aggregator hits against the employer's own careers page for the live apply link.

Preferred tooling (Firecrawl): `firecrawl_search` for discovery, `firecrawl_scrape` for JS portals, `firecrawl_parse` for documents. These three work on the keyless hosted server (`https://mcp.firecrawl.dev/v2/mcp`), which needs no account or API key; if Firecrawl is missing entirely, that is the setup to offer. `firecrawl_map` (canonical posting URL) and `firecrawl_agent` need an API key, so treat them as a bonus, not a dependency. All fall back gracefully to built-in fetch/search/browser tools; note the fallback in the digest's Process note. Never use `firecrawl_interact` (or browser form-fill) to submit anything.

Operational rules learned the expensive way:

- Check the tool is available before declaring it unavailable. Read the authentication line of a status check and only that line. A transient network error ("could not fetch account info", DNS failure) is not a missing key, so retry it. Misreading one downgraded an entire scan to basic web search while the tool sat authenticated and funded.
- Search boxes are allowed; submitting is not. Some portals ignore `?keyword=` URL parameters entirely and respond only to their real search UI, so typing a query into a site's own search box and clicking search is fine. Never use form-fill to complete, advance, or submit an actual application, create an account, or log in. And never report a portal as "dry" when it was only probed with URL parameters: that is a tooling failure, not an absence of jobs.
- Never spend a metered credit on a LOCAL file. Paid scrape and OCR services are for the web. A saved posting, an offer letter, or a scanned form on disk should be handled by free local tooling, and if that tooling is missing, tell the user which one-line install fixes it for their OS rather than quietly billing an API. Check a PDF for a text layer first with `pdftotext -layout f.pdf - | tr -d '[:space:]' | wc -c`; near zero means image-only, so render it with `pdftoppm` or OCR it locally. Full list and per-platform install commands: `jobscan-onboarding/references/local-tooling.md`. Give install commands for the user's actual OS; an `apt` command on Windows is worse than useless.
- Don't map marketing domains. A company homepage's `/careers` page is usually a marketing shell with no listings on it. Employers belong in the ATS registry, not a map sweep.
- Cap every interactive session with an explicit timeout and an explicit stop in the same command. One session left open billed 50 credits for a single 7-minute run.
- Monitors are not free. Check the estimated recurring cost when creating one: a naive daily monitor with four queries came to over half a monthly credit budget, while two queries at five results was a quarter of that. Never monitor what the free ATS feeds already cover.
- Rotate sweep order and background long batches. If a batch hits a tool timeout, whatever sits last in a fixed list is never searched, and it will be the same sources every single week. Rotate the order, and say explicitly in the digest when a branch was skipped.

## Fit scoring

Apply the `job-applications` competency-mapping method. Gate checks (must pass): authorized (or sponsored), active, meets hard/required quals (or a marked near-miss). Assign a fit score 0-100 with a one-line rationale, top 1-2 matches, biggest gap, and a tier tag (federal / state agency / industry / academic / sales) that drives the résumé template. Rank by fit; keep the top ~10 (apply the user's split quota if set). Exclude anything below the fit floor, and never pad the count by lowering it.

Gate failures are disqualifications, not low scores. A role that fails a hard gate (below the salary floor, not authorized to work there, closed, a required credential the user genuinely lacks) is excluded outright; no strength elsewhere redeems it. Score only what clears the gates. Keep the weighted dimensions and their weights written down rather than re-derived per posting, or scores will not be comparable between listings or between scans.

Let recorded outcomes correct the rules, and actually read them. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/calibrate.mjs"` periodically: it reports conversion by score band and flags rules the user's own outcomes contradict. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/pipeline.mjs"` at the start of a scan for what is still live, what is stale enough to follow up on, and whether a weekly quota is being met. Both find `Applied Index.md` through `archive_path` in the config; if either reports no index, that is a path problem to fix, not a finding that the user never recorded outcomes. The `Outcome` column in `Applied Index.md` exists so gates can be checked against reality. One user's rule screened out an entire government pay grade as too junior; they were later hired at exactly that grade, which carried a promotion ladder to a far higher one. Whenever an outcome contradicts a gate, fix the gate and say so: a rule that would have discarded a job the user actually took is a bug, not a preference.

### If the user has a weekly application quota

Some users must apply to a minimum number of jobs per week to maintain unemployment benefits. When that is set, it changes what the scan is for: the deliverable is no longer a tidy ranked ten, it is enough genuinely applyable roles to clear the quota. A scan that surfaces fewer has failed at its primary job, so say so plainly and widen immediately.

Never let a quota lower the fit floor or relax verification. The answer to a thin week is a wider sweep, never a padded list. A prepared packet does not count toward a quota; only a submitted application does, and the user submits it. Log submissions in `Work Search Log.md`.

## Output: the weekly digest

Write to `<archive>/Job Search Digests/<YYYY-MM-DD> digest.md` using `references/digest-template.md`: a ranked table plus a per-job block. Include each apply link inline in the chat summary. The digest lists candidates only; it does not create folders.

Write the digest as you go, not at the end. A full scan (thousands of postings pulled, subagents fanned out, every survivor verified live and scored) is a large consumption event, and a user on a lower plan can hit a limit partway through. If the file is only written at the end, they have nothing: no partial list, no record of what was already checked, no way to resume. So create the digest file as soon as the first batch is scored, marked `IN PROGRESS`, and append each batch to it. Re-rank when the scan completes and drop the marker.

Say up front what a first scan involves if this is the user's first run: roughly how long, that it is the most expensive run they'll do (later scans dedup against the seen-URL cache), and that stopping is safe because the digest is on disk from the first batch onward.

### Reading back a digest that already exists

"Show me last week's digest", "what did Monday's scan find", "did my job search run": do not start a scan. Read `<archive>/Job Search Digests/`, take the most recently dated file (or the one they named), and give them the count, the top few with their apply links, and the date on it. Offer the rest rather than pasting the whole file, and go straight to `job-applications` if they pick something, since a digest written last week still needs Gate 2 re-confirming the posting is live, so a stale pick fails loudly rather than quietly.

This is the only route back to a run nobody was present for, so treat an empty folder as an answer rather than an error: no digest file means no scan has ever finished here. Say that, and run `jobscan-doctor` if they were expecting one, because a scheduled run that silently never fired looks exactly like a quiet week.

Digest first, then draft on selection. Wait for the user to pick jobs. For each pick, file it into the numbered archive and invoke `job-applications`.

### Filing a selected application

0. PRE-DRAFT GATE (every time, hard stop): (a) duplicate-check against `Applied Index.md`; (b) re-load the canonical URL and confirm title + employer + open state. If not confirmable live, STOP and report; do not create a folder or materials.
1. Next number: highest existing numbered folder + 1 (ignore year folders).
2. Create `<archive>/<N> <Job Title>/`.
3. Populate: `Resume - <role>.docx`, `Cover Letter - <role>.docx`, `Job Posting.md` (downloaded copy), `NOTES.txt` (direct apply link + what still needs verifying), and `Outreach Email - <role>.md` only for ideal-fit-but-no-sponsorship cases (draft, never sent).
4. Append one row to `<archive>/Applied Index.md` (`N | Employer | Role | Status | Filed | Fit`). Missing this silently breaks dedup.

## Running as the weekly routine

With the user present: run scan, score, rank, write digest, then notify with the top matches and apply links inline plus the digest location. If genuine fits fall short of the target count after a real search effort, report fewer and say so; never lower the bar.

On a schedule, nobody is reading the chat. A scheduled run's only durable output is the digest file at `<archive>/Job Search Digests/<YYYY-MM-DD> digest.md`, so finish by making sure that file is complete, correctly dated and carries its Process note, not by composing a summary no one will see. Anything that would have been said in chat and matters (a source branch skipped, Firecrawl unavailable, zero matches this week) belongs in the file, because the file is all that survives the run.

Whoever registers the schedule owes the user two sentences at that moment: which folder the weekly file lands in, and that "show me last week's digest" brings it back. To automate the weekly run, see `references/scheduling.md`.
