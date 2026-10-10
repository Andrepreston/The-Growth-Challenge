# Carepatron trials: what goes with paying

Oct 10, 2026 · @Evince

## Summary

Paying goes with two things in the first 14 days: coming back after day 0, and running real client work through Carepatron. The setup actions almost everyone does on day 0 don't separate payers from non-payers.

- **Coming back is the biggest divide.** 45% of trials (235 of 518) never return after day 0, and none of them paid. Practices that came back on days 1–3 went on to pay at 30%, against 5% for those that didn't.
- **Three actions go with paying even after allowing for overall activity:** using the AI scribe, a client booking online, and sending an invoice. Practices that did none paid at 7%; those that did all three paid at 47%.
- **Notes, appointments and templates show no link to paying.** Importing clients looks strong at first, but adds nothing once the three actions above are counted.
- **About a third of payers (24 of 64) did none of the three before paying.** They paid early (median day 3) and look like practices that arrived already decided.

**Confidence:** high that the drop-off and the 'trying it out' pattern are real. Medium on the three actions: they hold up in every check, but with 64 payers the size of each effect is uncertain. All of it is correlation, not proof of cause.

Base: 518 genuine trial workspaces (July–August 2026 signups), 64 paid within 30 days (12.4%).

## Cleaning the data first

34 of the 552 workspaces aren't real practices, and they distort the very signals this question is about. I removed them before any analysis.

| Removed | Workspaces | How identified | What it would distort |
| --- | --- | --- | --- |
| Phishing / spam accounts | 25 | Brand-impersonating names with digit swaps ("N0rton Billing", "Dep0p Help Desk", "Vinted Payments Team"); generic help@/secure@ addresses on throwaway domains; zero notes, appointments, templates or scribe use; all activity stops after about 63 hours | They produce 88% of all client imports (947 of 1,075) and 85% of portal invites (1,311 of 1,544). Counting events, importing looks like a non-payer behaviour. Counting practices, it dilutes the import signal from 38% to 30% conversion. |
| Internal QA accounts | 9 | "Test Practice", "QA Workspace", "Demo - do not use" on carepatron-staff.example | Each runs the same scripted checklist (invoice, intake form, billing page) and never pays, which drags down the invoice signal. |
| Duplicate event rows | 56 rows | Identical workspace, time, event and properties | Mostly in spam accounts; would inflate event counts. |

A domain-only filter misses 4 of the spam accounts, which sit on a third throwaway domain. A behaviour rule (no clinical activity and 10+ portal invites) catches all 25 and nothing else. This looks like abuse of the client portal to send phishing invites, which is worth passing to trust and safety.

Two rules then applied to every number below:

- **Only the first 14 days.** The trial clock starts at workspace\_created (UTC).
- **Only events before payment.** Practices keep using the product after they pay; 86% of paying practices' billing-page views come after they paid. Counting those would describe what customers do, not what leads to paying.

Two things I checked that turned out fine: local and UTC sign-up times agree for every workspace, and late-August signups weren't cut short (July and August both convert at 12.3–12.4%).

## What goes with paying

Practices that run real client work through Carepatron pay at about three times the rate of those that don't.

&#91;embedded content: trials.csv + events.csv, cleaned: 518 workspaces, 64 paid · events in days 0-14 before payment\]

Three actions hold up after allowing for how active a practice was: using the AI scribe, a client booking online, and sending an invoice. Taken one at a time, each goes with 2.4–2.8 times the odds of paying. They also add up: practices that did none paid at 7%, one at 13%, two at 27%, and all three at 47% (19 practices).

What they share is real work: a real session written up, a real client booking in, a real bill going out. The AI scribe matters most for a journey. 179 practices used it, three times as many as booked or invoiced, and it can happen early. Among practices that hadn't paid by day 3, those that had used the scribe by then went on to pay at 29%, against 7%.

## What doesn't go with paying

The actions you can take in an empty account show no link to paying once overall activity is allowed for. Writing a note, creating an appointment and opening a template are done by 68–75% of trials, so nearly everyone "tries it out". These are also exactly what the 235 day-0 leavers did before disappearing: a median of 3 events, almost all appointments, notes, templates and hand-added clients.

Two signals that look strong at first don't hold up:

- **Importing clients.** 28% of importers paid against 10% of non-importers. But importers are usually doing the three key actions as well, and once those are counted, importing adds nothing (odds ratio 0.98).
- **Video calls.** The raw gap is similar, but it isn't distinguishable from chance once activity is allowed for (odds ratio 2.0, interval 0.9–4.6). There are only 51 such practices, so this may be a real signal too small to detect here.

Two actions lean the other way: practices that invited a team member (32) or had a reminder go to a client (68) paid slightly less often. Neither is statistically meaningful. It fits teams of 2–5 converting less than solo practitioners (7% vs 13%), which may simply mean bigger practices take longer to decide than a 30-day window allows.

## The biggest gap: coming back after day 0

