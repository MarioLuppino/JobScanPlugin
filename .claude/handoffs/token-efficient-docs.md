# Strip the Claude-facing Markdown of formatting nobody reads, and settle the one install claim a session cannot test

Repository: MarioLuppino/JobScanPlugin
Branch: `claude/handoff-formatting-optimization-fpm3kg`
Base commit: `8cc9157`, identical to `origin/main`
Plugin version: 0.5.0
Open PR: none
Tag published: v0.5.0, release page live

## State of play

The twelve-finding usability audit behind 0.5.0 is finished and shipped: eleven findings closed across `618a306` and `d85440f`, merged, tagged and published. Per-finding detail is in `CHANGELOG.md` under `[0.5.0]`, so do not re-derive or re-audit any of it. The twelfth finding is open item 3 below. That audit previously existed only as a styled web page; this file replaces it, and the page is no longer the record.

## Open items

1. Audit every Markdown file that Claude or a contributor reads, not a JobScan user, and strip formatting that costs tokens and buys nothing: bold runs used for emphasis rather than meaning, decorative headings, tables where a list carries the same content, and sentences that restate the line above them. Measured on `8cc9157`, heaviest first: `plugins/jobscan/skills/jobscan-onboarding/SKILL.md` (3704 words, 79 bold spans), `plugins/jobscan/skills/job-search/SKILL.md` (3112 / 68), `.claude/skills/release/SKILL.md` (1894 / 23), `docs/ARCHITECTURE.md` (1777 / 37), `plugins/jobscan/skills/jobscan-onboarding/references/intake-questionnaire.md` (1528 / 19), `.claude/skills/handoff/SKILL.md` (1491 / 17). Behaviour must not change: skill `description` frontmatter and any wording a trigger depends on stay exactly as they are, the 44-question invariant in `.claude/CLAUDE.md` must still pass after `intake-questionnaire.md` is touched, and preflight must exit 0.
2. Write the standard down so it holds for documentation written after this pass. `.claude/CLAUDE.md` is the place: which files are Claude-facing and get the stripped style, which are user-facing and keep their formatting, and the rule underneath both, that minimising the tokens a future session spends reading an output is the gold standard for producing it.
3. `README.md` step 1 promises that Claude runs `claude plugin marketplace add` and `claude plugin install` for the user. Both commands were confirmed to exist. What is unverified is whether `claude` resolves on the shell PATH inside the desktop app's Code tab on a machine that never installed the CLI separately. It fails soft, because the typed slash commands sit right below it, but it is the first sentence of the install and the whole non-technical route rests on it. Settling it takes one real run on a fresh desktop install with no CLI, which a remote session cannot do. Until then treat that route as plausible rather than proven.

## Decisions and constraints

Item 1 does not touch anything a non-coder reads. `README.md`, `CHANGELOG.md`, `docs/INTERVIEW-QUESTIONS.md`, `examples/`, everything under `references/templates/`, and the GitHub release pages keep their formatting, because there the formatting is what makes the file readable to its audience. Stripping those is the failure mode of this task, not the goal.

Handoffs are plain Markdown under `.claude/handoffs/`, committed and pushed, never a web page or an artifact. That was settled at `4c6327c` and reinforced at `93f8dba`; the skill is `.claude/skills/handoff/SKILL.md`.

Prose in this repository is not hard-wrapped. One paragraph is one line (`93f8dba`, `9b97592`).

Changes under `.claude/` never appear in `CHANGELOG.md` or on a release page. The commit message is their record.

## Gotchas

`bash .claude/skills/release/scripts/preflight.sh` must exit 0 before every push. There is no CI.

The git proxy in these sessions refuses tag pushes and ref deletions with HTTP 403. That is policy, so retrying with backoff is wasted time.

A word count is not the measure for item 1. A file that lost its bold but kept a paragraph of throat-clearing did not get cheaper in the way that matters.

## Suggested skills

`handoff`: rewrite this file in place on the next pass, delete the items that got done, and delete the file entirely in the commit that closes the last one.

`release`: only if item 1 changes files under `plugins/jobscan/` enough to be worth a version. A pass confined to `.claude/` ships to nobody and is not a release.

## Next action

Start item 1 on `plugins/jobscan/skills/jobscan-onboarding/SKILL.md`, the largest file Claude loads, and use what it costs to establish the pattern for the rest.
