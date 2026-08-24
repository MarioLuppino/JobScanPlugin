# ATS feed pipeline

Pull open roles straight from the public job-board APIs that applicant tracking systems already expose,
filter them in the shell, and hand only the survivors to Claude.

**Why this matters.** A keyword search returns snippets you then have to open one by one, and every
rejection costs tokens. Most employers' listings actually live in an ATS with a free public JSON endpoint:
one request returns every open role. Measured on a real 24-employer registry: **~1,950 postings pulled for
zero API cost, ~87% rejected before anything reached a context window.**

No API keys. No scraping. No paid service.

> **Not something the user has to run.** Onboarding sets this up *for* them: Claude writes both config files
> into their data directory from the interview answers, installs Node if it's missing, and runs the commands
> below itself. The only
> input a non-technical user gives is a list of employers they'd like to work for. If they'd rather not have
> Node installed, the whole pipeline is skipped and the scan falls back to web search. This page is for
> maintainers and anyone adapting the pipeline.

## Two directories, and they must not be mixed

| | Holds | Written by |
|---|---|---|
| **`${CLAUDE_PLUGIN_ROOT}/scripts/`** | the code and the `*.example.json` defaults | the plugin. **Read-only.** |
| **`<data_path>/ats/`** | `triage-config.json`, `employers.json`, `ats-feeds.json`, `workday-candidates.json`, `seen-urls.json` | you and onboarding |

This split is not tidiness. `/plugin update` replaces the plugin directory wholesale, so anything personal
stored beside the scripts is deleted by the very command the README tells users to run — silently, taking
the employer registry and the seen-URL dedup cache with it.

`paths.mjs` resolves `<data_path>` from `$JOBSCAN_DATA`, then `data_path:` in
`~/.claude/jobscan-data/jobscan-config.md`, then `~/.claude/jobscan-data/`. The archive (`Applied Index.md`,
`Work Search Log.md`) comes from `$JOBSCAN_ARCHIVE`, then `archive_path:` in the same config, then the
working directory. To see every resolved path at once:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/paths.mjs"
```

A file still sitting beside the scripts from an older install is read anyway, with a one-line notice telling
you to move it. Nothing is ever written back there.

## Quick start

```bash
S="${CLAUDE_PLUGIN_ROOT}/scripts"           # or the plugin's absolute scripts path
D="$(node "$S/paths.mjs" | awk '/^ats config/{print $3}')"
mkdir -p "$D"

cp "$S/triage-config.example.json" "$D/triage-config.json"  # 1. REQUIRED: your field's job titles
cp "$S/employers.example.json"     "$D/employers.json"      # 2. your target employers
node "$S/discover-ats.mjs"                                  # 3. find which ATS each one uses
node "$S/discover-workday.mjs"                              # 4. (optional) large employers on Workday
node "$S/fetch-ats.mjs" --summary                           # 5. see what's open right now
```

Then the whole cheap half of a scan is one line:

```bash
node "$S/fetch-ats.mjs" | node "$S/dedup.mjs" --record > candidates.json
```

**Step 1 is the one that matters.** `triage-config.json` holds the job titles of *your* field. Leave it
unedited and almost nothing will match, because the defaults are deliberately generic placeholders.

## Files

| File | Purpose |
|---|---|
| `paths.mjs` | Resolves plugin root vs. data directory vs. archive. Run it alone to print all of them. |
| `fetch-ats.mjs` | Pulls every registered feed, normalizes, triages. The main entry point. |
| `triage.mjs` | Zero-token title/location/salary filter. `match` / `review` / `exclude`. |
| `dedup.mjs` | Screens against your applied-index and a persistent seen-URL cache. |
| `discover-ats.mjs` | Probes Greenhouse / Lever / SmartRecruiters / Ashby / Workable slugs. |
| `discover-workday.mjs` | Probes Workday CXS paths; `--retry` re-checks ones marked `pending`. |
| `test-triage.mjs` | Regression tests. Run after any edit to your patterns. |
| `calibrate.mjs` | Reads recorded outcomes; reports whether your fit scores predict anything. |
| `pipeline.mjs` | Application aging, follow-up nudges, weekly quota tracking. |
| `*.example.json` | Templates. Copy each to the same name without `.example`. |

Your own `triage-config.json`, `employers.json`, `ats-feeds.json`, `workday-candidates.json` and
`seen-urls.json` live in `<data_path>/ats/`, outside the repository entirely — they are personal, and
`ats-feeds.json` in particular reveals exactly who you are applying to. The same names are also gitignored
here, so a file left over from an older install cannot be committed by accident.

## Supported ATS platforms

| ATS | How it is read |
|---|---|
| **Greenhouse** | `boards-api.greenhouse.io/v1/boards/{slug}/jobs` |
| **Lever** | `api.lever.co/v0/postings/{slug}?mode=json` |
| **SmartRecruiters** | `api.smartrecruiters.com/v1/companies/{slug}/postings` — supports a server-side `q=` filter, used automatically on boards over 400 postings |
| **Ashby** | `api.ashbyhq.com/posting-api/job-board/{slug}` |
| **Workable** | `apply.workable.com/api/v1/widget/accounts/{slug}` |
| **Workday** | `POST {host}/wday/cxs/{tenant}/{site}/jobs` — the endpoint the careers page's own JavaScript calls |
| **Paylocity** | No API exists; postings are embedded in the board HTML as a `"Jobs":[...]` array and extracted from there |

### Workday is worth the extra setup

A large share of big employers use Workday, and none of them appear in `discover-ats.mjs`. Workday boards
have no sitemap and are invisible to ordinary crawling, which is why they are often written off as
unsearchable. They are not: the CXS endpoint takes a `searchText` field and **filters server-side**.

Read the error code instead of guessing:

- **`HTTP_422` — the tenant/site path is wrong.** By far the most common cause, usually the `wd` number.
  A careers URL of `https://acme.wd5.myworkdayjobs.com/AcmeCareers` means host `acme.wd5.myworkdayjobs.com`,
  tenant `acme`, site `AcmeCareers`. If every guess 422s, open the page and read the actual `/wday/cxs/`
  request in your browser's network tab. That is definitive and takes a minute.
