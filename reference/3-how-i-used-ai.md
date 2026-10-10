# How I used AI

I used Claude for most of the hands-on work: the analysis code, first drafts, charts and the tool. I steered it with deliberately structured prompts and checked its work two ways: with prompts designed to probe and validate its findings, and by hand. The checking is where most of the value came from.

## Tools

| Tool | What I used it for |
| --- | --- |
| Claude (Opus 5.5, in the Claude app) | Planning, the data analysis (it wrote and ran Python: pandas, SciPy, statsmodels), first drafts of the findings, journey and email, and building the tool |
| Claude Docs | This document and its charts |
| Claude artifacts | Hosting [Open Slot](https://claude.ai/artifact/BKYJCFQ2LQ1A6KhPFHytpS), the booking-link kit |

Every number in the findings comes from code run on the supplied CSVs, not from the model's memory, so each one can be re-run and checked.

## How I prompted and checked

**Structured prompts.** Each request set out the task, the context and the files, and said what I wanted back. I asked for a plan first and reviewed it before any analysis or building started, so I could redirect early rather than fix a finished product.

**Probing prompts.** Once there were findings, I used prompts aimed at breaking them rather than polishing them:

- "Play devil's advocate: try to prove yourself wrong, or validate the finding by being unable to."
- "Are these spam accounts really spam?"
- "Is there a better option for the tool?"
- Asking for its opinion on design choices, such as whether the journey should use more than one trigger, which made it test its own assumptions against the data.

**Manual validation.** I didn't take outputs on trust. I reviewed the accounts it flagged, checked that figures matched across the findings, journey and charts, and checked claims about Carepatron's product against Carepatron's own pages. Each finding, and the tool itself, was checked before I signed it off.

The catches below came out of this process.

## Where it got something wrong

The AI's first pass found that practices that imported their clients paid at 36%, against 7% for those that didn't. On the strength of that, it recommended the free tool should be a client-list converter: upload an export from your old system, get a file ready to import.

Both the number and the recommendation were wrong.

- **The number used the wrong window.** It counted imports across all 30 days, including after practices had paid, when the question is what happens in the first 14 days before paying. Re-run correctly, the gap was 28% vs 10%. Once the AI scribe, online bookings and invoices were included, importing added nothing on its own (odds ratio 0.98). Importers were usually doing those other things too.
- **The tool already exists.** Carepatron's help centre shows a built-in "Import from another platform" option that handles SimplePractice exports and spreadsheets.

**How I noticed.** Before building anything, I asked the AI to play devil's advocate: try to prove its own findings wrong, test whether the spam accounts were really spam, and look for a better tool idea. Re-running each signal with the stated rules and controls exposed the import result. Checking Carepatron's own help pages exposed the duplicate. Neither check took long, and neither would have happened if I'd accepted the first confident answer.

**What it changed.** Without that step I'd have built a weaker copy of an existing feature, aimed at a lever the data doesn't support. Instead the tool became Open Slot, which targets online bookings, one of the three signals that survived every check.

## Smaller catches

- **The spam filter missed some.** The AI first flagged spam accounts by email domain, which caught 21. The same devil's-advocate pass found 4 more with identical names and behaviour on a third throwaway domain. A rule based on behaviour (no clinical activity, 10 or more portal invites) catches all 25 and nothing else.
- **The journey trigger wasn't targeted.** The first design entered practices with no activity 20 hours after sign-up, meant to reach the 45% who leave on day 0. When I asked whether the journey should use more than one trigger, a check on return timing showed it would catch 86% of trials, because the typical practice doesn't come back until about day 2.6. Leavers and later returners look identical at the end of day 0. The design moved to steps triggered by what each practice does.
- **The tool had two small bugs.** A new service defaulted to 50 minutes, so a "15-minute intro call" read "50 minutes", and a zero fee printed "$0" instead of "free". Testing it with awkward inputs caught both before I shared it.

## What I took from it

- **The AI is fastest exactly where it's riskiest.** It produced a confident number, and a sensible-sounding plan built on it, within minutes. The errors sat underneath, in definitions: which time window, which accounts count, before or after payment.
- **The most useful prompt was asking it to disprove its own work.** Every catch above came from questioning an answer rather than from the first pass. Next time I'd build that step in from the start, and agree the definitions before looking at any results.
- **Checking against the real world matters as much as checking the maths.** The duplicate-feature problem wasn't in the data at all. It took looking at Carepatron's own product to see it.
