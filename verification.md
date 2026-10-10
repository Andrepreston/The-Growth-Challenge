# Verification

Every gate in CLAUDE.md §7, run on 2026-10-11 against the local build (`python3 -m http.server 8000`). Gates 1–3 will be re-run against the live site at deploy.

| Gate | Result |
| --- | --- |
| 1. `analysis.py --check` | **Pass.** `OK: data/findings.json matches a fresh run of the analysis.` |
| 2. `verify_site.py index.html assets/js/*.js tool/index.html` | **Pass.** 572 numbers checked, 0 need review. Plus `check_bindings.py`: 303 bindings, 0 problems. |
| 3. Rendered text | **Pass.** 626 numbers at 1440px and 602 at 375px, 0 need review. |
| 4. Claims review | **Pass.** 169 statements mapped to claim IDs (table below), 0 unmapped. Banned-word hits are all negations (below). |
| 5. Visual QA | **Pass, with one item to re-measure live.** No horizontal scroll at 375 / 768 / 1280 / 1440. Reduced motion and keyboard checked. Lighthouse: accessibility 100 on mobile and desktop; performance 97 desktop, 85 mobile locally (see below). |

## Gate 2 · numbers in the source

```
python3 analysis/verify_site.py index.html assets/js/*.js tool/index.html
Checked 572 numbers in 4 file(s): 0 need review.
python3 analysis/check_bindings.py index.html
Checked 303 bindings: 0 problem(s).
```

`analysis/check_bindings.py` is new. `verify_site.py` proves each number on the page exists somewhere in `findings.json`; this script proves each bound number is the right one: every `data-f` path resolves, and its fallback text equals the value as the page's formatter prints it.

**Context numbers added to `CONTEXT_NUMBERS`** (each has a comment in `verify_site.py`):

| Number | Where | Why it isn't a finding |
| --- | --- | --- |
| 01, 02, 03, 04, 05 | Section labels and nav ("01 · Read the data") | The brief's own numbering of the five tasks |
| 0.03 | "all p < 0.03" in "How I checked" | The threshold quoted in claim R2, not a result. The largest of the six p-values is 0.0229. |
| 5.5 | "Claude (Opus 5.5, in the Claude app)" | Model version in the AI tools list |

## Gate 3 · rendered text