- **`HTTP_500` — the path is right**, the tenant is erroring or Workday is having an outage. The registry
  records these as `pending`; re-run `node "$S/discover-workday.mjs" --retry` later rather than rediscovering.

`discover-workday.mjs` will never shrink the Workday side of your registry: an outage or a network blip
cannot silently delete paths you already confirmed. Only an explicit 422 removes one.

## Tuning triage

Three buckets:

- **`match`** — a title matched one of your `matchTitlePatterns`. Worth pulling the full posting.
- **`review`** — plausible but ambiguous: a generic title at a relevant-sector employer, or one of your
  domain titles somewhere you cannot easily work.
- **`exclude`** — wrong tier, wrong field, or below your salary floor. Never fetched.

If `review` balloons into a holding pen, the usual cause is a sector in `relevantSectors` whose employers
post hundreds of roles you never want. Removing that one sector tag is normally the whole fix.

**Watch out for `\b` at the end of a prefix pattern.** `/hygien\b/` never matches "hygiene", because there
is no word boundary between "n" and "e". This shipped as a real bug and let a whole category through.
`test-triage.mjs` guards against it; add a case whenever you add a prefix pattern.

## Closing the loop

Finding roles is the easy half. These two read what happened *after* you applied, which is the only way
the scoring ever improves.

```bash
node "$S/calibrate.mjs"   # do my fit scores actually predict outcomes?
node "$S/pipeline.mjs"    # what's still live, what needs a follow-up, am I hitting quota?
```

Both read `Applied Index.md` through `archive_path`. **If either reports no index, that is a path problem,
not a finding about your record-keeping** — check `node "$S/paths.mjs"` before believing the report.

**`calibrate.mjs`** reports conversion by score band and flags rules your own outcomes contradict. It
deliberately refuses to draw conclusions below eight resolved outcomes, because a conversion rate from
three rows is noise wearing a percentage sign. The most common first-run finding is that outcomes were
never recorded at all — which *is* the finding. Gates fail silently, so recorded results are the only
instrument that can catch a bad one.

A real case: a user's rule excluded an entire government pay grade as too junior. They were later hired at
exactly that grade, because it carried a promotion ladder to a far higher one. The rule had been discarding
the best role available, invisibly, for months. `calibrate.mjs` exists to surface that class of error.

**`pipeline.mjs`** models the fact that applications take weeks to resolve. It surfaces packets built but
never submitted (wasted work), applications old enough to chase, and whether a weekly quota is being met.

Both need one habit: **record the fit score when you apply, and the outcome when you hear back, including
"no response."** Skipping the score is the usual failure, and it makes your best evidence unusable.

## What this does not do

It finds and filters. It does not verify a posting is still open, score fit, or write anything — the
`job-search` skill does that with the survivors. **Nothing here submits an application.**
