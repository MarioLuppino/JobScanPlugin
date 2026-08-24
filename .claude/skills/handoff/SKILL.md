---
name: handoff
description: Compact the current conversation into a handoff document, published as an Artifact for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work.
**The document is published as an Artifact and handed over as a link, never as a local file.** A file written
in a session container evaporates with the container; a link survives, opens on any machine, and can be
pasted into the next chat.

Do not duplicate content already captured elsewhere (specs, plans, ADRs, issues, commits, diffs, README,
CLAUDE.md, in-repo docs, earlier artifacts). Reference them by absolute path or URL instead.

Redact anything sensitive: API keys, passwords, tokens, and personally identifiable information beyond what
the next agent needs. An Artifact is private until shared, but write it as though it will be.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor
the document to that.

## What goes in it

Use these sections, in this order, and drop any that would be empty:

1. **Mission** — one or two sentences on what the next session is for.
2. **State of play** — what is done and where it lives.
3. **Open items** — numbered, each actionable on its own, with the blocking question stated if there is one.
4. **Decisions and constraints** — choices already made that the next agent must not relitigate, and the hard
   rules in play. Give the reasoning, so they survive contact with a fresh opinion.
5. **Gotchas** — dead ends, stale links, tooling quirks, anything that already cost time once.
6. **Suggested skills** — which skills the next agent should invoke, one line of reasoning each.
7. **Next action** — the single concrete first step.

Anything drafted in the session that has no home on disk — release notes, a comment you did not post, a
snippet the next agent will need — goes into the document itself. That is the only copy once the container
is gone.

## How to publish it

1. **Load the `artifact-design` skill first.** It is required before writing any artifact, and it sets how
   much design the page warrants.
2. Read `references/layout.md` in this skill directory for the house layout, then write the page as HTML
   into the session scratchpad. Name the file `<YYYY-MM-DD>-<project-slug>-<topic-slug>.html`, taking today's
   date from the environment context rather than guessing. The project slug is the working directory's own
   name, lowercased and hyphenated.
3. Publish with the `Artifact` tool: a `<title>` at the top of the file, plus `favicon` and a one-sentence
   `description`. Keep the title a short noun phrase, and keep it and the favicon stable across redeploys.

**Updating an existing handoff:** republish to the same URL rather than creating a second one. Within a
session, call `Artifact` again with the same file path. From a later session the scratchpad is gone, so pass
`action: "read"` with the URL to recover the HTML, edit that file, then publish with `url` set. Use
`action: "list"` to find the URL of a handoff whose link you do not have.

## Voice

No em dashes anywhere in the document. Plain sentences, concrete nouns, absolute paths, real command lines.
Write for someone who was not here: name the file, the branch, the PR number, the error string.

## Persistent memory comes first

Before writing, check whether the project has memory (a `memory/MEMORY.md` under the project's Claude
directory) and read it. Durable facts belong in memory; the handoff carries only what is specific to this
stretch of work. If the conversation produced a durable fact that memory is missing, write it to memory too,
then reference it from the handoff rather than restating it.

The same rule applies to this repository's own `CLAUDE.md`: a rule that will hold for every future session
belongs there in a commit, not in a handoff that one session will read once.

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
