---
name: handoff
description: Compact the current conversation into a handoff document, published as an Artifact for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

**A handoff is a running checklist, not a session log.** It carries what is still open and what the next
agent would get wrong without it. Everything else is cost.

**The document is published as an Artifact and handed over as a link, never as a local file.** A file
written in a session container evaporates with the container; a link survives, opens on any machine, and can
be pasted into the next chat. That is the whole reason, and it is settled — do not relitigate it by writing
the handoff to disk, and do not commit one into this repository instead. `docs/` is product; a handoff is
scratch continuity.

The cost of that durability is that the page is HTML, so every word on it is worth roughly three times what
the same word costs as Markdown. That is why the size budget below is a rule and not a preference.

Do not duplicate content already captured elsewhere (specs, plans, ADRs, issues, commits, diffs, README,
CLAUDE.md, in-repo docs, earlier artifacts). Reference them by absolute path or URL instead.

Redact anything sensitive: API keys, passwords, tokens, and personally identifiable information beyond what
the next agent needs. An Artifact is private until shared, but write it as though it will be.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor
the document to that.

## What goes in it

Use these sections, in this order, and drop any that would be empty:

1. **Mission** — one or two sentences on what the next session is for.
2. **State of play** — the state the next agent has to act on, plus a short "already done, do not redo"
   list. Not a history.
3. **Open items** — numbered, each actionable on its own, with the blocking question stated if there is one.
   This is the part of the page that carries the work forward, so it is the part that survives every trim.
4. **Decisions and constraints** — choices already made that the next agent must not relitigate, and the hard
   rules in play. Give the reasoning, so they survive contact with a fresh opinion.
5. **Gotchas** — dead ends, stale links, tooling quirks, anything that already cost time once. One line each.
6. **Suggested skills** — which skills the next agent should invoke, one line of reasoning each.
7. **Next action** — the single concrete first step.

Anything drafted in the session that has no home on disk — release notes, a comment you did not post, a
snippet the next agent will need — goes into the document itself. That is the only copy once the container
is gone.

## Size budget

**Target 400 words of prose, hard cap 800.** Count the words a reader reads, not the markup around them.

Over the cap, cut completed work first. Never cut open items.

- Completed work earns at most one line, and only when knowing it stops the next agent redoing it or
  explains why the current state looks the way it does. Once that fact is recorded somewhere durable — a
  commit, a merged PR body, `CHANGELOG.md`, a repository doc, a memory file — delete the line and point at
  the durable place instead.
- No chronological narration. No "then I tried X, which failed, so I tried Y". A dead end belongs in
  **Gotchas** as one line, or nowhere.
- No pasted tool output beyond the trimmed error text a live bug actually needs.

## How to publish it

1. **Load the `artifact-design` skill first.** It is required before writing any artifact, and it sets how
   much design the page warrants.
2. Read `references/layout.md` in this skill directory for the house layout, then write the page as HTML
   into the session scratchpad. Name the file `<YYYY-MM-DD>-<project-slug>-<topic-slug>.html`, taking today's
   date from the environment context rather than guessing. The project slug is the working directory's own
   name, lowercased and hyphenated.
3. Publish with the `Artifact` tool: a `<title>` at the top of the file, plus `favicon` and a one-sentence
   `description`. Keep the title a short noun phrase, and keep it and the favicon stable across redeploys.

## Continue one document, do not stack new ones

A handoff is rewritten in place, not appended to. Before writing, find the project's existing one: inside
the session you still have its file path, and from a later session `action: "list"` finds the URL and
`action: "read"` recovers the HTML into a local file you can edit.

If it covers the same thread of work, rewrite that page and republish to the same URL — inside the session
by calling `Artifact` again with the same file path, from a later session by publishing the recovered file
with `url` set. Any link already pasted somewhere then still resolves. Change the header eyebrow to
`Session handoff · updated <D Month YYYY>`, delete every item that got done, and fold anything now recorded
in a commit or a repository file down to a reference. Start a new page only when the work is genuinely a
different thread.

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

After publishing, keep the chat reply to two lines. **Never print, summarise, restate, or list the handoff's
contents in chat** — the document is the deliverable, and showing it twice wastes tokens. Print only:

- the Artifact link, and
- a ready-to-paste opening line for the next chat:

  `Read <artifact URL> and pick up from there.`

## Picking the work back up

When a session opens with a pointer to a handoff, read it first (`action: "read"` on the URL), then read the
artifacts it references before acting. Treat "Decisions and constraints" as settled. If something in it
conflicts with what you observe on disk, the disk wins: say so, and correct the handoff or the memory file.

If no pointer is given but the request sounds like continued work, use `action: "list"` to find the most
recent handoff whose title matches this project, and ask before assuming it is the right one.

Work the open items as your checklist for the session. The next pass over the page deletes the ones you
finished; it does not tick them and keep them.
