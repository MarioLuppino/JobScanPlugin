# Strip the Claude-facing Markdown of formatting nobody reads, and settle the one install claim a session cannot test

Repository: MarioLuppino/JobScanPlugin
Branch: `claude/handoff-formatting-optimization-fpm3kg`
Base commit: `8cc9157`, identical to `origin/main`
Plugin version: 0.5.0
Open PR: none
Tag published: v0.5.0, release page live

## State of play

The twelve-finding usability audit behind 0.5.0 is shipped: eleven closed, merged, tagged and published, with per-finding detail in `CHANGELOG.md` under `[0.5.0]`. Do not re-audit any of it. The twelfth finding is open item 3.

## Open items

1. Audit every Markdown file that Claude or a contributor reads, not a JobScan user, and strip formatting that costs tokens and buys nothing: bold runs used for emphasis rather than meaning, decorative headings, tables where a list carries the same content, and sentences that restate the line above them. `plugins/jobscan/skills/jobscan-onboarding/SKILL.md` is done at `f6c6456`, about 10 percent lighter, and its commit message carries the style the rest of the pass should follow. Remaining, heaviest first as measured on `8cc9157`: `plugins/jobscan/skills/job-search/SKILL.md` (3112 words, 68 bold spans), `.claude/skills/release/SKILL.md` (1894 / 23), `docs/ARCHITECTURE.md` (1777 / 37), `plugins/jobscan/skills/jobscan-onboarding/references/intake-questionnaire.md` (1528 / 19), `.claude/skills/handoff/SKILL.md` (1491 / 17), then the smaller skill and reference files. Behaviour must not change: skill `description` frontmatter and any wording a trigger depends on stay exactly as they are, the 44-question invariant in `.claude/CLAUDE.md` must still pass after `intake-questionnaire.md` is touched, and preflight must exit 0.

2. Write the standard down so it holds for documentation written after this pass. `.claude/CLAUDE.md` is the place: which files are Claude-facing and get the stripped style, which are user-facing and keep their formatting, and the rule underneath both, that minimising the tokens a future session spends reading an output is the gold standard for producing it.
3. `README.md` step 1 promises Claude runs `claude plugin marketplace add` and `claude plugin install` for the user. Both commands exist; what is unverified is whether `claude` resolves on the shell PATH inside the desktop app's Code tab on a machine that never installed the CLI separately. It fails soft, since the typed slash commands sit right below it, but it is the first sentence of the install and the non-technical route rests on it. Settling it takes one real run on a fresh desktop install with no CLI, which a remote session cannot do. Until then treat that route as plausible, not proven.

## Decisions and constraints

Item 1 does not touch anything a non-coder reads. `README.md`, `CHANGELOG.md`, `docs/INTERVIEW-QUESTIONS.md`, `examples/`, everything under `references/templates/`, and the release pages keep their formatting, because there it is what makes the file readable to its audience. Stripping those is the failure mode of this task.

Verify each file by extracting its backticked identifiers, quoted user-facing phrases and numbers before and after, and diffing those sets. On `jobscan-onboarding/SKILL.md` that was 98 identifiers, 30 quoted phrases and 17 numbers, all preserved. A pass that cannot show that diff clean has not been checked.

The version decision waits until the whole pass is done. These edits ship inside the plugin but change nothing a user can observe, so they are one CHANGELOG entry and one bump at the end, not a bump per file. `plugin.json` is still 0.5.0 and the working tree now differs from the published v0.5.0.

Handoffs are plain Markdown under `.claude/handoffs/`, committed and pushed, never a web page or an artifact (`4c6327c`, `93f8dba`; skill at `.claude/skills/handoff/SKILL.md`).

Prose in this repository is not hard-wrapped. One paragraph is one line (`93f8dba`, `9b97592`).

Changes under `.claude/` never appear in `CHANGELOG.md` or on a release page. The commit message is their record.

## Gotchas

`bash .claude/skills/release/scripts/preflight.sh` must exit 0 before every push. There is no CI.

The git proxy in these sessions refuses tag pushes and ref deletions with HTTP 403. That is policy, so retrying with backoff is wasted time.

A word count is not the measure for item 1. A file that lost its bold but kept a paragraph of throat-clearing did not get cheaper in the way that matters.

## Suggested skills

`handoff`: rewrite this file in place, and delete it in the commit that closes the last item.

`release`: at the end of item 1, for the single version bump and CHANGELOG entry. A pass confined to `.claude/` ships to nobody and is not a release.

## Next action

Continue item 1 on `plugins/jobscan/skills/job-search/SKILL.md`, applying the style from `f6c6456` and the same before/after verification.
