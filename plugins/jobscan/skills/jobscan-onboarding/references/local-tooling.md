# Local tooling — what *you* install, and what the user never touches

**Principle: prefer a free local tool over a metered remote service for anything on the user's own disk.**

Job searching generates a lot of local documents — saved postings, offer letters, résumés, scanned forms —
and it is easy to burn a paid API on files sitting on a hard drive. That is a real mistake this project
made: an agent hit a scanned PDF, found no local PDF renderer, and spent credits from a limited pool on a
remote OCR service instead of installing a free tool in two minutes. Metered calls are for *the web*. Local
files are handled locally.

## Rule zero: you run these commands, not the user

Assume the user has never opened a terminal and does not want to start now. **Do not paste a command at
them and wait.** Run it yourself, report what happened in one sentence, and move on.

The only time a command goes to the user is when it genuinely cannot be run for them — an installer needing
an administrator password, or a GUI prompt. Then hand over **one** line, say plainly what it does and why,
and offer to skip it instead. "Skip it" must always be a real option: everything below is optional, and the
system works without all of it.

Never make the user choose between tools, edit a config file, or interpret an error message. If an install
fails, say what stopped working in ordinary words ("I couldn't install the PDF reader, so scanned documents
will cost a little to read — want me to try again or move on?") and continue.

## What's worth installing

| Tool | What it buys | Windows | macOS | Debian/Ubuntu |
|---|---|---|---|---|
| **Poppler** | Reads PDFs on disk for free | `winget install oschwartz10612.Poppler` | `brew install poppler` | `sudo apt install poppler-utils` |
| **Tesseract** | Reads scanned/image-only PDFs | `winget install UB-Mannheim.TesseractOCR` | `brew install tesseract` | `sudo apt install tesseract-ocr` |
| **Node.js** | Runs the fast ATS scanner | `winget install OpenJS.NodeJS.LTS` | `brew install node` | see the note below — apt alone is not enough on older releases |

**Poppler is the highest-value install.** Two binaries matter: `pdftotext` extracts text from any PDF that
has a text layer, and `pdftoppm` renders pages to images so you can *look at* a page that has none. Without
it, scanned documents are unreadable locally and the fallback is a paid OCR service.

**Tesseract** turns image-only PDFs into text offline. In one real application archive, **half the PDFs had
no text layer at all** — emailed offer letters, agency forms, postings saved as screenshots.

**Node.js** is needed only for the `scripts/` ATS pipeline (see Step 6 of the skill). That pipeline is a
speed and cost optimization, not a requirement — without it, scanning falls back to web search and the
system still works. Offer it as "a faster, cheaper scan"; if installing Node is friction the user doesn't
want, skip it and say the search will lean on web search instead.

**The scripts need Node v18 or newer, and on Debian/Ubuntu `sudo apt install nodejs` does not give you
that.** Ubuntu 22.04 ships Node 12 under that name, Debian 11 ships Node 12 as well. Node 12 has no global
`fetch`, so every script in the pipeline dies immediately with a `ReferenceError` that looks exactly like a
bug in this plugin. Always check what you actually installed:

```bash
node --version
```

If it is below v18, install the current LTS from NodeSource instead — one command, and it replaces the old
package:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt install -y nodejs
```

That needs the user's password, so it is one of the few lines that legitimately goes to them: say in one
sentence that it installs the current Node.js, and offer to skip the pipeline instead. Recent releases
(Ubuntu 24.04, Debian 12) ship v18+ from plain `apt` and need none of this — which is why you check the
version rather than guessing from the distribution.

**On Windows, restart the terminal — and the editor or agent — after any install.** These installers modify
`PATH`, and an already-running process keeps the old copy. A tool can be correctly installed and still look
missing until a restart. Tell the user this *before* they conclude it failed.

## What not to install

**No document converters.** Word files are produced by the `docx` skill and opened in **Microsoft Word or
Apple Pages**, which the user already has. PDFs come from Word's *Save As → PDF* or Pages' *Export To → PDF*.
Do not install Pandoc or LibreOffice, do not suggest R, and do not ask which conversion path they prefer —
that question was the single most confusing thing in earlier versions of this plugin for anyone who doesn't
code. See the `job-applications` skill's `references/docx-generation.md`.

## Checking a PDF before spending anything on it

This one-liner is the whole decision, and you run it, not the user:

```bash
pdftotext -layout file.pdf - | tr -d '[:space:]' | wc -c
```

- **A few hundred characters or more** → it has a text layer. Extract with `pdftotext`, free.
- **Near zero** → image-only. Render with `pdftoppm` and read it visually, or OCR with Tesseract.
  **Do not send it to a paid service without checking this first.**

Sweep a folder to see what you're dealing with:

```bash
for f in *.pdf; do
  n=$(pdftotext -layout "$f" - 2>/dev/null | tr -d '[:space:]' | wc -c)
  [ "$n" -gt 200 ] && echo "TEXT  $f" || echo "IMAGE $f"
done
```

## Habits that save time

- **Search content, not filenames.** Application folders get named inconsistently; the employer name inside
  the document is reliable. Search file contents for it rather than trusting the folder title.
- **Keep one machine-readable index.** `Applied Index.md` is parsed directly by
  `${CLAUDE_PLUGIN_ROOT}/scripts/dedup.mjs`, far cheaper than opening every folder to check for duplicates.
  The script finds it through `archive_path` in `~/.claude/jobscan-data/jobscan-config.md`. Its first three
  columns are load-bearing: add columns at the end, never reorder them.
- **Name folders so they sort.** A numbered prefix (`101 Role Title`) keeps the archive ordered and makes
  "what number is next" trivial.
- **`.docx` is a zip.** If nothing else can read one, unzip it and pull text from `word/document.xml`.
  Useful as a fallback, ugly as a habit.
- **Watch path length on Windows.** Deep folder trees plus long file names hit the 260-character `MAX_PATH`
  limit. Keeping the archive near the drive root avoids it entirely — worth suggesting when the user picks
  a location.

## The rule this file exists to enforce

Before spending a metered credit, a paid API call, or a rate-limited request on a **local** file, ask
whether a free local tool does the job. Usually one does, and it is faster. Reserve paid tooling for what
genuinely requires the network: fetching live postings, verifying a listing is still open, searching the
open web.
