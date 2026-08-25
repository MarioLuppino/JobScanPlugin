---
name: handoff
description: Compact the current conversation into a handoff document — a plain Markdown file committed to this repository and handed over as a path.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

**A handoff is a running checklist, not a session log.** It carries what is still open and what the next
agent would get wrong without it. Everything else is cost.

## Where it lives

`.claude/handoffs/<topic-slug>.md`, committed and pushed to the branch the work is on.

**Plain Markdown, no styling.** No HTML, no CSS, no web page, no tables, no status chips, no emoji. A
handoff is read by an agent far more often than it is looked at by a person, and every character of markup
is a character the next session pays for twice: once to write it, once to read it back. Headings,
paragraphs, numbered lists, backticks around identifiers, fenced blocks around commands. Nothing else.

**Pushing is what makes it durable**, and it is the reason the file is in the repository rather than the
scratchpad: a file that only exists in the session container evaporates with the container. So the commit
and the push are part of writing the handoff, not a follow-up someone might skip.

No date in the filename. A handoff is rewritten in place across sessions, and `git log` already records
when each pass happened.

`.claude/` ships to nobody, so a handoff there never reaches someone who installs the plugin. `docs/` is
product and never holds one.

**This repository is public.** Redact API keys, tokens, passwords, and personal data beyond what the next
agent needs. Pushing publishes.

**Delete the file in the commit that finishes the work it carries.** A handoff left standing after its
thread closes is stale continuity that every later session has to read before it can discover the file is
worthless.

Do not duplicate content already captured elsewhere (specs, plans, ADRs, issues, commits, diffs, README,
CLAUDE.md, in-repo docs). Reference those by absolute path or URL instead.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor
the document to that.

## What goes in it

Use these sections, in this order, and drop any that would be empty:

1. **Mission** — one or two sentences on what the next session is for.
2. **State of play** — the state the next agent has to act on, plus a short "already done, do not redo"
   list. Not a history. Open it with the identifiers the next agent would otherwise have to hunt for, one
   per line: repository, branch, base commit, plugin version, open PR, tag published.
3. **Open items** — numbered, each actionable on its own, with the blocking question stated if there is one.
   This is the part that carries the work forward, so it is the part that survives every trim.
4. **Decisions and constraints** — choices already made that the next agent must not relitigate, and the
   hard rules in play. Give the reasoning, so they survive contact with a fresh opinion.
5. **Gotchas** — dead ends, stale links, tooling quirks, anything that already cost time once. One line each.
6. **Suggested skills** — which skills the next agent should invoke, one line of reasoning each.
7. **Next action** — the single concrete first step.

The shape, in full:

```markdown
# <the mission in the user's words, not "Handoff Document">

Repository: MarioLuppino/JobScanPlugin
Branch: `claude/some-branch`
Base commit: `2a63bca`
Plugin version: 0.4.1
Open PR: none

## State of play
## Open items
1.
## Decisions and constraints
## Gotchas
## Suggested skills
## Next action
```

Name each heading for the work, not the document furniture: `## What changed` and `## Environment traps`
beat `## Summary` and `## Notes`. Open items stay a numbered list so the next chat can refer to them by
number.

Anything drafted in the session that has no home on disk — release notes, a comment you did not post, a
snippet the next agent will need — goes into the document itself. That is the only copy.

## Size budget

**Target 400 words of prose, hard cap 800.** Over the cap, cut completed work first. Never cut open items.

- Completed work earns at most one line, and only when knowing it stops the next agent redoing it or
  explains why the current state looks the way it does. Once that fact is recorded somewhere durable — a
  commit, a merged PR body, `CHANGELOG.md`, a repository doc, a memory file — delete the line and point at
  the durable place instead.
- No chronological narration. No "then I tried X, which failed, so I tried Y". A dead end belongs in
  **Gotchas** as one line, or nowhere.
- No pasted tool output beyond the trimmed error text a live bug actually needs.

## How to write and push it

1. `ls .claude/handoffs/` and read any file covering the same thread of work.
2. Write or rewrite `.claude/handoffs/<topic-slug>.md`.
3. `bash .claude/skills/release/scripts/preflight.sh` — `CLAUDE.md` requires it before every push, and it
   must exit 0.
4. Stage the handoff file by name. Never `git add -A` here: the session's work in progress is a separate
   commit or none at all, and a handoff commit that sweeps it up is unreviewable.
5. Commit and `git push -u origin <branch>`. The push is what makes the path worth handing over.

## Continue one document, do not stack new ones

A handoff is rewritten in place, not appended to. If a file in `.claude/handoffs/` covers the same thread,
edit that file rather than adding a second one, and let git history hold the earlier passes — do not keep
superseded text in the document to preserve it. Any path already pasted somewhere then still resolves.
Start a new file only when the work is genuinely a different thread.

On each pass: delete every item that got done, fold anything now recorded in a commit or a repository file
down to a reference, and re-read the state block off the repository rather than editing it from memory —
head commit, version and open PR all move.

**Every pass should be able to remove lines.** A handoff that only grows is being used as a log and has
stopped doing its job.

## Voice

No em dashes anywhere in the document. Plain sentences, concrete nouns, absolute paths, real command lines.
Write for someone who was not here: name the file, the branch, the PR number, the error string.

## Persistent memory comes first

Before writing, check whether the project has memory (a `memory/MEMORY.md` under the project's Claude
directory) and read it. Durable facts belong in memory; the handoff carries only what is specific to this
stretch of work. If the conversation produced a durable fact that memory is missing, write it to memory too,
then reference it from the handoff rather than restating it.

The same rule applies to this repository's own `CLAUDE.md`: a rule that will hold for every future session
belongs there in a commit, not in a handoff that one session will read once. Moving a fact somewhere durable
is the main way a handoff gets shorter.

## Close the loop

After pushing, keep the chat reply to two lines. **Never print, summarise, restate, or list the handoff's
contents in chat** — the document is the deliverable, and showing it twice wastes tokens. Print only:

- the repository-relative path, and its GitHub URL on the branch for reading it off this machine, and
- a ready-to-paste opening line for the next chat:

  `Read .claude/handoffs/<topic-slug>.md and pick up from there.`

## Picking the work back up

When a session opens with a pointer to a handoff, `cat` it first, then read the files it references before
acting. Treat "Decisions and constraints" as settled. If something in it conflicts with what you observe on
disk, the disk wins: say so, and correct the handoff or the memory file.

If no pointer is given but the request sounds like continued work, `ls .claude/handoffs/` and ask before
assuming a file there is the right one.

Work the open items as your checklist for the session. The next pass over the file deletes the ones you
finished; it does not tick them and keep them.
