# JobScan — working notes for Claude

## Handoffs

Handoffs go in a document, not in the chat. Publish the handoff as an Artifact
and reply with the link and one line of context — nothing more. Do not also
summarize the steps, the task list, or the reasoning in the session. Restating
the document's contents in chat means it exists in two places and burns tokens
for no gain.

The document is the deliverable: write it so it can be copied or pasted into a
fresh chat and stand on its own, with no session context needed to act on it.

When updating an existing handoff, republish to the same URL and reply with that
link and what changed in a sentence.

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

`claude plugin validate ./plugins/jobscan` and `claude plugin validate .` must
both pass.

## Environment

The git proxy in remote sessions allows branch pushes but refuses tag pushes and
ref deletions (HTTP 403). Tags and branch deletions are browser work — don't
retry them with backoff.
