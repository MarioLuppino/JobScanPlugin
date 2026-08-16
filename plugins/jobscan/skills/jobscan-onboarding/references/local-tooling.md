# Recommended local tooling

**Principle: prefer a free local tool over a metered remote service for anything on your own disk.**

Job searching generates a lot of local documents — saved postings, offer letters, résumés, scanned forms —
and it is easy to burn a paid API on files sitting on your hard drive. That is a real mistake this project
made: an agent hit a scanned PDF, found no local PDF renderer, and spent credits from a limited pool on a
remote OCR service instead of suggesting a free two-minute install. Metered calls are for *the web*. Local
files should be handled locally.

Install these once and the whole routine gets cheaper and faster.

---

## Install commands by platform

Copy the row for **your** operating system. Install instructions that assume Linux are a common source of
confusion: `sudo apt install ...` does nothing on Windows or macOS.

| Tool | Windows (winget) | macOS (Homebrew) | Debian/Ubuntu |
|---|---|---|---|
| **Poppler** (PDF) | `winget install oschwartz10612.Poppler` | `brew install poppler` | `sudo apt install poppler-utils` |
| **Tesseract** (OCR) | `winget install UB-Mannheim.TesseractOCR` | `brew install tesseract` | `sudo apt install tesseract-ocr` |
| **Pandoc** (convert) | `winget install JohnMacFarlane.Pandoc` | `brew install pandoc` | `sudo apt install pandoc` |
| **LibreOffice** (docx→PDF) | `winget install TheDocumentFoundation.LibreOffice` | `brew install --cask libreoffice` | `sudo apt install libreoffice` |
| **jq** (JSON) | `winget install jqlang.jq` | `brew install jq` | `sudo apt install jq` |
| **ripgrep** (search) | `winget install BurntSushi.ripgrep.MSVC` | `brew install ripgrep` | `sudo apt install ripgrep` |
| **Node.js** (required) | `winget install OpenJS.NodeJS.LTS` | `brew install node` | `sudo apt install nodejs` |

**On Windows, restart your terminal — and your editor or agent — after installing.** These installers
modify `PATH`, and an already-running process keeps the old one. A tool can be correctly installed and
still appear missing until you restart.

---

## What each one buys you

**Node.js — required.** The `scripts/` ATS pipeline is Node. Nothing else here is mandatory.

**Poppler — the highest-value install.** Two separate binaries matter:
- `pdftotext` extracts text from PDFs that have a text layer. Free, instant.
- `pdftoppm` renders PDF pages to images, which lets an AI agent *look at* a page that has no text layer.
  Without it, scanned documents are unreadable locally and the agent will reach for a paid OCR service.

**Tesseract — OCR for image-only PDFs.** Many of the documents a job search produces are screenshots or
scans: emailed offer letters, agency forms, job descriptions saved from a portal. In one real archive
**half the PDFs had no text layer at all.** Tesseract turns those into text offline and free.

**Pandoc and LibreOffice — document conversion.** Many application portals demand PDF while your résumé
lives in `.docx`. LibreOffice converts headlessly:
```bash
soffice --headless --convert-to pdf "Resume - Role.docx"
```
Pandoc handles markdown ↔ docx ↔ HTML, useful for drafting in plain text and delivering in Word format.

**jq and ripgrep — quality of life.** `jq` for the JSON the ATS scripts emit; `ripgrep` for fast searching
across an application archive.

---

## Finding and identifying files efficiently

**Check whether a PDF actually contains text before doing anything expensive.** This one-liner is the whole
decision:

```bash
pdftotext -layout file.pdf - | tr -d '[:space:]' | wc -c
```

- **A few hundred characters or more** → it has a text layer. Extract it with `pdftotext`, free.
- **Near zero** → image-only. Render it with `pdftoppm` and read it visually, or OCR it with Tesseract.
  **Do not send it to a paid service without checking this first.**

Sweep a whole folder at once to see what you're dealing with:

```bash
for f in *.pdf; do
  n=$(pdftotext -layout "$f" - 2>/dev/null | tr -d '[:space:]' | wc -c)
  [ "$n" -gt 200 ] && echo "TEXT  $f" || echo "IMAGE $f"
done
```

**Other habits that save time:**

- **Search content, not filenames.** Application folders get named inconsistently; the employer name inside
  the document is more reliable. `rg -il "employer name" .` finds it regardless of the folder title.
- **Keep one machine-readable index.** `Applied Index.md` is parsed directly by `scripts/dedup.mjs`, which
  is far cheaper than opening every folder to check for duplicates. Its first three columns are load-bearing:
  add columns at the end, never reorder them.
- **Name folders so they sort.** A numbered prefix (`101 Role Title`) keeps the archive ordered and makes
  "what number is next" a trivial question.
- **`.docx` is a zip.** If no converter is installed you can still read one: unzip it and pull the text from
  `word/document.xml`. Useful as a fallback, ugly as a habit.
- **Watch path length on Windows.** Deep folder trees plus long file names hit the 260-character `MAX_PATH`
  limit and git checkouts fail with "Filename too long". `git config --global core.longpaths true` fixes
  git; keeping working copies near the drive root avoids it entirely.

---

## The rule this file exists to enforce

Before spending a metered credit, a paid API call, or a rate-limited request on a **local** file, ask
whether a free local tool does the job. Usually one does, and it is faster. Reserve paid tooling for what
genuinely requires the network: fetching live postings, verifying a listing is still open, searching the
open web.
