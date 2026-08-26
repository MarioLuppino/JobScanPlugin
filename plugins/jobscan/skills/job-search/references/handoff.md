# The handoff — the last thing a scan writes

Every finished scan writes two files, not one. The digest is the record of what was found. The handoff is
the instruction for what happens next, and it exists because the next step happens in a **different chat**.

Write it to `<archive>/Job Search Digests/<YYYY-MM-DD> handoff.md`, immediately after the digest is
re-ranked and its `IN PROGRESS` marker dropped. Not later, and not on request: a scan that ends without one
ends with the user holding a file and no sentence to say.

## Why a new chat

A scan is the most expensive thing this system does. By the time it finishes, the chat it ran in is holding
thousands of postings' worth of history that drafting does not need and cannot use. Drafting a packet in
that same chat pays for the whole scan a second time, and hits a limit partway through a cover letter.

So the scan ends and the drafting starts somewhere clean. The handoff is the only thing that crosses over,
which is why it is a file: everything else in the chat is about to be unavailable.

## Say it in chat in two lines, and nothing else

**Never list the findings in the chat the scan ran in.** Not the top three, not a "here's a quick preview",
not the apply links. Every one of those is a second copy of something already on disk, written at the most
expensive moment in the run, into a chat the user is about to leave.

The whole reply is:

```
Digest and handoff written to <archive>/Job Search Digests/.
Open a new chat and paste this: Read "<archive>/Job Search Digests/<YYYY-MM-DD> handoff.md" and start my application packets.
```

Use the folder name the user would recognise, not a resolved absolute path. If something went wrong, one
more line for that, still without listing jobs.

## What goes in it

Plain Markdown. No HTML, no styling, no emoji. It is read by an agent at least as often as by a person.

```markdown
# Job search, week of <YYYY-MM-DD>

Digest: <archive>/Job Search Digests/<YYYY-MM-DD> digest.md
Verified live this run: <n> of <total>. Fit floor: <n>. Weekly quota: <n or none>.

## This week's listings, best first

1. <Title> — <Employer> — <Location> — <Salary> — Fit <score> — <VERIFIED-LIVE|UNVERIFIED|NOT-CHECKED>
   Closes <date>. <One line: why it ranked here.>
   <apply URL>
2. ...

## How to read this list

<The tag and score guidance below, in the user's terms.>

## What to do next

Pick the ones you want to apply to and say so. Each pick is re-checked live before anything is written,
because a posting can close between the scan and now. Then a tailored resume and cover letter are drafted
for it and filed in a numbered folder.

<Deadline note: any listing closing within a week, named.>

## What this scan could not do

<Skipped branches, failed sources, tools unavailable. One line each. Omit the section if there were none.>
```

## The interpretation guidance

The list is ordered, and the order is the finding. Say that plainly, then the three things a user reads
wrong without help:

- **The order is the recommendation.** Rank is fit against the profile, not salary and not prestige. A
  strong listing four rows down is four rows down for a reason worth reading.
- **`VERIFIED-LIVE` means someone opened it this week.** The title, the pay and the open state were read off
  the employer's own page during the scan. `UNVERIFIED` means the page could not be opened, not that the job
  is suspect. `NOT-CHECKED` means it was deliberately left for later: the details come from the job board's
  own summary, and its score carries a `~` because a title and a salary line predict fit and often move once
  the real posting is read. All three are worth applying to; only the first has been confirmed open.
- **A score is a comparison, not a verdict.** It ranks these listings against each other for this profile.
  A 68 is not a bad job, and nothing below the fit floor is in the list at all.

Then the two rules that keep the next chat honest, in one line each: nothing gets drafted against a posting
that is not re-confirmed open at that moment, and nothing is ever submitted for the user.

## Size

Aim for one screen plus the list. The digest holds the detail; the handoff points at it. Do not restate a
per-job block here, and do not restate the handoff back into the chat once it is written.
