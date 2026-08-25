# JobScan — working notes for Claude

## Handoffs and unfinished work

**Never write remaining work into the session.** No "what's left", no next-steps
list, no task list, no "for a future session" paragraph in the chat. Every one of
those belongs in a handoff document and nowhere else. This holds at the end of a
task, when you run out of scope, and when you hand back mid-stream.

**Use the `handoff` skill** (`.claude/skills/handoff/`) to write one. It publishes
the document as an Artifact and hands it over as a link, because a file written in
a session container evaporates with the container. Reply with the link and one
line of context, nothing more: restating the document's contents in chat means it
exists in two places and burns tokens for no gain.

The document is the deliverable. Anything a next session must know goes in it:
open decisions, blocked steps, environment traps, what was deliberately left
undone and why.

Reporting what you *did* is not a handoff; that stays in the chat, brief.

## Invariant — the 44 interview questions

`docs/INTERVIEW-QUESTIONS.md` and
`plugins/jobscan/skills/jobscan-onboarding/references/intake-questionnaire.md`
carry the same 44 questions and must stay in sync: the `✓` marks in the first
must match the `[CV]` tags in the second. Check after any edit to either:

```
python3 - <<'PY'
import re
sq = open("plugins/jobscan/skills/jobscan-onboarding/references/intake-questionnaire.md").read().split("## A. Identity")[1]
dq = open("docs/INTERVIEW-QUESTIONS.md").read().split("# The questions")[1]
cv_src = set(int(m) for m in re.findall(r'^(\d+)\. `\[CV\]`', sq, re.M))
cv_doc = set(int(m) for m in re.findall(r'^(\d+)\. ✓', dq, re.M))
print("in sync:", cv_src == cv_doc, "| count:", len(cv_src), "| diff:", sorted(cv_src ^ cv_doc))
PY
```

## Before pushing

```
bash .claude/skills/release/scripts/preflight.sh
```

Runs both plugin validators, the 44-question invariant above, the triage tests,
and a check that `plugin.json`'s version has a `CHANGELOG.md` section. There is no
CI here, so this is it. It must exit 0 before any push.

## Shipping a version

Use the `release` skill (`.claude/skills/release/`). It carries the version rules,
the PR conventions, the release-notes house style, and the two steps a session
cannot do — the tag and the release page are browser work, see Environment below.

## Environment

The git proxy in remote sessions allows branch pushes but refuses tag pushes and
ref deletions (HTTP 403). Tags and branch deletions are browser work — don't
retry them with backoff.
