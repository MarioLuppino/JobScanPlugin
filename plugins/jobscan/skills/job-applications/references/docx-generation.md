# Producing the Word file

Draft and iterate in Markdown — it's fast to edit in chat — then produce the finished **`.docx`**. The user
opens it in **Microsoft Word or Apple Pages**. Nothing else is needed and nothing has to be installed: no
converters, no command-line tools, no programming languages.

## 1. Make the file with the `docx` skill (default)

The Claude `docx` skill ships with Claude Code. Hand it the finalized Markdown and ask for a single-column
Word file with standard headings. Save it straight into the application's numbered folder.

Respect the **minimum font size** the user set at onboarding. If they didn't set one, use 11 pt body text
(10.5 pt is the floor worth going to when a page is nearly full — below that, print becomes hard to read and
some human screeners bounce it).

## 2. If the `docx` skill isn't available — the paste-in path

Don't reach for a converter or ask the user to install one. Give them the résumé as clean text and these
steps. It takes about two minutes and works identically for a first résumé or a tailored one.

**In Word:** new blank document → paste the text → select all → set the font (Calibri, Arial, or Helvetica)
and size → Layout → Margins → Normal (1 inch) → apply **Heading 2** to each section title from the Home
ribbon's style gallery → File → Save As → **Word Document (.docx)**.

**In Pages:** new Blank document → paste the text → select all → set font and size in the Format sidebar →
Document → Margins → 1 inch → apply the **Heading** paragraph style to each section title → File → **Export
To → Word**.

Tell the user exactly which lines are section headings rather than making them guess.

## 3. When the portal demands a PDF

Convert inside the app they already have — never a web converter, which puts a private résumé on someone
else's server:

- **Word:** File → Save As → PDF *(on Windows: File → Export → Create PDF/XPS)*.
- **Pages:** File → Export To → PDF.

Both produce a text-based PDF that applicant tracking systems can read. Do **not** produce the PDF by
scanning or photographing a printout — that PDF has no text layer and most ATS parsers score it as empty.

## The Pages trap — worth warning the user about once

Pages opens a `.docx` fine, but **saving in Pages produces a `.pages` file, which almost no employer can
open.** If the user edits a packet in Pages, they must finish with **File → Export To → Word** before
submitting, and keep the `.docx` as the copy in the application folder. Say this the first time a Mac user
edits a packet, not every time.

## If the user edits the file themselves

Encourage it — they know their own history best. Ask them to say what they changed, so the same fix reaches
`profile.md` and the tier's base résumé instead of being lost at the next tailoring pass. A correction that
lives only in one submitted packet will be re-introduced as an error next week.

## The ATS rules, whichever path made the file

Single column · standard headings (Summary, Skills, Professional Experience, Education, Certifications,
Publications) · black text · simple round bullets · no tables, text boxes, columns, or graphics holding
content that must be parsed · name and contact details in the body, never in the header or footer · submit
`.docx` unless the posting requires PDF.
