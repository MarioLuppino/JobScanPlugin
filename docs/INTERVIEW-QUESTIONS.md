# What the setup interview asks

JobScan starts with a one-time setup interview. Claude asks about your background, what you're looking for,
and where to keep your files — then writes your candidate profile, your résumé starting points, and your
search settings for you. **This page lists every question, so you can see what you're signing up for before
you install anything.**

You don't fill in a form and you don't edit any files. Claude asks conversationally, a few questions at a
time, and you answer in ordinary sentences.

## Before you start

- **Set aside a real block of time.** There are 44 questions across nine areas.
- **Have your CV or résumé open**, along with anything that has numbers in it: grant amounts, your
  publication list, how many people you've supervised, audience sizes, award amounts.
- **Dig up a cover letter or two that actually landed an interview**, if you have any. They're the best raw
  material for teaching the system to write in your own voice.
- **Decide your salary floor before you're asked.** It becomes a hard limit — jobs below it get filtered out
  rather than shown to you and argued about later.

## Where your answers go

Your answers become files **on your own computer**, in a folder you choose during the interview (the default
is `~/.claude/jobscan-data/`) plus an archive folder for your applications. None of it is uploaded to this
project, and the project is set up to refuse to commit it even if you're running from a copy of this repo.
Your answers do pass through Claude while you're talking to it, exactly like anything else you type into a
chat — what stays local is the profile, the résumés, and the record of where you've applied.

## If you don't have an answer

Skip it and say so. A thinner answer just means a thinner section of your profile, and you can add to it
later. Nothing is invented on your behalf: when an answer is missing a number that matters, Claude asks you a
follow-up instead of filling in a plausible-sounding one.

---

## 1. You, your positioning, and your limits

*Sets what every application says about you, and the boundaries the scanner won't cross.*

1. Your name, city and state (or country), email, phone, LinkedIn, and any personal, portfolio, or lab site.
2. Your current title and employer, and where you are in your career — grad student, postdoc, early-career,
   established and pivoting, something else.
3. In a sentence or two: how do you want to be seen? What should come through in every application?
4. What should applications *not* reduce you to — the too-narrow label that undersells what you actually
   bring?
5. Work authorization: are you a citizen or permanent resident, on a visa, or would you need sponsorship
   anywhere?
6. Are there countries or regions you'd move to even without work authorization, if an employer sponsored
   you?
7. Location preferences — urban or rural, political climate, regions to prioritize or avoid. Do remote jobs
   get an exception?
8. Salary: the lowest you'd genuinely accept, your target range, and a higher floor if the job requires
   relocating.
9. For government jobs, is there a minimum grade or pay band worth respecting?
10. Any role types, sectors, or specific employers you never want to see — and why. This becomes your
    "don't show me these" list.

## 2. Your headline accomplishments — bring numbers

*These become the quantified anchors that appear near the top of every résumé and letter.*

11. Total grant or other funding you've secured, and the single largest award: amount, funder, project, and
    what your role was.
12. The biggest projects or programs you've led, and their scale — samples, sites, datasets, years,
    partner organizations.
13. People you've supervised or mentored: how many, for how long, doing what.
14. Publications: how many total, with published (has a DOI) kept separate from in review. Do you want the
    standing rule that in-review work is never listed as published? (Recommended: yes.)
15. Talks, presentations, and outreach: how many, audience sizes, languages, any standout numbers.
16. Awards, scholarships, and honors, including amounts or how competitive they were.
17. Certifications and licenses relevant to your field.

## 3. What you can actually do

*Becomes your skills inventory and the keyword bank that gets matched against postings.*

18. Technical or lab skills, and the tools and instruments you use.
19. Data and analysis tools — R, Python, pipelines, statistics, GIS — and honestly, which are real strengths
    versus which you'd need to ramp up on.
20. Hands-on experience with generative AI or large language models: which tools, and what you used them for.
21. Project and program management: budgets, grant administration, leading teams, writing protocols.
22. Regulatory and compliance work: permits, biosafety, import/export, licensing.
23. Communication, teaching, and outreach — and any languages you work in.
24. "Hidden" skills from jobs outside your field that are worth reframing rather than leaving off.

## 4. Your jobs

*The experience section, plus the earlier work most people wrongly delete.*

25. Each position, most recent first: title, employer, location, dates, and three to six bullets with
    numbers in them.
26. Earlier or non-academic jobs worth keeping because they prove something transferable.

## 5. Leadership, service, and explaining your work

*Often the most undersold material, and the part that decides whether a recruiter outside your field
understands you.*

27. Elected or appointed positions, committees, professional society involvement.
28. Any negotiation, bargaining, or advocacy experience.
29. How do you describe your dissertation or postdoc now — and how should it read to a recruiter who isn't a
    specialist?
30. Which terms from your field need plain-language translation, and which should stay as-is because the jobs
    you want expect them?

## 6. What's worked before, and how you write

*Used to build the voice file, so drafts sound like you rather than like a template.*

31. Past applications, interviews, or offers that went well — what specifically worked?
32. Do you have real cover letters or interview transcripts that landed well? (Best raw material there is.)
33. Interview questions you've been asked that revealed what employers were really screening for.
34. Writing preferences: tone, how long your sentences run, phrasings you like and phrasings you hate, any
    hard "never do this" rules, and a minimum font size if you have one.

## 7. What the scanner should look for

*Turns into the actual weekly search.*

35. The job titles and sectors you're aiming for.
36. Search keywords from your field — and flag any pairs where searching one term doesn't surface the other,
    so both get searched.
37. How far the search should reach: which states, international regions, remote-only? Any split you want
    between domestic and international results?
38. Adjacent sectors to screen out so they stop cluttering your results.

## 8. Interview stories

*Turned into structured answers you can practice from.*

39. Three to five true stories: a success, a failure you learned from, a conflict you resolved, a time you
    mentored someone, and a time you explained something technical to a non-expert.

## 9. Your computer setup

*The only questions about software. Claude checks what you already have, then walks you through installing
anything missing with the exact commands for your operating system — you copy and paste them.*

40. Which Claude are you using — the Claude Code command line, the desktop app, or the website?
41. Do you have a Firecrawl key? It makes government job portals cheaper to read, and there's a built-in
    fallback if you don't.
42. Can Claude open a browser on your machine, for job sites that need one?
43. How should Word documents get made on your computer? (Any working path is fine — Pandoc, the Claude
    `docx` skill, R's `officer`, or Word and Google Docs by hand.)
44. Which folder should applications, digests, and your applied-index live in — and do you want the search to
    run automatically every week?

---

## What you get at the end

- **Your profile** — the long-form source of truth, plus a compressed one-page version the system reads on
  every run to keep costs down.
- **Base résumés** — starting points for industry, federal, and state-agency applications, filled with your
  stable content and marked where each application needs tailoring.
- **A voice file** — how you write, so cover-letter drafts don't sound generic.
- **Your archive** — an applied-index so nothing gets applied to twice, a list of roles you looked at and
  passed on, and a folder for weekly digests. If you're claiming unemployment benefits, a work-search log too.

Then you type **"run my weekly job search"** and the system starts finding jobs.

## For maintainers

This page is the reader-facing version of
[`intake-questionnaire.md`](../plugins/jobscan/skills/jobscan-onboarding/references/intake-questionnaire.md),
which is what the onboarding skill actually works from. Change one and change the other.
