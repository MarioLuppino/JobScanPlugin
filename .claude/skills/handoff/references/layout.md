# Handoff page layout

The house format, taken from the handoff at
`https://claude.ai/code/artifact/f6ca21f1-582b-4fd5-86dd-98f90115fe60`. Follow it so successive handoffs read
as one series. `artifact-design` still governs the design pass; this file only fixes what is specific to a
handoff page.

## Shape

```
header
  .eyebrow      "Session handoff · updated 24 August 2026"
  h1            the mission in the user's words, not "Handoff Document"
  p.lede        one or two sentences: what the next session is for
  dl.state      the facts a next agent needs in the first ten seconds

section  (repeat)
  .sechead
    h2          the section's job, stated plainly
    .eyebrow    a sharpening subtitle, not a restatement
  .prose | .ledger | ol
```

## The state grid

A `<dl class="state">` of four to six short facts, each a `<dt>` label and a monospace `<dd>` value. Use the
identifiers a next agent would otherwise have to hunt for:

    Repository · Branch · Base commit · Plugin version · Open PR · Tag published

Values are code-shaped, so keep them monospace and let them `word-break: break-all`. Never put prose here.

## Section headings

Name the work, not the document furniture. `## What changed` and `## Environment traps` beat `## Summary`
and `## Notes`. The eyebrow underneath carries the qualifier that would otherwise bloat the heading:

    h2       Decisions worth not reversing
    eyebrow  With the reasoning, so they don't get relitigated

    h2       Your turn — one step, plus a check for later
    eyebrow  Browser work; the git proxy cannot do either

Open items are an `<ol>` so they can be referred to by number in the next chat.

## Status colour

Three semantic pairs, each a text colour on a tinted background, used for small state chips only — never as
section backgrounds:

    --done / --done-soft        finished, merged, verified
    --open / --open-soft        waiting, unclaimed, in review
    --blocked / --blocked-soft  blocked, refused, needs a decision

Define every token on bare `:root`, then redefine the same names under
`@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])`, and again under
`:root[data-theme="dark"]`. Give `body` an explicit token background.

## Typography

A serif for headings against a sans for text reads as a document rather than a dashboard; the reference page
uses IBM Plex Serif, IBM Plex Sans and IBM Plex Mono from Google Fonts, which is the one external host a
published artifact may load. Always give each face a real fallback stack. Body text caps around 68ch, the
page around 60rem.

## Things that break the page

- Commands and paths inside `<pre>` need `overflow-x: auto`; the page body must never scroll sideways.
- No `<!doctype>`, `<html>`, `<head>`, or `<body>` tags: the file is wrapped at publish time.
- No external scripts, stylesheets, or images beyond Google Fonts. Inline everything else.
- No download links or script-driven saves: the viewer sandbox makes them inert.
