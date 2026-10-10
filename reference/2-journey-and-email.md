# The day-0 comeback journey

Give every new practice that hasn't come back a reason to return by day 4, and make that reason a piece of real client work.

## At a glance

&#91;embedded content: day-0 comeback journey · 1 entry, 3 emails, 1 in-app step, 50/50 holdout\]

Everyone who hasn't come back by 24 hours enters, half of them into a holdout group. After Email 1, nothing is sent on a fixed schedule except the day-4 nudge: each step waits for the practice to log in or use the scribe.

## Each step

One entry trigger, then steps that react to what the practice does. No more than three emails.

| Step | Trigger | Channel | What they get | Who |
| --- | --- | --- | --- | --- |
| Entry | 24 hours after sign-up | (none) | Enters the journey; 50% go to the holdout group (see below) | Hasn't come back, hasn't used the scribe, taken a booking or sent an invoice, hasn't paid, isn't flagged by the spam rule. About 85% of new trials (438 of 518). |
| 1 | Entering the journey | Email | **"Your next session, written up for you."** Turn on the AI scribe in your next session, or try it on a 2-minute sample recording. | Everyone who enters |
| 2 | Logs back in | In-app | One card in the calendar or notes view, not a checklist. Scribe not used yet: "Record your next session". Already used: "Share your booking link". | Anyone in the journey who returns |
| 3 | First AI scribe use | Email, the next morning | **"Let clients book themselves."** Links to the booking-link kit: copy for their directory profile, email signature and bio, plus a QR code. | Practices that used the scribe but haven't had an online booking |
| 4 | Still no return at day 4 | Email | A short plain-text note from a named person: "Is anything stopping you from trying it on one session this week?" Replies go to a real inbox. | Practices that haven't logged back in |
| Exit: success | A client books online, or an invoice is sent | (none) | Journey stops; standard onboarding continues |  |
| Exit: other | Pays, unsubscribes, trips the spam rule, or reaches day 14 | (none) | Journey stops |  |

Why the scribe comes first:

- It's the strongest of the three actions that are still visible early: practices that used it by day 3 went on to pay at 29%, against 7%.
- It reaches the most practices: 179 used it, three times as many as booked online or invoiced.
- It needs no setup and no new clients, just the next session the therapist already has booked.
- No one used it in their first session, so it's a natural reason for a second visit.

Why day 4 is the last nudge: practices whose first return comes after day 4 pay at 8%, so later emails mostly add noise.

Send times: every email goes at 10 minutes to the hour in the practice's local time, between 9am and 5pm on a weekday, when a session has just ended.

## How we'd know it worked

Randomise at entry and compare against a holdout group that gets standard onboarding only. The findings are correlational, so only a holdout can show how much of the gap the journey actually closes.

| Measure | Role | Baseline in this data | Entrants needed (50/50 split) |
| --- | --- | --- | --- |
| Did the scribe, an online booking or an invoice by day 7 | Primary: decide on this | 25.6% | About 1,000 to detect +8 points |
| Came back by day 4 | Secondary: did the reason to return land? | 25.8% | About 1,000 to detect +8 points |
| Paid within 30 days | Secondary: the business outcome | 9.6% | About 3,400 to detect +3 points |
| Unsubscribes, spam complaints, consent-related support tickets | Guardrails | (to set) | Watched weekly |

**Why 50/50 at first:** about 220 practices a month would enter at this dataset's volume, so an 80/20 split would take over 7 months to read the primary measure; 50/50 takes about 4–5. At Carepatron's real volume both are faster. Once the result is in, keep a permanent 10% holdout so the effect can be re-checked as the product changes.

**Step-level checks:** these read in weeks and show where it breaks.

- Email 1 click, then scribe use within 48 hours.
- In-app card click rate.
- Email 2 click, then a first online booking.

**Decision rule:** keep it if the primary measure rises by 5 points or more and the guardrails hold. If returns rise but key actions don't, the email works and the in-app step after it doesn't, so fix that step before adding more messages.

## Email 1

Written for a solo therapist reading on their phone in the ten minutes between clients: one idea, one button, about 80 words.

**Subject lines to test**

- A: Your next session, written up for you
- B: Skip tonight's notes

**Preview text:** Press record, then edit a draft instead of starting from a blank page.

---

Hi {first\_name},

You set up {practice\_name} yesterday. Here's one thing worth trying before your week fills up.

In your next session, get your client's OK and turn on the AI scribe. When you finish, a draft progress note is waiting. You check it, tweak it and sign it, instead of writing it from scratch at 9pm.

No session today? Try it on a 2-minute sample recording.

**\[Try it on my next session\]**

Andre, Carepatron

P.S. Your trial runs until {trial\_end\_date}.

---

**Choices behind it**

- **One action.** The button opens the scribe ready to record, not a dashboard.
- **"Get your client's OK".** Recording a therapy session needs consent, and therapists know it. Saying so first builds trust; skipping it would read as careless.
- **"At 9pm".** Late-night notes are the pain a solo therapist feels, so it's the benefit to lead with, not "AI".
- **The sample recording.** It removes the "no session today" excuse, so anyone can see the result within minutes.
- **No unsupported claims.** About a third of trials use the scribe, so the email doesn't say "most therapists".
- **Sent from a named person, in plain text, at 10 minutes to the hour local time.** It's built to be opened between sessions. The sign-off is a stand-in; a real send would come from Carepatron's onboarding lead.

## What it leaves out, on purpose

- **Practices that come back but stay shallow.** They get only the in-app card here. They're the next journey I'd build, triggered by a second session that ends without any of the three key actions.
- **Practices that arrive already decided.** About a third of payers paid by around day 3 without the key actions. The journey exits them at payment and doesn't try to speed them up.
- **UK and Canadian practices.** Their gap looks like pricing or checkout, which no email fixes. I'd look at the checkout funnel before writing anything for them.
- **Separate journeys for each feature.** One entry point with one holdout keeps the result readable. Splitting by feature would make it impossible to tell which message worked.