The largest group a journey can reach is the 45% of trials that never come back after their first day. None of those 235 practices paid.

&#91;embedded content: events.csv, cleaned: 518 workspaces · any event after workspace\_created\]

Coming back early is the clearest divide in the data. Among the 505 practices that hadn't paid by day 3, the 110 that returned on days 1–3 went on to pay at 30% (95% interval 22–39%). The 395 that didn't paid at 5% (3–7%). Two-thirds of those later payers (33 of 51) had come back in that window.

The day-0 leavers didn't fail to start: they set up appointments, wrote a note, opened templates and added a client by hand. Only 1 of the 235 tried the scribe, took a booking or sent an invoice. They tried the empty-account features and never reached one that touches real client work.

This is partly circular: keen practices both return and pay. And the leavers can't be singled out early. At the end of day 0, practices that never return look just like those that come back later: about 3 actions, about 100 minutes, and none has tried the scribe. What does differ is timing. Practices whose first return comes on days 1–4 pay at about 33%; those whose first return comes after day 4 pay at 8%. The real target is everyone who hasn't come back, with a reason to return by day 4.

## What this doesn't explain

**About a third of payers arrived already decided.** 24 of the 64 paid without using the scribe, taking an online booking or sending an invoice first. They paid fast (median day 3, against day 15 for the other payers) after only about 4 events. A lifecycle journey has little to do for this group; its job is the undecided majority.

**Correlation, not cause.** A practice with real clients can take bookings and send invoices; one without real clients can't. So these actions partly mark practices that were always going to pay. Pushing someone to send an invoice won't by itself make them pay. Only a holdout test can show how much of the gap a journey can actually close.

**Paying often happens after the trial.** 20 of 64 payers paid after day 14, so the 14-day window doesn't capture everything that happened before they decided.

**The GB and Canada gap.** UK and Canadian practices convert at about 2% (1 of 48 and 1 of 45), against 15% in the US (55 of 357). It isn't an engagement gap: UK practices use the AI scribe more than US ones (40% vs 36%). Seven UK and Canadian practices opened the billing page at some point and none paid, against 43% of US practices that opened it. That points to pricing, currency or checkout rather than onboarding, but 7 practices is far too few to conclude anything.

## How confident I am

| Finding | Confidence | Why |
| --- | --- | --- |
| 34 workspaces are spam or QA and must be removed | High | Names, emails and behaviour all agree; no overlap with real practices |
| 45% never return after day 0, and none of them pay | High | A large group with a zero conversion rate; no statistics needed |
| Returning on days 1–3 goes with paying (30% vs 5%) | High that the link exists | Very large gap; but partly circular, since keen practices do both |
| Notes, appointments and templates don't separate payers | High | Done by most trials, no link after allowing for activity |
| AI scribe, online bookings and invoices go with paying | Medium | Holds in both months separately, with duplicate sign-ups removed and with day-0 payers removed. But the intervals are wide, and across the 13 actions tested they are borderline once both activity and multiple testing are allowed for |
| Importing clients matters on its own | Low | Adds nothing once the three actions are counted |
| The GB/Canada gap is about pricing or checkout | Low | Real gap, plausible cause, tiny numbers |

What I'd check next with real data:

1. Run the analysis on a larger cohort, so the three key actions can be measured precisely rather than just detected.
2. Look at session-level behaviour: did scribe users run it on a real session, or test it on a dummy?
3. Test cause directly with a holdout group in the journey (see the plan).
4. Pull GB/Canada checkout logs to see where those practices drop out.

## Method notes

- **Population:** 518 workspaces after removing 25 spam and 9 QA accounts. Outcome = paid\_within\_30\_days. 64 paid.
- **Window:** events from workspace\_created to day 14, and before paid\_at\_utc for payers. "Did X" = did it at least once in that window.
- **Conversion rates:** shown with 95% Wilson intervals.
- **Raw comparison:** Fisher's exact test for each action, with Benjamini–Hochberg correction across the 13 actions tested.
- **Allowing for activity:** logistic regression of paying on each action plus the number of distinct active days. A joint model with the scribe, online bookings, invoices, video calls, imports and active days gives odds ratios of 2.9 (1.2–6.8), 3.1 (1.3–7.5) and 2.7 (1.2–6.2) for the three key actions; imports 0.98.
- **Day 1–3 return analysis:** restricted to the 505 practices that hadn't paid by day 3, so returning always comes before the outcome.
- **Robustness checks:**
  - July and August signups analysed separately.
  - 12 duplicate sign-ups (same email twice within 2 days) collapsed to one each.
  - The 7 practices that paid within 24 hours removed.
  - All three key actions show a clear gap in both months (scribe 20% vs 9% in July, 24% vs 6% in August). In the other two checks they keep odds ratios of 2.6–3.3, all p < 0.03.
- **Tools:** Python (pandas, SciPy, statsmodels). The data is fictional, supplied by Carepatron for this exercise.
