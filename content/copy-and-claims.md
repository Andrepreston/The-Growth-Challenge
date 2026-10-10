# Copy and claims register

This file is the only source of wording and claims for the site. Numbers come from `data/findings.json` (key paths given in brackets). If a sentence you want to write isn't backed by a claim below, don't write it; ask Andre.

---

## 1. Wording rules

1. **Correlation, not cause.** Use "goes with", "linked to", "practices that did X paid at Y%". Never "causes", "drives", "leads to", "increases", "boosts", "makes practices pay", "X% more likely".
2. **Rates, not multipliers, by default.** "33.9% of practices that took an online booking paid, against 9.7% of those that didn't." The only allowed multiplier: "about three times the rate", for practices doing any of the three key actions vs none (21.4% vs 7.3%) [any_key_action, no_key_action].
3. **Every headline number has its base nearby.** "45% (235 of 518)". Hover text or a footnote line is fine.
4. **Keep the confidence labels.** High / Medium / Low exactly as in the confidence table below. Simplifying the message must not remove the caveats.
5. **Name the data honestly.** The data is fictional, supplied by Carepatron for the challenge. Say so in the data section and the footer.
6. **No projections.** No forecast uplift, revenue, ROI or "this will increase conversion by X". The journey and the tool come with a measurement plan, not a promised result.
7. **Independent work.** Andre is applying to Carepatron. The site must not look like an official Carepatron page: no Carepatron logo or brand assets, and say "an independent submission by Andre Nwofor".
8. **Plain words.** "Practices", "trials", "paid". Explain an odds ratio in words the first time ("about 2.4 times the odds").

---

## 2. Claims register

### Base and cleaning
| ID | Approved claim | Source key |
| --- | --- | --- |
| C1 | 552 trial workspaces signed up in July–August 2026, with 7,665 events. | cleaning.workspaces_raw, cleaning.events_raw |
| C2 | 34 weren't real practices: 25 phishing/spam accounts and 9 internal QA accounts. They were removed first. | cleaning.spam_accounts, qa_accounts, removed_total |
| C3 | The spam accounts impersonate brands with digit swaps ("N0rton Billing", "Dep0p Help Desk", "Vinted Payments Team"), never touched a clinical feature, and went quiet after about 63 hours. None paid. | cleaning.spam_practice_names, spam_clinical_events, spam_median_active_hours, spam_paid |
| C4 | They produced 88% of all client imports (947 of 1,075) and 85% of portal invites (1,311 of 1,544). It looks like abuse of the client portal to send phishing invites, worth flagging to trust and safety. | cleaning.imports_from_spam_pct, portal_invites_from_spam_pct |
| C5 | A filter on email domain alone caught 21 of the 25; a behaviour rule (no clinical activity and 10+ portal invites) caught all 25. | cleaning.spam_caught_by_domain_filter |
| C6 | 56 duplicate event rows were dropped. | cleaning.duplicate_event_rows |
| C7 | Only events from the first 14 days, and before paying, count. 86% of paying practices' billing-page views came after they paid, so later events describe customers, not what led to paying. | cleaning.payer_billing_views_after_payment_pct |
| C8 | After cleaning: 518 practices, 64 paid within 30 days: 12.4% (95% interval 9.8–15.5%). | base.* |

### The day-0 cliff
| ID | Approved claim | Source key |
| --- | --- | --- |
| D1 | 45% of trials (235 of 518) never came back after day 0. None of them paid. | dropoff.never_back_after_day0_pct, _paid |
| D2 | Among the 505 practices that hadn't paid by day 3, those that came back on days 1–3 paid at 30.0% (110 practices); those that didn't, at 4.6% (395). | dropoff.returned_day1to3, not_returned_day1to3 |
| D3 | Two-thirds of those later payers (33 of 51) had come back on days 1–3. | dropoff.returned_day1to3.paid, early_window.of_which_paid_later |
| D4 | Day-0 leavers did try the product: a median of 3 actions, mostly appointments, notes, templates and hand-added clients. Only 1 of 235 used the scribe, took an online booking or sent an invoice. | dropoff.day0_leavers_* |
| D5 | At the end of day 0, leavers look like practices that come back later: about 3 actions, about 100 minutes, and no one has used the scribe yet. | return_timing.first_session_* |
| D6 | Practices whose first return came on days 1–4 paid at 33%; after day 4, 8%. | return_timing.first_return_20_96h, first_return_after_96h |
| D7 | The typical practice first comes back after about 2.6 days. | return_timing.median_first_return_days |
| D8 | Retention curve values, day 0–14. | dropoff.retention_curve_pct |

