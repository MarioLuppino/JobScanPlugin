# Using JobScan alongside your own job-search skills

**This page is for people who write their own skills.** If you came from the README's install steps and have
never made a `SKILL.md`, there is nothing here you need — the plugin works out of the box and nothing on this
page changes that.

If you *do* already have skills named `job-search` / `job-applications`: install JobScan anyway. The two sets
coexist, and JobScan is more useful *alongside* a routine you've already tuned than as a replacement for it.
This is the likely case if you built your own version first, or if you built this plugin *from* a personal
routine.

## Your commands stay yours

Claude Code gives plugin skills a `plugin:skill` namespace, so JobScan's arrive as `/jobscan:job-search`,
`/jobscan:job-applications`, and `/jobscan:jobscan-onboarding`. Your personal `/job-search` and
`/job-applications` keep their bare names and keep running your files. Nothing is renamed, overwritten, or
shadowed, and uninstalling the plugin leaves your skills untouched.

## The one real overlap is automatic triggering

Claude picks a skill by reading the name and description of every skill available, so a vague *"find me some
jobs this week"* now matches two entries. Settle it once:

- **Be specific when you ask.** "Run my weekly job search" for yours; `/jobscan:job-search` for JobScan's.
- **Or sharpen your own description.** Edit the `description` in `~/.claude/skills/job-search/SKILL.md` to
  name what makes it yours — your boards, your field, your archive folder. The more specific description wins
  the ambiguous asks.
- **Or take yours off auto entirely.** Add `disable-model-invocation: true` to your skill's frontmatter and
  drive it only by typing `/job-search`.

Note that the `skillOverrides` setting is not a lever here — it doesn't apply to plugin skills. To silence
JobScan's, disable the plugin from `/plugin`.

## Then pick how much of JobScan you actually want

### Take the data layer, keep your skills

Onboarding's real output isn't the skills — it's a set of plain Markdown files any skill can read: your
`profile.md`, the ~1-page `profile-core.md` digest, per-tier base résumés with `⟪TAILOR⟫` slots, a
reverse-engineered cover-letter voice file, and an append-only `Applied Index.md`. Run
`/jobscan:jobscan-onboarding` — it looks for skills of your own before it asks anything, and offers to build
those files and stop rather than take over. Pointing your own skills at them is two lines at the top of your
`SKILL.md`, which onboarding offers to add for you:

> Read `~/.claude/jobscan-data/jobscan-config.md` first — it holds `data_path` and `archive_path`.
> Then read `<data_path>/profile-core.md` for the candidate profile.

That fixed config path is the whole integration contract. Your skills gain a compressed profile and a dedup
index; JobScan's own skills sit unused unless you call them by name.

### Or split the workflow between them

The two halves are independent: `job-applications` needs a posting plus the profile files, nothing from
`job-search`. So you can keep your finder and use `/jobscan:job-applications` to draft the packet, or scan
with `/jobscan:job-search` and hand the digest to your own drafter.

### Or borrow just the rules

The parts worth stealing are in the reference files — the ATS and résumé-format rules, the writing playbook,
the digest template, the two-gate live-verification discipline. Ask Claude to read JobScan's copy and fold
what you want into your own skill's references; your skill stays the one that runs.

### Or keep them completely apart

Install into a scratch project to trial the plugin without touching a live routine, or fork it and rename the
skills.

---

The reasoning behind all of this — why the data layer, not the skills, is the product — is in
[`ARCHITECTURE.md`](ARCHITECTURE.md) §8. The install steps, and everything you need if you don't write
skills, are in the [README](../README.md).