Method: headless Chrome driven over the DevTools protocol (Playwright isn't installed), cache disabled, exact viewports. The script scrolls through the whole page so every scroll animation plays, then dumps `document.body.innerText` and runs `verify_site.py --text` on it.

```
1440px: Checked 626 numbers in 1 file(s): 0 need review.
 375px: Checked 602 numbers in 1 file(s): 0 need review.
```

This check caught one real bug, now fixed. In three charts an SVG label and its sub-label had no space between them, so the text read "days 1–3" + "33 of 110" as "1–333". It wasn't visible on screen, but it would have reached screen readers and text extraction.

The standalone tool page (`tool/`) flags three numbers in its rendered text: `$160` (with `$180`) and `113 / 150 characters`. These are Open Slot's example inputs and its live character count, produced from the example details a visitor replaces. They are not findings. They are deliberately not added to `CONTEXT_NUMBERS`, which would weaken the main-page check (and `$180` only passes by coincidence with a rounded finding). The embedded demo sits in an iframe, so its text is not part of the main page's `innerText`.

## Gate 4 · claims and wording

### Banned words

Searched the rendered page, `index.html`, `charts.js` and the rendered tool for: cause (and causes, caused, causal), drive, lead to / led to, boost, increase, "more likely", guarantee, "will convert", "times more likely", "most therapists".

| Hit | Where | Decision |
| --- | --- | --- |
| "none of it proves cause" | 01, beat 6 headline | Keep: it denies causation (X4) |
| "All of this is correlation, not cause." | 01, beat 6 note | Keep: the required correlation note (X4) |
| "doesn't say 'most therapists'" | 03, note 2 | Keep: it explains why the email avoids that claim |

No other hits. The only multiplier on the page is S5's "about three times the rate".

### Every statement that gives a number or a finding

Generated from `index.html` by a script that extracts each visible sentence with a number or a finding word, in page order. Each sentence is mapped to its claim in `content/copy-and-claims.md` (§2 claim IDs, the confidence table, or the approved §4 section copy), plus the `findings.json` keys behind it. Fallback data tables under charts are covered by `check_bindings.py` and are not repeated here. "Rule n" refers to the wording rules in §1.

| # | Section | Sentence on the page | Claim | findings.json key(s) |
| --- | --- | --- | --- | --- |
| 1 | top | Almost half of new practices never come back after their first day. | D1 · §4 Hero headline | dropoff.never_back_after_day0_pct |
| 2 | top | I analysed 518 trial practices from Carepatron's sample data. | C8 · §4 Hero subhead | base.practices |
| 3 | top | Here's what goes with paying, a journey to get more practices there, and a free tool built for one of those moments. | §4 Hero subhead ("helps" softened per plan §6.9) | — |
| 4 | top | Paid within 30 days 64 | C8 | base.paid |
| 5 | top | Never came back after day 0 235 | D1 | dropoff.never_back_after_day0 |
| 6 | top | Each dot is one of the 518 trial practices. | C8 | base.practices |
| 7 | top | Carepatron sample data (fictional). | Rule 5 (hero caption) | — |
| 8 | top | 518 practices analysed, after removing 34 spam and test accounts | C2 · C8 ("spam and test" per plan §6.4) | base.practices, cleaning.removed_total |
| 9 | top | 12.4% paid within 30 days | C8 | base.conversion_pct |
| 10 | top | 45% never came back after day 0 | D1 | dropoff.never_back_after_day0_pct |
| 11 | top | 0 of those 235 practices paid | D1 | dropoff.never_back_after_day0_paid, never_back_after_day0 |
| 12 | top | 3 actions still linked to paying after allowing for activity | S1 | signals[].holds_after_activity |
| 13 | data | Paying goes with two things: coming back after day 0, and real client work. | D2 · S1 (summary of reference/1-findings.md) | — |
| 14 | data | Of 552 trial workspaces that signed up in July–August 2026, 518 were real practices, and 64 of them paid within 30 days: 12.4% (95% interval 9.8–15.5%). | C1 · C8 · Rule 5 | cleaning.workspaces_raw, base.practices, base.paid, base.conversion_pct, base.conversion_ci |
| 15 | data | The data is fictional, supplied by Carepatron for the challenge. | Rule 5 | — |
| 16 | data | 34 of the 552 sign-ups weren't real practices, so they came out first. | C1 · C2 | cleaning.removed_total, workspaces_raw |
| 17 | data | 25 were phishing or spam accounts and 9 were internal QA accounts. | C2 | cleaning.spam_accounts, qa_accounts |
| 18 | data | The spam accounts impersonate brands with digit swaps, never touched a clinical feature, went quiet after a median of about 63 hours, and none paid. | C3 | cleaning.spam_median_active_hours, spam_clinical_events, spam_paid |
| 19 | data | Left in, they made importing look like something non-payers do. | C4 · §4 Read the data beat 1 | — |
| 20 | data | They produced 88% of all client imports and 85% of portal invites. | C4 | cleaning.imports_from_spam_pct, portal_invites_from_spam_pct |
| 21 | data | Then one rule for what goes with paying: only events from a practice's first 14 days, and before it paid, count. 86% of paying practices' billing-page views came after they paid, so later events describe customers, not trials. | C7 (scope stated precisely: the activity curve uses all events) | cleaning.payer_billing_views_after_payment_pct |
| 22 | data | High These accounts are spam or QA and must be removed | Confidence table row 1 (High) | — |
| 23 | data | 34 of 552 sign-ups removed: 25 spam, 9 internal QA | C2 | cleaning.removed_total, workspaces_raw, spam_accounts, qa_accounts |
| 24 | data | Spam account names N0rton Billing Dep0p Help Desk Vinted Payments Team | C3 | cleaning.spam_practice_names |
| 25 | data | Share produced by the 25 spam accounts | C4 | cleaning.spam_accounts |
| 26 | data | Client imports 88% 947 of 1,075 Portal invites 85% 1,311 of 1,544 | C4 | cleaning.imports_from_spam(_pct), imports_total, portal_invites_from_spam(_pct), portal_invites_total |
| 27 | data | Carepatron sample data (fictional) · 552 workspaces, 7,665 events · 56 duplicate event rows also dropped | C1 · C6 | cleaning.workspaces_raw, events_raw, duplicate_event_rows |
| 28 | data | 45% of trials (235 of 518) never came back after day 0. | D1 | dropoff.never_back_after_day0_pct, never_back_after_day0, base.practices |
| 29 | data | None of them paid. | D1 | dropoff.never_back_after_day0_paid |
| 30 | data | They did try the product: a median of 3 actions, mostly appointments, notes, templates and hand-added clients. | D4 | dropoff.day0_leavers_median_events, day0_leavers_top_actions |
| 31 | data | Only 1 of 235 used the scribe, took an online booking or sent an invoice. | D4 | dropoff.day0_leavers_used_scribe_booking_or_invoice |
| 32 | data | At the end of day 0, leavers look like practices that come back later: about 3 actions, about 100 minutes, and no one has used the scribe yet. | D5 | return_timing.first_session_events_never_returned, first_session_minutes_never_returned, first_session_scribe_users |
| 33 | data | High A large group with a zero conversion rate | Confidence table row 2 (High); reason from reference/1-findings.md | — |
| 34 | data | 45% of trials never come back after day 0 | D1 · D8 (chart title) | dropoff.never_back_after_day0_pct, retention_curve_pct |
| 35 | data | Carepatron sample data (fictional) · 518 practices · share with any activity on or after each day, days 0–14 | D8 | dropoff.retention_curve_pct |
| 36 | data | Practices that came back on days 1–3 paid at 30%, against 5%. | D2 · confidence table row 3 wording | dropoff.returned_day1to3.conversion_pct, not_returned_day1to3.conversion_pct |
| 37 | data | Among the 505 practices that hadn't paid by day 3, the 110 that came back on days 1–3 paid at 30.0%; the 395 that didn't, at 4.6%. | D2 | early_window.practices_not_paid_by_day3, dropoff.returned_day1to3.*, not_returned_day1to3.* |
| 38 | data | Two-thirds of those later payers (33 of 51) had come back in that window. | D3 | dropoff.returned_day1to3.paid, early_window.of_which_paid_later |
| 39 | data | It's partly circular: keen practices both come back and pay. | Confidence table row 3 | — |
| 40 | data | But it sets the clock for a journey, because the typical practice first comes back after about 2.6 days. | D7 | return_timing.median_first_return_days |
| 41 | data | High that the link exists; partly circular | Confidence table row 3 (High) | — |
| 42 | data | Came back on days 1–3: 30.0% paid. | D2 (chart title) | dropoff.returned_day1to3.conversion_pct |
| 43 | data | Didn't: 4.6%. | D2 (chart title) | dropoff.not_returned_day1to3.conversion_pct |
| 44 | data | Carepatron sample data (fictional) · 505 practices not yet paid by day 3 · lines show 95% intervals | D2 | early_window.practices_not_paid_by_day3, conversion_ci |
| 45 | data | Three actions still go with paying once activity is allowed for: the AI scribe, online bookings and invoices. | S1 | signals[].holds_after_activity |
| 46 | data | 33.9% of practices that took an online booking paid, against 9.7% of those that didn't. | S2 | signals.client_booked_online.conversion_did_pct, conversion_not_pct |
| 47 | data | Invoices: 32.1% against 10.0%. | S2 | signals.invoice_sent.conversion_did_pct, conversion_not_pct |
| 48 | data | The AI scribe: 21.8% against 7.4%. | S2 | signals.ai_scribe_used.conversion_did_pct, conversion_not_pct |
| 49 | data | Taken one at a time, and allowing for how active a practice was, each goes with about 2.4–2.8 times the odds of paying. | S3 (odds ratio explained in words, Rule 8) | signals[].adj_odds_ratio |
| 50 | data | What they share is real client work: a real session written up, a real client booking in, a real bill going out. | S6 | — |
| 51 | data | Notes, appointments and templates, done by 68–75% of trials, show no link to paying once activity is allowed for. | N1 | signals.template_opened/appointment_created.share_of_trials_pct, adj_odds_ratio |
| 52 | data | Medium Holds in every check, but intervals are wide and it's borderline after multiple testing | Confidence table row 5 (Medium), short form | — |
| 53 | data | For each of the three, practices that did it paid at 22–34%, against 7–10% for those that didn't | S2 (chart title) | signals[key three].conversion_did_pct, conversion_not_pct |
| 54 | data | All trials, 12.4% | C8 | base.conversion_pct |
| 55 | data | Carepatron sample data (fictional) · 518 practices · events in days 0–14 before payment · dots show raw paid rates; the grouping comes from a model that also counts how many days a practice was active | C7 · C8 (chart source line: window and base) | base.practices |
| 56 | data | The more of the three a practice did, the higher its paid rate. | S4 | dose_response |
| 57 | data | None: 7.3%. | S4 | dose_response.0.conversion_pct |
| 58 | data | One: 12.7%. | S4 | dose_response.1.conversion_pct |
| 59 | data | Two: 27.3%. | S4 | dose_response.2.conversion_pct |
| 60 | data | All three: 47.4%, though only 19 practices did all three. | S4 | dose_response.3.conversion_pct, practices |
| 61 | data | Practices doing any of the three paid at 21.4%, about three times the rate of those doing none (7.3%). | S5 (the one allowed multiplier) | any_key_action.conversion_pct, no_key_action.conversion_pct |
| 62 | data | Medium Wide intervals, especially for all three | Confidence table row 5 (Medium); interval widths from data | dose_response[].conversion_ci |
| 63 | data | 7.3% paid with none of the three key actions; 47.4% with all three | S4 (chart title) | dose_response.0/3.conversion_pct |
| 64 | data | Carepatron sample data (fictional) · 518 practices · events in days 0–14 before payment · raw rates, not adjusted for activity · lines show 95% intervals | C7 · C8 (chart source line: window and base) | base.practices |
| 65 | data | The pattern has limits, and none of it proves cause. | X4 | — |
| 66 | data | Some payers arrived already decided | X1 | — |
| 67 | data | 24 of 64 payers did none of the three before paying. | X1 | caveats.payers_without_key_actions, base.paid |
| 68 | data | They paid fast: median day 3, against day 15.2 for other payers. | X1 | caveats.payers_without_key_actions_median_pay_day, payers_with_key_actions_median_pay_day |
| 69 | data | Many paid after the trial | X2 | — |
| 70 | data | 20 of 64 payers paid after day 14, so the 14-day window doesn't see everything that happened before they decided. | X2 | caveats.payers_paid_after_day14, base.paid |
| 71 | data | The UK and Canada barely convert | X3 | — |
| 72 | data | UK and Canadian practices paid at about 2% (1 of 48; 1 of 45), against 15.4% in the US, though UK practices used the scribe more (39.6% vs 35.6%). | X3 | caveats.country.GB/CA/US.*, scribe_use_pct |
| 73 | data | None of the 7 UK and Canadian practices that opened the billing page paid, against 43.2% in the US. | X3 | caveats.gb_ca_viewed_billing, us_billing_viewer_conversion_pct |
| 74 | data | Low that the gap is about pricing or checkout | Confidence table row 7 (Low) | — |
| 75 | data | All of this is correlation, not cause. | X4 | — |
| 76 | data | Practices with real clients can book and invoice; ones without can't, so these actions partly mark practices that were always going to pay. | X4 | — |
| 77 | data | Only a holdout test shows how much a journey can change. | X4 | — |
| 78 | data | 34 workspaces are spam or QA and must be removedHigh | Confidence table row 1 | cleaning.removed_total |
| 79 | data | 45% never return after day 0, and none payHigh | Confidence table row 2 | dropoff.never_back_after_day0_pct |
| 80 | data | Returning on days 1–3 goes with paying (30% vs 5%)High that the link exists; partly circular | Confidence table row 3 (High) | — |
| 81 | data | Notes, appointments and templates don't separate payersHigh | Confidence table row 4 | — |
| 82 | data | AI scribe, online bookings and invoices go with payingMedium holds in every check, but intervals are wide and it is borderline once multiple testing is allowed for | Confidence table row 5 | — |
| 83 | data | Importing matters on its ownLow | Confidence table row 6 | — |
| 84 | data | The GB/Canada gap is about pricing or checkoutLow | Confidence table row 7 | — |
| 85 | data | The three actions show a clear gap in July and August separately: for example, scribe users paid at 19.8% vs 8.7% in July, and 23.7% vs 5.8% in August. | R1 | robustness.month_split.July/August.ai_scribe_used |
| 86 | data | With duplicate sign-ups collapsed, or the 7 practices that paid within 24 hours removed, the odds ratios for the three stay at 2.6–3.3 (all p < 0.03). | R2 ("0.03" is the threshold quoted in R2) | caveats.payers_paid_within_24h, robustness.*.odds_ratios |
| 87 | data | Rates come with 95% Wilson intervals. | Method (reference/1-findings.md) | — |
| 88 | data | "Allowing for activity" means a logistic regression that also includes how many distinct days a practice was active. | Method (reference/1-findings.md) | — |
| 89 | journey | Give every new practice that hasn't come back a reason to return by day 4, and make that reason a piece of real client work. | §4 Journey lead | — |
| 90 | journey | Other exits: pays, unsubscribes, spam rule, day 14 | §4 Journey steps | — |
| 91 | journey | Hasn't come back, hasn't used the scribe, taken a booking or sent an invoice, hasn't paid, and isn't flagged by the spam rule: about 85% of new trials (438 of 518). | J1 | journey.entrants_pct_of_trials, entrants, base.practices |
| 92 | journey | At the end of day 0, leavers look just like practices that come back later, so the entry doesn't try to pick them out. | D5 (explains the entry; plan §6.1) | — |
| 93 | journey | Half go to a holdout group that gets standard onboarding only. | §4 Journey steps (50/50 holdout) | — |
| 94 | journey | Turn on the AI scribe in your next session, or try it on a 2-minute sample recording. | §4 Journey Email 1 / reference/2-journey | — |
| 95 | journey | Scribe not used yet: “Record your next session”. | §4 Journey in-app step | — |
| 96 | journey | Already used: “Share your booking link”. | §4 Journey in-app step | — |
| 97 | journey | For practices that used the scribe but haven't had an online booking. | reference/2-journey (Email 2 audience) | — |
| 98 | journey | Other exits: pays, unsubscribes, trips the spam rule, or reaches day 14. | §4 Journey exits | — |
| 99 | journey | 179 practices used it (35% of trials), three times as many as booked online or invoiced. | S7 | signals.ai_scribe_used.practices_did, share_of_trials_pct |
| 100 | journey | Among practices not yet paid by day 3, those that had used it by then paid at 29.0%, against 7.1%. | S7 | early_window.ai_scribe_used.conversion_did_pct, conversion_not_pct |
| 101 | journey | Practices whose first return came 20 to 96 hours after sign-up paid at 33%. | D6 (window stated precisely, plan §6.2) | return_timing.first_return_20_96h.conversion_pct |
| 102 | journey | Those that first came back after day 4 paid at 8%, so later emails mostly add noise. | D6 · reference/2-journey ("later emails mostly add noise") | return_timing.first_return_after_96h.conversion_pct |
| 103 | journey | The typical practice first comes back after about 2.6 days. | D7 | return_timing.median_first_return_days |
| 104 | journey | Randomise at entry and compare against the holdout. | §4 How we'd know · X4 | — |
| 105 | journey | The findings are correlational, so only a holdout shows how much of the gap the journey actually closes. | X4 · reference/2-journey | — |
| 106 | journey | Used the scribe, took an online booking or sent an invoice by day 7 | J2 (primary measure) | — |
| 107 | journey | 25.6% | J2 | journey.baseline_key_action_by_day7_pct |
| 108 | journey | Came back by day 4 | J2 (secondary) | — |
| 109 | journey | 25.8% | J2 | journey.baseline_return_by_day4_pct |
| 110 | journey | Paid within 30 days | J2 (secondary) | — |
| 111 | journey | 9.6% | J2 | journey.baseline_paid_pct |
| 112 | journey | Unsubscribes, spam complaints, consent-related support tickets | §4 How we'd know (guardrails) | — |
| 113 | journey | With a 50/50 holdout, about 1,000 entrants detect a rise of 8 points (80% power, 5% significance) on the primary measure: about 4.6 months at this dataset's volume of about 219 entrants a month. | J3 | journey.sample_size.primary_plus8pts_50_50, months_at_dataset_volume, entrants_per_month |
| 114 | journey | About 3,400 detect 3 points on paid. | J3 | journey.sample_size.paid_plus3pts_50_50 |
| 115 | journey | An 80/20 split would need about 1,600 (7.3 months). | J3 | journey.sample_size.primary_plus8pts_80_20, months_at_dataset_volume |
| 116 | journey | Keep it if the primary measure rises by 5 points or more and its 95% interval excludes zero, with the guardrails flat. | §4 decision rule, amended by Andre (option a: interval must exclude zero) | — |
| 117 | journey | Months to read the primary measure: 4.6 with a 50/50 split, 7.3 with 80/20 | J3 (chart title) | journey.months_at_dataset_volume.primary_plus8pts_50_50/80_20 |
| 118 | journey | Sized for 80% power at 5% significance to detect a rise of 8 points from a 25.6% baseline · about 219 entrants a month in this data | J2 | journey.baseline_key_action_by_day7_pct |
| 119 | journey | Practices that come back but stay shallow. | §4 Leaves out | — |
| 120 | journey | Practices that arrive already decided. 24 of 64 payers paid without the key actions. | X1 · §4 Leaves out | caveats.payers_without_key_actions, base.paid |
| 121 | journey | The journey exits them at payment and doesn't try to speed them up. | §4 Leaves out | — |
| 122 | journey | UK and Canadian practices. | §4 Leaves out · X3 | — |
| 123 | journey | One entry point with one holdout keeps the result readable. | §4 Leaves out | — |
| 124 | message | Email 1 from the journey, for a solo therapist reading on their phone between sessions: one idea, one button, about 80 words. | reference/2-journey (Email 1 intro: "about 80 words") | — |
| 125 | message | Here's one thing worth trying 2 before your week fills up. | §4 Email (verbatim) | — |
| 126 | message | In your next session, get your client's OK 3 and turn on the AI scribe. | §4 Email (verbatim) | — |
| 127 | message | You check it, tweak it and sign it, instead of writing it from scratch at 9pm. 4 | §4 Email (verbatim) | — |
| 128 | message | Try it on a 2-minute sample recording. 5 | §4 Email (verbatim) | — |
| 129 | message | Try it on my next session 6 | §4 Email (verbatim) | — |
| 130 | message | Sent at 10 minutes to the hour in the practice's local time, when a session has just ended. | §4 Email annotations | — |
| 131 | message | About a third of trials used the scribe, so the email doesn't say “most therapists” do. | §4 Email annotations · S7 (34.6% of trials) | signals.ai_scribe_used.share_of_trials_pct |
| 132 | message | The button opens the scribe ready to record, not a dashboard. | §4 Email annotations | — |
| 133 | ship | Only 11% of trials got an online booking in their first two weeks. | §4 Ship problem line ("ever" replaced: the data covers days 0–14 before paying) | signals.client_booked_online.share_of_trials_pct |
| 134 | ship | Open Slot puts the booking link where new clients look. | §4 Ship idea (pitch line) | — |
| 135 | ship | 56 of 518 trials (11%) had a client book online in their first 14 days | §4 Ship problem line (chart title) | signals.client_booked_online.practices_did, share_of_trials_pct |
| 136 | ship | Carepatron sample data (fictional) · 518 practices · events in days 0–14 before payment | C7 · C8 (chart source line: window and base) | base.practices |
| 137 | ship | A client booking online is one of the three moments that go with paying, yet only 11% of trials (56 of 518) got one in their first 14 days. | §4 Ship problem line · S1 | signals.client_booked_online.share_of_trials_pct, practices_did |
| 138 | ship | Practices that had one paid at 33.9%, against 9.7%. | S2 | signals.client_booked_online.conversion_did_pct, conversion_not_pct |
| 139 | ship | A booking page only brings in bookings if clients can find the link. | §4 Ship two jobs (activation) | — |
| 140 | ship | Open Slot is a free tool that turns a practitioner's booking link into ready-to-paste wording for every place a new client might find them, plus a printable QR card. | §4 Ship idea | — |
| 141 | ship | Enter your details and booking link | §4 Ship how it works | — |
| 142 | ship | It's Email 2 in the journey | §4 Ship two jobs (activation) | — |
| 143 | ship | Sent the morning after a practice first uses the scribe, to practices that haven't had an online booking yet. | §4 Journey Email 2 / reference/2-journey | — |
| 144 | ship | For trial users who get Email 2: the share with a first online booking within 7 days, against the journey's holdout | §4 Ship measurement | — |
| 145 | ai | Checking it did the important work. | §4 AI headline | — |
| 146 | ai | Claude (Opus 5.5, in the Claude app) | §4 AI tools ("5.5" is the model version) | — |
| 147 | ai | Every number in the findings comes from code run on the supplied CSVs, not from the model's memory, so each one can be re-run and checked. | reference/3-how-i-used-ai | — |
| 148 | ai | “Are these spam accounts really spam?” | §4 AI probing prompts (verbatim) | — |
| 149 | ai | The first pass found a strong import signal and recommended building a tool around it. | A1 · reference/3-how-i-used-ai | — |
| 150 | ai | Importers paid at 36% vs 7%, so: build a client-list converter | A1 | ai_story.first_pass_import_conversion_pct, first_pass_no_import_conversion_pct |
| 151 | ai | It counted imports across all 30 days, including after practices had paid. | reference/3-how-i-used-ai (why the number was wrong) | — |
| 152 | ai | First 14 days, before paying: 28% vs 10% | A2 | ai_story.corrected_window_import_conversion_pct, corrected_window_no_import_conversion_pct |
| 153 | ai | With the scribe, online bookings and invoices counted, importing showed no link of its own (odds ratio 0.98, 95% interval 0.39–2.5). | A2 · N2 (interval added: joint_model.client_created_import.ci) | ai_story.import_odds_ratio_with_key_actions |
| 154 | ai | Carepatron already has a built-in “Import from another platform” option | A3 (external source: Carepatron help centre) | — |
| 155 | ai | So the tool became Open Slot instead, aimed at online bookings: one of the three actions that held up in every check. | §4 AI big catch · reference/3-how-i-used-ai · S1 | — |
| 156 | ai | Re-running each signal with the stated rules and controls exposed the import result; checking Carepatron's own help pages exposed the duplicate. | reference/3-how-i-used-ai (How I noticed) | — |
| 157 | ai | The spam filter missed some | C5 | — |
| 158 | ai | Filtering by email domain caught 21 of the 25 spam accounts. | C5 | cleaning.spam_caught_by_domain_filter, spam_accounts |
| 159 | ai | The same devil's-advocate pass found 4 more on a third throwaway domain. | C5 · reference/1-findings.md | cleaning.spam_missed_by_domain_filter |
| 160 | ai | A behaviour rule (no clinical activity and 10+ portal invites) caught all 25. | C5 | cleaning.spam_accounts |
| 161 | ai | The first journey trigger couldn't single out leavers | A4 | — |
| 162 | ai | It entered practices with no activity 20 hours after sign-up, aimed at the 45% who leave on day 0. | A4 · D1 | dropoff.never_back_after_day0_pct |
| 163 | ai | It would have caught 86% of trials, because leavers and later returners look identical at the end of day 0. | A4 · D5 | return_timing.no_return_by_20h_pct_of_trials |
| 164 | ai | So the journey stopped trying to pick out leavers: it takes in everyone who hasn't come back, with a holdout, and every step after that waits for what the practice does. | Rewording of A4's consequence (plan §6.1) · J1 | — |
| 165 | ai | A new service defaulted to 50 minutes, so a “15-minute intro call” read “50 minutes”, and a zero fee printed “$0” instead of “free”. | §4 AI smaller catches | — |
| 166 | ai | It produced a confident number, and a sensible-sounding plan built on it, within minutes. | §4 AI lessons · reference/3-how-i-used-ai | — |
| 167 | ai | The errors sat underneath, in definitions: which time window, which accounts count, before or after payment. | §4 AI lessons | — |
| 168 | footer | Data: fictional sample data supplied by Carepatron. | Rule 5 · §4 Footer | — |
| 169 | footer | Every figure is reproducible with the scripts in this repository. | §4 Footer | — |

## Gate 5 · visual QA

**Widths.** Pages captured at 375, 768, 1280 and 1440px (1280 uses the same layout as 1440 inside the 1200px max width). At every width `scrollWidth` equals the viewport width: no horizontal scroll. Issues found and fixed during this pass:

| Issue | Fix |
| --- | --- |
| Hidden fallback tables kept their full width and pushed the 375px page out to 766px | Each table wrapped in a div, and the div is visually hidden, not the table |
| At 768px the "25 spam or phishing" label ran past the panel edge | Removed-account clusters and their labels are right-aligned |
| At 768px the 64-payer dot charts scaled up to oversized dots | Size capped; two rows of 32 on wider cards |
| Nav kept a light background at the very top of the page | Defaults to dark above the first band, since the page top is navy |
| Demo frame content sat 4px from the frame edge | Embed padding raised to 12–20px |
| The hero chart is inserted by script, so the headline column moved as it drew (desktop CLS 0.092) | Chart space reserved with `aspect-ratio`; CLS now 0.032 desktop, 0 mobile |

**Reduced motion.** All review screenshots were taken with `prefers-reduced-motion: reduce`: charts, phone and count-ups show their final state, nothing animates, and no element is left hidden. With motion on, a full scroll leaves 0 elements at opacity 0 and all 13 charts rendered. With JavaScript off, every chart falls back to a visible data table.

**Keyboard** (real Tab and arrow key presses):
- Order: skip link → name → the five section links → Try Open Slot → Read the findings → How I checked → findings doc link → journey links → subject A/B → Open the full tool → into the demo's fields.
- Every stop shows a focus ring.
- ArrowRight on the subject toggle selects B and swaps the subject line.
- Tabbing into the capped demo expands it automatically.

**Lighthouse 12.8.2** (local server, which doesn't compress or cache):

| Run | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Site, mobile | 85 | 100 | 100 | 100 |
| Site, desktop | 97 | 100 | 100 | 100 |
| Tool, mobile | 89 | 100 | 100 | — |

Fixed along the way:
- **Accessibility:** cobalt links measured 4.47:1 on the mint and pale-blue bands. Links now use #2F54E6, at 5.4:1 or better on every band.
- **Blocking time and layout shift:** the hero intro moved from per-dot JavaScript tweens to CSS transitions; charts below the fold draw in short batches; each chart's start state is set only just before it scrolls in. Total blocking time is 0ms and CLS is 0 on mobile.

**Still open:** mobile performance (85) is held back by first paint (3.3s). That's the Google Fonts stylesheet over a slow simulated connection, with uncompressed files from this local server. GitHub Pages compresses files, so this gets re-measured live at deploy. If it's still under 90, the next step is self-hosting the three font families, which needs Andre's go-ahead to download the font files. Loading fonts without blocking was tried and rejected: it made the headline reflow (CLS 0.2).

## Sceptical data-analyst review

Read every chart and headline for overstatement, implied cause, dropped caveats and misleading display. No number was changed.

| Issue | Fix |
| --- | --- |
| Ship something said only 11% of trials **ever** got an online booking; the data covers days 0–14 before paying | Now "in their first two weeks" (headline) and "in their first 14 days" (chart title and problem line) |
| "Then one rule for **everything** below": the cliff chart counts all activity, not just days 0–14 before paying | Now "one rule for what goes with paying" |
| "Went quiet after about 63 hours" is a median | "after a median of about 63 hours" |
| Key-actions chart title "practices that did **one of the three**" reads as "exactly one" | "For each of the three, practices that did it paid at 22–34%…" |
| The beat 4 Medium chip dropped the multiple-testing caveat | "…intervals are wide and it's borderline after multiple testing" |
| Odds ratios (2.4–2.8) were shown without their wide intervals | The data table now gives each odds ratio with its 95% interval |
| "Importing **added nothing** (odds ratio 0.98)" sounds certain; its interval is 0.39–2.5 | "showed no link of its own (odds ratio 0.98, 95% interval 0.39–2.5)" |
| Beats 4 and 5 show raw rates, but only the grouping in beat 4 is activity-adjusted | Source lines say "dots show raw paid rates" and "raw rates, not adjusted for activity" |
| "About 1,000 entrants detect +8 points" didn't state the assumptions | "(80% power, 5% significance)", which `analysis.py` uses |

Checked and fine as they stand:
- Every bar chart starts at zero.
- Every rate the copy gives an interval for has whiskers.
- The 13-action chart shows all 13 actions, so nothing is cherry-picked.
- The country chart includes Australia, so the UK/Canada comparison isn't cherry-picked.
- The two import mini-charts share a 0–40% scale.
- The retention chart shows the whole curve, including the later decline, and annotates only the cliff.
- The only multiplier is S5's.
- The correlation note and every confidence label are on the page.

Earlier fixes from the plan (§6) are already on the page:
- The 86% trigger story is reworded so it no longer contradicts the journey's 85% entry.
- The day-4 window is stated as 20–96 hours.
- "Spam and test accounts", not "fake".
- The decision rule needs the 95% interval to exclude zero.
- The tool's footer says "Many practice management tools", not "Most".

## Open before submission

- The footer links to the GitHub repository (https://github.com/Andrepreston/The-Growth-Challenge); the live site is https://andrepreston.github.io/The-Growth-Challenge/.
- Real clipboard copying in Open Slot needs a real click on the live site; headless Chrome blocks clipboard access. Both copy buttons' fallback messages were tested.
- Re-run gates 1–3 and Lighthouse against the live URL.
- Andre to confirm the wording "Custom skills: Reusable instructions I set up for Claude."