### What goes with paying
| ID | Approved claim | Source key |
| --- | --- | --- |
| S1 | Three actions still go with paying after allowing for how active a practice was: using the AI scribe, a client booking online, and sending an invoice. | signals[].holds_after_activity |
| S2 | Online booking: 33.9% of practices that had one paid, vs 9.7% (56 practices). Invoice: 32.1% vs 10.0% (56). AI scribe: 21.8% vs 7.4% (179). Show 95% intervals. | signals[] |
| S3 | Taken one at a time, each goes with about 2.4–2.8 times the odds of paying, after allowing for activity. | signals[].adj_odds_ratio |
| S4 | They add up: none 7.3%, one 12.7%, two 27.3%, all three 47.4% (only 19 practices did all three). | dose_response |
| S5 | Practices doing any of the three paid at 21.4%, about three times the rate of those doing none (7.3%). | any_key_action, no_key_action |
| S6 | What they share is real client work: a real session written up, a real client booking in, a real bill going out. | (interpretation of S1) |
| S7 | The AI scribe is the one to lead with: 179 practices used it (35% of trials), three times as many as booked online or invoiced, and it shows early. Among practices not yet paid by day 3, those that used it by then paid at 29.0%, vs 7.1%. | signals[ai_scribe_used].practices_did, share_of_trials_pct, early_window.ai_scribe_used |
| S8 | No one used the scribe in their first session, which makes it a natural reason to come back. | return_timing.first_session_scribe_users |

### What doesn't
| ID | Approved claim | Source key |
| --- | --- | --- |
| N1 | Notes, appointments and templates are done by 68–75% of trials and show no link to paying once activity is allowed for. | signals[] share_of_trials_pct, adj_odds_ratio |
| N2 | Importing clients looks strong (28.2% vs 9.8%) but adds nothing once the three key actions are counted (odds ratio 0.98). | signals[client_created_import], joint_model.client_created_import |
| N3 | Video calls show a similar raw gap but can't be told apart from chance after allowing for activity; only 51 practices ran one. | signals[video_call_started] |
| N4 | Teams of 2–5 converted at 7.3% vs 13.5% for solo practitioners; inviting a team member leaned negative but isn't statistically meaningful. | caveats.team_size, signals[staff_invited] |

### What it doesn't explain
| ID | Approved claim | Source key |
| --- | --- | --- |
| X1 | 24 of 64 payers did none of the three before paying. They paid fast (median day 3, vs day 15.2 for other payers): practices that arrived already decided. | caveats.payers_without_key_actions* |
| X2 | 20 of 64 payers paid after day 14. | caveats.payers_paid_after_day14 |
| X3 | UK and Canadian practices converted at about 2% (1 of 48; 1 of 45) vs 15.4% in the US (55 of 357), though UK practices used the scribe more (39.6% vs 35.6%). The 7 UK/Canadian practices that opened the billing page didn't pay, vs 43.2% of US practices that did. Points to pricing or checkout, but far too few to conclude. | caveats.country, gb_ca_viewed_billing* |
| X4 | All of this is correlation. Practices with real clients can book and invoice; ones without can't. Only a holdout test shows how much a journey can change. | (method) |

### Confidence table (use exactly)
| Finding | Confidence |
| --- | --- |
| 34 workspaces are spam or QA and must be removed | High |
| 45% never return after day 0, and none pay | High |
| Returning on days 1–3 goes with paying (30% vs 5%) | High that the link exists; partly circular |
| Notes, appointments and templates don't separate payers | High |
| AI scribe, online bookings and invoices go with paying | Medium: holds in every check, but intervals are wide and it is borderline once multiple testing is allowed for |
| Importing matters on its own | Low |
| The GB/Canada gap is about pricing or checkout | Low |

### Robustness (for a "how we checked" detail)
| ID | Approved claim | Source key |
| --- | --- | --- |
| R1 | The three actions show a clear gap in July and August separately (e.g. scribe 19.8% vs 8.7% in July, 23.7% vs 5.8% in August). | robustness.month_split |
| R2 | With duplicate sign-ups collapsed, or the 7 practices that paid within 24 hours removed, odds ratios stay at 2.6–3.3 (all p < 0.03). | robustness.dedupe_re_signups, drop_paid_within_24h |

