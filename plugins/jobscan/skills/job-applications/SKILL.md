---
name: job-applications
description: >-
  Job-application co-pilot: assess fit for a posting, map the employer's core competencies to the user's
  strongest evidence, and draft tailored resumes and cover letters (.docx) plus interview prep. Use whenever
  the user is working on a job application — evaluating a posting, deciding "should I apply", tailoring a
  resume/CV, drafting or revising a cover letter, translating academic background into industry language,
  doing an honest gap/fit analysis, extracting ATS keywords, or prepping STAR stories. Companion to
  job-search.
---

# Job Applications

Make applications **strategic before they're well-written.** Never open a blank résumé and summarize a career
top-to-bottom. Start from the employer's needs, map them to real evidence, and build the documents around that
map. Watch the failure mode where every application collapses back into one narrow identity when the user's
real value is broader than their headline discipline.

## Reference files

**Resolve paths first.** Read the config at the fixed location **`~/.claude/jobscan-data/jobscan-config.md`**
for `data_path` and `archive_path`; `<jobscan-data>` and `<archive>` below mean those values. If it's
missing, tell the user to run **`jobscan-onboarding`** first. The methodology files (`references/…`) ship
with the plugin; the user's personal files live at `<jobscan-data>/`.

- **`<jobscan-data>/profile-core.md`** — compressed ~1-page profile digest. **Read this by default** at the
  start of any task; it holds what fit assessment and competency mapping need.
- **`<jobscan-data>/profile.md`** — full master profile and **single source of truth**. Open only when the
  digest lacks a specific detail. When you add a new fact, add it here, then follow the "Propagation on edit"
  note at its top to refresh the derivatives.
- **`<jobscan-data>/base-resumes/`** — per-tier base résumés with stable content filled and `⟪TAILOR⟫` slots.
  **Start résumé drafting from the right base and edit only the slots.** Academic roles use the full CV.
- **`<jobscan-data>/cover-letter-voice.md`** — the user's reverse-engineered voice. Read before any cover
  letter.
- **`references/resume-formats-and-ats.md`** — length/emphasis by sector + ATS-safe formatting rules.
- **`references/writing-playbook.md`** — drafting mechanics (quantify-first, compression, STAR, keywords).

## Token-efficient drafting (STANDING RULE)

Optimize the process, never the output. Read each reference once per task and reuse it across the batch;
never re-read a file already in context. Reuse the structured job summary from `job-search` rather than
re-fetching the posting — except at the pre-draft gate, which always re-loads the posting live. **That gate
load is one load, and it does both jobs**: it confirms the posting is open *and* it is the copy you
deconstruct in step 1 and save as `Job Posting.md`. Verifying first and fetching again for the detail pays
twice for one page, and it is the likeliest place in this skill to do so, because a listing that arrived
`NOT-CHECKED` has no stored summary to reuse and the gate is where its first real read happens.
**Edit, don't regenerate:** preserve formatting, education, publications, awards, dates, and employer info
verbatim; only rewrite the professional summary, selected bullets, skills ordering, and project emphasis.
Write the cover letter from the tailored résumé + summary; reload the profile only if a fact is missing. This
never overrides the fit assessment, competency mapping, or honest gap-naming below — those are quality.

## Starting from a scan's handoff

A weekly scan ends by writing `<archive>/Job Search Digests/<YYYY-MM-DD> handoff.md` and telling the user to
open a **new chat** and point at it. That is the normal way this skill is entered, and the reason for the new
chat is cost: the scan's own chat is holding thousands of postings by the time it finishes, and drafting
there pays for the whole scan again.

So when a session opens with a handoff path: read that file, and the digest it names, and nothing else from
the scan. Give the user the ranked list as the handoff has it, ask which ones they want, and go. The handoff
is a summary of a run nobody is going to re-execute — every posting in it still goes through the pre-draft
gate below, because a listing verified on Monday can be closed by Thursday, and a `NOT-CHECKED` row was never
confirmed open in the first place.

## The core workflow

1. **Deconstruct the posting.** Identify the 5–8 core competencies the employer is really hiring for, a rough
   weighting (adjust to the posting), and the exact language (verbs, named tools, certifications, regulatory
   terms).
2. **Fit assessment (go/no-go).** Approx % of quals met, strongest evidence, weakest/biggest gaps and whether
   each is *likely fatal* (a missing "preferred" rarely is; a hard required credential often is). Verdict:
   apply / apply-with-caveats / skip. Talk the user out of weak reaches.
3. **Competency → evidence map (the heart).** For each competency, pull the single strongest piece of evidence
   from the profile. Evidence over chronology; one strong item beats three weak ones; infer transferable/
   hidden skills; every claim gets concrete evidence; name the gaps.
4. **Draft the résumé.** Pick the tier/length (`resume-formats-and-ats.md`), **open the matching base résumé
   and edit only its `⟪TAILOR⟫` slots** (academic → full CV). Reorder bullets by relevance, lead with
   numbers, compress ruthlessly, translate to the target sector's language.
5. **Draft the cover letter.** In the user's voice (`cover-letter-voice.md`), structured around the employer's
   priority order from step 1, each paragraph anchored to mapped evidence and a number. Fold honest gap
   framing in where it helps.
6. **Interview prep (offer it).** Convert key mapped bullets into STAR stories for the competencies the
   employer cares about.

## Output & filing

Draft/iterate in Markdown, then produce an **ATS-safe `.docx`** with the `docx` skill — see
`references/docx-generation.md` for the single-column, standard-heading rules, the no-install fallback, and
how the user turns it into a PDF from Word or Pages when a portal demands one. Never ask the user to install
a converter or pick a conversion path. File each application as
a numbered folder `<archive>/<N> <Job Title>/` (N = highest existing + 1, ignore year folders) containing the
résumé, cover letter, `Job Posting.md`, `NOTES.txt`, and (only for no-sponsorship ideal fits) an outreach
email. **Then append one row to `<archive>/Applied Index.md`** (`N | Employer | Role | Status | Filed | Fit`)
— the dedup source of truth the scan reads instead of reopening folders.

## Keeping the profile alive

Whenever an application surfaces a new accomplishment, metric, or phrasing that worked, add it to
`<jobscan-data>/profile.md`, then follow its "Propagation on edit" note to refresh only the touched
derivatives (the digest always; base résumés if stable content changed). This is what compounds the system.
