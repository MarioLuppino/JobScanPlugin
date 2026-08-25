# Session handoffs

Working continuity for whoever picks a piece of work back up: what is still open, what was decided, what
already cost someone an afternoon. Written by the `handoff` skill (`../skills/handoff/`), one plain Markdown
file per thread of work, named `<topic-slug>.md`.

Nothing here ships with the plugin and nothing here describes how JobScan works. For that, read
[`../../README.md`](../../README.md) or [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).

A handoff is rewritten in place, not appended to, and it is deleted in the commit that finishes the work it
carries. If this directory holds nothing but this file, everything is finished, which is the intended
resting state.