### Journey sizing
| ID | Approved claim | Source key |
| --- | --- | --- |
| J1 | About 85% of new trials (438 of 518) would enter: no return, no key action and not paid within 24 hours. | journey.entrants* |
| J2 | Baselines: 25.6% do a key action by day 7; 25.8% come back by day 4; 9.6% pay. | journey.baseline_* |
| J3 | With a 50/50 holdout, about 1,000 entrants detect +8 points on the primary measure (about 4.6 months at this dataset's volume of about 219 entrants a month); about 3,400 detect +3 points on paid. An 80/20 split would need about 1,600 (7.3 months). | journey.sample_size, months_at_dataset_volume |

### AI story
| ID | Approved claim | Source key |
| --- | --- | --- |
| A1 | The first pass said practices that imported clients paid at 36% vs 7% (36.3% vs 7.2%), and recommended a client-list converter tool. | ai_story.first_pass_* |
| A2 | Re-run on the right window (first 14 days, before paying): 28% vs 10%. With the three key actions counted, importing added nothing (odds ratio 0.98). | ai_story.corrected_*, import_odds_ratio_with_key_actions |
| A3 | Carepatron already has a built-in "Import from another platform" option (SimplePractice exports and spreadsheets). Source: Carepatron help centre. | external: https://help.carepatron.com/en/articles/16579529-importing-clients-from-simplepractice-now-includes-their-insurance |
| A4 | The 20-hour trigger would have caught 86% of trials, not the 45% it was aimed at. | return_timing.no_return_by_20h_pct_of_trials |

---

## 3. Banned claims

- Any causal statement about the three actions, returning, or the journey.
- "X times more likely to pay" (except S5's "about three times the rate").
- Any predicted uplift, revenue, ROI, or number of practices the journey or tool "will" convert.
- Any user count, usage, testimonial, rating or result for Open Slot. It is a concept; it has no users yet.
- "Most therapists use the scribe" (about a third of trials did).
- Claims about Carepatron's real metrics, customers, pricing or roadmap.
- Clinical, HIPAA or compliance claims.
- Carepatron's logo or brand assets, or anything that suggests an official Carepatron page.

---

## 4. Section copy (starting points; tighten freely, keep the claims)

### Hero
- **Headline options:**
  - "Almost half of new practices never come back after day one."
  - "The trials that pay start doing real client work early."
- **Subhead:** "I analysed 518 trial practices from Carepatron's sample data. Here's what goes with paying, a journey to get more practices there, and a free tool that helps."
- **Stat strip (count-up):** 518 practices analysed (34 fake accounts removed) · 12.4% paid within 30 days · 45% never came back after day 0 · 0 of them paid · 3 actions linked to paying.
- **Byline:** An independent submission by Andre Nwofor for the Carepatron AI Growth Marketer internship.
- **Primary call to action:** "Try Open Slot" (scrolls to Ship something). **Secondary:** "Read the findings".

### 1 · Read the data (six beats, one chart each)
1. **Clean first.** C2–C5. Visual: 552 dots → 34 fade out (25 spam, 9 QA) → 518. Callout with the impersonating names. Line: "Left in, they made importing look like something non-payers do."
2. **The cliff.** D1, D8. Visual: retention line that drops from 100% to 54.6% at day 1, then nearly flat. Annotation: "45% never come back. None paid."
3. **Coming back early.** D2, D3, D6. Visual: two bars, 30.0% vs 4.6%, with intervals.
4. **Real work vs trying it out.** S1, S2, N1. Visual: dumbbell or dot plot of all 13 actions (did vs didn't), the three key actions in the accent colour, the rest grey; baseline line at 12.4%.
5. **They add up.** S4, S5. Visual: four bars rising 7.3 → 12.7 → 27.3 → 47.4%, with the "19 practices" note on the last.
6. **What this doesn't explain.** X1–X4. Visual: three compact cards (decided payers, after-trial payers, the UK/Canada gap) plus the correlation note.
- Close with the confidence table (as chips: High / Medium / Low) and a link to the full findings doc.

### 2 · Design one journey
- **Headline:** "One entry point. Every step after it waits for what the practice does."
- **Lead:** "Give every new practice that hasn't come back a reason to return by day 4, and make that reason a piece of real client work."
- **Visual:** the flow (Entry at 24 hours → 50/50 holdout → Email 1 → logs back in → in-app card → uses the scribe → Email 2 → books or invoices → exit as success; no return by day 4 → Email 3). Animate it as a stepper.
- **Steps (exact):**
  - Entry, 24 hours after sign-up: hasn't come back, no key action, not paid, not flagged as spam. About 85% of new trials (J1). Half go to a holdout group.
  - Email 1: "Your next session, written up for you."
  - In-app, when they log back in: one card, not a checklist. Scribe not used yet: "Record your next session". Used: "Share your booking link".
  - Email 2, the morning after first scribe use: "Let clients book themselves," linking to Open Slot.
  - Email 3, still no return at day 4: a plain-text note from a named person: "Is anything stopping you from trying it on one session this week?"
  - Exit as success: a client books online or an invoice is sent. Other exits: pays, unsubscribes, spam rule, day 14.
- **Why the scribe first:** S7, S8.
- **Why day 4:** D6.
- **How we'd know:** primary = key action by day 7; secondary = back by day 4, paid within 30 days; guardrails = unsubscribes, spam complaints, consent-related tickets. Sizing J2–J3. Decision rule: keep it if the primary measure rises 5+ points with guardrails flat.
- **Leaves out on purpose:** shallow returners (next journey), decided payers, UK/Canada (a checkout question), separate per-feature journeys.

### 3 · Write one message
- **Headline:** "Written for the ten minutes between clients."
- **Visual:** a phone showing the email, with numbered annotations for each choice. A toggle between the two subject lines.
- **Email (verbatim):**
  - Subject A: Your next session, written up for you
  - Subject B: Skip tonight's notes
  - Preview: Press record, then edit a draft instead of starting from a blank page.
  - Body: "Hi {first_name}, You set up {practice_name} yesterday. Here's one thing worth trying before your week fills up. In your next session, get your client's OK and turn on the AI scribe. When you finish, a draft progress note is waiting. You check it, tweak it and sign it, instead of writing it from scratch at 9pm. No session today? Try it on a 2-minute sample recording. [Try it on my next session] Andre, Carepatron. P.S. Your trial runs until {trial_end_date}."
- **Annotations:** one action (the button opens the scribe ready to record); "get your client's OK" (consent, which therapists care about); "at 9pm" (the pain, not "AI"); the sample recording (removes the "no session today" excuse); no unsupported claims (about a third of trials use the scribe, so it doesn't say "most therapists"); sent at 10 minutes to the hour local time, from a named person, in plain text.

### 4 · Ship something (the biggest section: a pitch for Open Slot)
Write it so a busy manager understands the idea in 30 seconds and can say yes.
1. **The problem, in one line.** "A client booking online is one of the three moments that go with paying, yet only 11% of trials (56 of 518) ever got one." [signals[client_booked_online].share_of_trials_pct, practices_did]
2. **The idea.** "Open Slot: a free tool that turns a practitioner's booking link into ready-to-paste wording for every place a new client might find them, plus a printable QR card." No sign-up, nothing stored.
3. **How it works (3 steps).** Enter your details and booking link → get your kit (directory profile, enquiry reply, email signature, bio, voicemail, out-of-office, printable card) → copy, paste, print.
4. **Live demo.** Embed the working tool (see CLAUDE.md), with "Open the full tool" as a fallback link.
5. **Two jobs for Carepatron.**
   - *Activation:* it's Email 2 in the journey. A booking page only brings in bookings if clients can find the link.
   - *Acquisition:* it's useful to any practitioner, Carepatron user or not, and links to the free trial with UTM tracking.
6. **Why it's low-risk.** Runs entirely in the browser: no backend, no accounts, no client data stored or sent. Cheap to host and maintain.
7. **How we'd measure it.** Tool sessions; copies per session and which outputs get copied; trial clicks from the tool (UTM); for trial users who receive Email 2, the share with a first online booking within 7 days, against the journey's holdout. No targets are claimed until there's data.
8. **What I'd do next.** Test it with five solo therapists; add formats for specific directories; A/B the call to action.

### 5 · Tell us about the AI
- **Headline:** "AI did the heavy lifting. Checking it did the important work."
- **Tools:** Claude (Opus 5.5, Claude app): planning, Python analysis (pandas, SciPy, statsmodels), drafts, the tool. Claude Docs: findings doc and charts. Claude artifacts: hosting the first version of Open Slot. Claude Code: building this site. (Andre to add any others.)
- **How I worked:** structured prompts (task, context, files, plan before building) → probing prompts ("play devil's advocate: try to prove yourself wrong, or validate the finding by being unable to"; "are these spam accounts really spam?"; "is there a better option for the tool?") → manual validation (reviewed flagged accounts, checked figures across the doc, checked product claims against Carepatron's own pages).
- **The big catch (visualise as three steps):** A1 → A2 → A3, ending "So the tool became Open Slot instead."
- **Smaller catches:** C5 (spam filter), A4 (journey trigger), the tool's two bugs (new service defaulted to 50 minutes; a zero fee printed "$0").
- **What I took from it:** the AI is fastest where it's riskiest, in definitions; the most useful prompt was asking it to disprove its own work; check against the real world, not just the maths.

### Footer
- "Andre Nwofor · Independent submission for the Carepatron AI Growth Marketer internship · Not an official Carepatron site."
- "Data: fictional sample data supplied by Carepatron. Every figure is reproducible with the scripts in this repository."
- Links: full findings doc, Open Slot, GitHub repository.
