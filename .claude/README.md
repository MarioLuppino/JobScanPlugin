# Maintainer tooling — not part of the JobScan plugin

Nothing in this directory ships to anyone who installs JobScan, and nothing in it is needed to use the
plugin. If you are here to run a job search, you want [`../README.md`](../README.md); if you are here to
understand or fork the system, you want [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

The marketplace installs `./plugins/jobscan` and nothing else, so these files reach no user. They exist for
whoever maintains the repository, and they load only for a Claude Code session whose working directory *is*
this repository.

| | |
|---|---|
| `CLAUDE.md` | Repository conventions loaded into every session working here. |
| `skills/release/` | Cutting a version: the gates, the CHANGELOG entry, the PR, the release notes. |
| `skills/handoff/` | Writing a session handoff document. |
| `handoffs/` | The handoff documents themselves — plain Markdown, one per thread of open work. |

## The rule that keeps the two apart

**`CHANGELOG.md` and the GitHub release pages record what changed in the plugin.** Changes to this directory
are not a release and never appear there. A user reading the changelog to find out what is new in their job
scanner should not encounter the repository's own development process.
