# Site plan: Carepatron growth challenge findings

Phase 1 plan. Every number below is quoted from `data/findings.json`; key paths are in `code`.

## Decisions (Andre, approved)

1. Findings doc: https://claude.ai/artifact/G2PHeDeCCJq1HhGjfqePUR#4195a840-f5fd · first hosted Open Slot: https://claude.ai/artifact/BKYJCFQ2LQ1A6KhPFHytpS
2. Hero headline: "Almost half of new practices never come back after their first day."
3. Journey decision rule: keep it if the primary measure rises 5+ points **and its 95% interval excludes zero**, with guardrails flat.
4. AI tools: also mention custom skills.
5. Python deps installed for the checks; rendered-text check via the built-in browser.
6. All "claims I think are unclear" fixes in §6 applied as proposed.

---

## 0. The idea in one paragraph

A calm, precise data story wrapped in a product-launch page. One visual motif carries the whole site: **each dot is a practice**. The hero shows the 518 practices and the 45% that never came back; section 01 starts with 552 dots and removes the 34 fakes; Ship something shows the 56 of 518 that ever got an online booking. Navy bands and cool paper alternate. Teal appears only when it means "key action / real client work / success", so by the second chart a reader knows what teal means without being told.

Page rhythm (alternating bands so it never looks like one long template):

| Band | Background | Why |
| --- | --- | --- |
| Hero | navy `--ink-900` | trust, contrast for the dot field |
| 01 Read the data | paper | long, chart-heavy; light is easiest to read |
| 02 Design one journey | white | diagram on a clean surface |
| 03 Write one message | navy | the phone glows on dark; a change of pace |
| 04 Ship something | paper, demo on white | the largest section; the tool sits in a raised frame |
| 05 Tell us about the AI | white | |
| Footer | navy | |

---

## 1. Wireframes

### Global: nav

- **Desktop (≥1024px):** 64px sticky bar on a translucent white with a hairline bottom rule. Left: "Andre Nwofor · Growth challenge" in Sora 600 (text only, no logo). Right: five links in Plex Mono, "01 Data · 02 Journey · 03 Message · 04 Open Slot · 05 AI". The current section's link is ink; the rest muted. A 2px teal reading-progress line runs along the bottom edge. Over the navy hero the bar is transparent with light text, and turns solid once past the hero.
- **Mobile (<1024px):** 52px bar: name on the left, and on the right a button showing the current section ("02 Journey ▾"). Tapping opens a sheet listing the five sections. Same progress line.
- Skip link "Skip to content" first in tab order.

### Hero (navy, about 85vh on desktop at most, sized to content)

Desktop, 12-column grid:
```
[eyebrow, mono]  Carepatron growth challenge · independent submission
[H1, cols 1–7]   Almost half of new practices never come back
                 after their first day.
[subhead]        I analysed 518 trial practices from Carepatron's sample data…
[buttons]        (Try Open Slot)  (Read the findings)
[byline, small]  An independent submission by Andre Nwofor for the Carepatron AI Growth Marketer internship.
                                                    [cols 8–12: 518-dot field]
                                                    legend: ○ never came back after day 0 (235)
                                                            ● paid within 30 days (64)
[stat strip, full width, hairline dividers]
 518 practices analysed │ 12.4% paid within │ 45% never came back │ 0 of those 235 │ 3 actions
 34 spam & test removed │ 30 days           │ after day 0         │ paid           │ linked to paying
```
Mobile (375): eyebrow → H1 (about 34px) → subhead → two full-width buttons → dot field full width (26 columns, about 9px dots) → stat strip as a 2-column grid (5th item spans both) → byline.

Dot field rules: positions are illustrative, counts are exact. The 64 paid dots sit only among the 283 that came back (none of the 235 paid). Caption: "Each dot is one trial practice."

### 01 · Read the data (paper)

Opener: eyebrow "01 · Read the data", headline **"Paying goes with two things: coming back after day 0, and real client work."**, one lead paragraph with the base (C8: 518 practices, 64 paid, 12.4%, 95% interval 9.8–15.5%) and "The data is fictional, supplied by Carepatron for the challenge."

Then six **beats**. Desktop: each beat is a row, text in columns 1–4 (beat number, short headline, at most two short paragraphs, inline confidence chip), chart panel in columns 5–12. Text stays on the left for every beat so the eye learns where to look. Mobile: text, then chart, full width.

Close: the confidence table as rows with chips, a "How we checked" disclosure (R1, R2), and a link to the full findings doc.

### 02 · Design one journey (white)

- Opener: headline "One entry point. Every step after it waits for what the practice does." Lead: "Give every new practice that hasn't come back a reason to return by day 4, and make that reason a piece of real client work."
- **Desktop:** the flow diagram is sticky in columns 1–7 while the step list scrolls past in columns 8–12. Each step that reaches the middle of the screen lights up its node and draws the connector to it.
```
 Entry (24h) ──┬── 50% holdout: standard onboarding
               └── Email 1 ──[logs back in]──> In-app card ──[uses scribe]──> Email 2 ──[books or invoices]──> Exit: success
                      └──[no return by day 4]──> Email 3 ──┘(back to "logs back in")
 Other exits: pays · unsubscribes · spam rule · day 14
```
- **Mobile:** the same flow drawn top-to-bottom, each node expanded with its text; nodes light up as they scroll into view. No sticky.
- Below the flow, two small cards side by side: **Why the scribe first** (S7, S8) and **Why day 4** (D6).
- **How we'd know:** three measurement cards (Primary / Secondary / Guardrails) with baseline and entrants needed, then the decision rule on one line.
- **Leaves out on purpose:** four short items in a two-column list.

### 03 · Write one message (navy)

- Desktop: headline and one line of intro across the top. Below: phone mock-up in columns 1–5 (CSS-drawn device frame, not an image), annotations in columns 7–12 as a numbered list. Numbered badges 1–6 sit on the parts of the email they explain. Above the phone, a segmented toggle "Subject A / Subject B" swaps the subject line in the phone's inbox row.
- Mobile: headline → toggle → phone (about 300px wide, centred) → numbered annotation list.
- The email text is verbatim from the copy register. Merge fields `{first_name}` render as small mono chips. A note under the phone: "The sign-off is a stand-in; a real send would come from Carepatron's onboarding lead."

### 04 · Ship something (paper; largest) — see §5 for the pitch logic

```
[eyebrow] 04 · Ship something
[H2]      Only 11% of trials ever got an online booking.
          Open Slot puts the booking link where new clients look.
[problem panel]  518-dot strip, 56 teal   │ "A client booking online is one of the three
                                          │  moments that go with paying (33.9% vs 9.7%)."
[idea]    One sentence + three chips: Free · No sign-up · Nothing stored
[how it works]   ① Your details + booking link → ② Your kit (7 outputs) → ③ Copy, paste, print
[LIVE DEMO]      browser-style frame with the iframe, auto-height; "Open the full tool ↗"
[two jobs]       Activation card │ Acquisition card
[low risk]       three short facts on one row
[how we'd measure]  four-row measurement ladder; "No targets until there's data."
[next]           three numbered items
```
Mobile: same order, single column. The demo frame is full-bleed (16px gutters) and sized to the tool's content so there is no scroll-inside-scroll.

### 05 · Tell us about the AI (white)

- Headline "AI did the heavy lifting. Checking it did the important work."
- **Tools:** a row of four text items (Claude in the Claude app · Claude Docs · Claude artifacts · Claude Code), each with what it did. No logos.
- **How I worked:** three linked stages, Structured → Probing → Manual validation, each with one or two example prompts in mono.
- **The big catch:** three steps left to right (stacked on mobile):
  1. First pass: importers paid at 36% vs 7% → "build a client-list converter" (struck through in caution).
  2. Right window: 28% vs 10%; with the three key actions counted, odds ratio 0.98: adds nothing.
  3. Carepatron already has "Import from another platform" (linked source) → **"So the tool became Open Slot instead."**
- **Smaller catches:** three compact items (spam filter 21 → 25; the 20-hour trigger caught 86%; the tool's two bugs).
- **What I took from it:** three one-line lessons.

### Footer (navy)

Byline line, data line, three links (full findings doc · Open Slot · GitHub repository). Mobile: stacked.

---

## 2. Charts for "Read the data"

All charts are hand-built SVG (no D3; see §4 note on performance), drawn from `window.FINDINGS`. Each has: a title stating the finding with its number, axes from zero, a source line, `role="img"` with an `aria-label`, and a data table that is visible when JavaScript is off and visually hidden when the chart renders.

| Beat | Chart | Why it's the clearest form | Keys read |
| --- | --- | --- | --- |
| 1 Clean first | **Unit chart**: 552 dots; 25 spam and 9 QA dots fade to hollow and slide out to two labelled groups; counter 552 → 518. Side callout: the impersonating names in mono, then "88% of client imports (947 of 1,075)" and "85% of portal invites (1,311 of 1,544)". | Removal is the message; a bar would hide *what* was removed. Seeing a cluster leave makes the cleaning step feel deliberate, not cosmetic. | `cleaning.workspaces_raw`, `spam_accounts`, `qa_accounts`, `removed_total`, `spam_practice_names`, `spam_clinical_events`, `spam_median_active_hours`, `spam_paid`, `imports_from_spam`, `imports_total`, `imports_from_spam_pct`, `portal_invites_from_spam`, `portal_invites_total`, `portal_invites_from_spam_pct`, `spam_caught_by_domain_filter`, `duplicate_event_rows`, `events_raw`; `base.practices` |
| 2 The cliff | **Step line**, x = day 0–14, y = % of practices with any activity on or after that day (0–100%). The 100 → 54.6 drop between day 0 and day 1 is shaded and annotated "45% (235 of 518) never came back. None paid." Nothing else annotated. | A cliff is a shape; a line shows it instantly and shows honestly what happens after. | `dropoff.retention_curve_pct[]`, `never_back_after_day0`, `never_back_after_day0_pct`, `never_back_after_day0_paid`; `base.practices`. Text: `day0_leavers_median_events`, `day0_leavers_used_scribe_booking_or_invoice`, `return_timing.first_session_*` |
| 3 Coming back early | **Two horizontal bars with 95% whiskers**: came back days 1–3, 30.0% (33 of 110, 22.2–39.1%) vs didn't, 4.6% (18 of 395, 2.9–7.1%). Base line: "Among the 505 practices not yet paid by day 3." Inline chip: High that the link exists; partly circular. | Two rates, one comparison: bars from zero are the most honest form, and the intervals show the gap isn't noise. | `dropoff.returned_day1to3.*`, `dropoff.not_returned_day1to3.*`, `early_window.practices_not_paid_by_day3`, `early_window.of_which_paid_later`, `return_timing.median_first_return_days` |
| 4 Real work vs trying it out | **Dumbbell plot, 13 rows**, x = % paid (0–50%). Each row: grey dot "didn't", dot "did" with its 95% interval as a thin bar, joined by a line; a solid hairline reference line at 12.4% overall. Two groups: **"Still goes with paying after allowing for activity"** (scribe, booking, invoice, in teal) and **"Doesn't, once activity is allowed for"** (10 rows in grey, sorted by "did" rate). Right-hand mono label per row: practices that did it and share of trials. Two grey rows get a short note: video ("only 51 practices; can't be told from chance") and import ("adds nothing once the three are counted, odds ratio 0.98"). | Shows all 13 at once, so nobody suspects cherry-picking, and the grouping explains why video and importing (big raw gaps) aren't highlighted. | `signals[]`: `action`, `practices_did`, `conversion_did_pct`, `conversion_did_ci`, `conversion_not_pct`, `share_of_trials_pct`, `adj_odds_ratio`, `holds_after_activity`; `joint_model.client_created_import.odds_ratio`; `base.conversion_pct` |
| 5 They add up | **Four columns with 95% whiskers**: 0, 1, 2, 3 key actions → 7.3%, 12.7%, 27.3%, 47.4%. Fill: grey for none, then three steps of the teal ramp. n under each (331, 102, 66, 19); the last column carries "only 19 practices". Callout beside it: "Any of the three: 21.4%, about three times the rate of none (7.3%)." | Ordered categories with a clear rise; columns read left to right like a staircase. The whiskers stop the 47% from being over-read. | `dose_response[]`: `key_actions_done`, `practices`, `paid`, `conversion_pct`, `conversion_ci`; `any_key_action.*`; `no_key_action.*` |
| 6 What it doesn't explain | **Three caveat cards** (caution top rule), each with a tiny visual: (a) a 64-dot strip with 24 hollow: "24 of 64 payers did none of the three; median day 3 vs day 15.2"; (b) a 64-dot strip with 20 marked: "20 of 64 paid after day 14"; (c) three mini bars, US 15.4% (55 of 357), UK 2.1% (1 of 48), Canada 2.2% (1 of 45), with "7 UK/Canadian practices opened the billing page; none paid, vs 43.2% in the US". Under the cards, a full-width caution note: X4, correlation not cause. | Caveats get the same visual care as findings, so they read as honesty, not small print. | `caveats.payers_without_key_actions`, `payers_without_key_actions_median_pay_day`, `payers_with_key_actions_median_pay_day`, `payers_paid_after_day14`, `country.US/GB/CA.*`, `gb_ca_viewed_billing`, `gb_ca_viewed_billing_paid`, `us_billing_viewer_conversion_pct`; `base.paid` |
| Close | **Confidence rows**: the seven findings verbatim from the confidence table, each with a chip: High (navy solid), Medium (navy outline), Low (caution outline). The Medium row carries its full reason. | Exact wording from the register, so nothing gets softened. | static text (no numbers except "30% vs 5%": `dropoff.returned_day1to3.conversion_pct`, `not_returned_day1to3.conversion_pct`) |

Other charts outside section 01:

| Where | Chart | Keys |
| --- | --- | --- |
| Hero | 518-dot field, 235 hollow, 64 teal | `base.practices`, `base.paid`, `dropoff.never_back_after_day0` |
| 04 problem | 518-dot strip, 56 teal | `signals[client_booked_online].practices_did`, `share_of_trials_pct`, `conversion_did_pct`, `conversion_not_pct` |
| 05 big catch | Paired bars that re-draw: 36.3 vs 7.2 → 28.2 vs 9.8, then the "odds ratio 0.98" label | `ai_story.*` |

**Mobile (375px):** dumbbell labels move above each row; retention ticks at 0, 7, 14 only; dose columns stay vertical (4 fit); unit charts drop to about 9px dots; caveat cards stack. Hover tooltips on bars and dots also show on keyboard focus; every value is also in the table, so tooltips never gate anything.

**Source line under each chart** (window adjusted per chart), e.g. "Carepatron sample data (fictional) · 518 practices · events in days 0–14 before payment". The cliff chart says "any event after sign-up"; beat 3 says "505 practices not yet paid by day 3 · events on days 1–3".

**Binding:** formatters `pct0`, `pct1`, `int`, `int,`, `ci`, and two I need to add:
- `or` must be **two significant figures**, not one decimal, or the import odds ratio 0.98 would print as "1.0" and flip its meaning (2.42 → 2.4, 0.98 → 0.98).
- `d1` for days and months (2.6 days, 15.2, 4.6 months).

Paths resolve array items by `key` (`signals.ai_scribe_used.practices_did`) or index (`dose_response.3.conversion_pct`). I'll also add a small stdlib check (`analysis/check_bindings.py`) that confirms every fallback text equals its formatted value, because `verify_site.py` checks that numbers *exist* in findings, not that each sits in the right place.

---

## 3. Motion plan

GSAP 3.12.5 + ScrollTrigger 3.12.5 from cdnjs, loaded `defer`. **Content is final in the HTML.** JavaScript sets an element's start state only at the moment its animation begins, so nothing is ever hidden waiting for a trigger, and with JavaScript off everything is visible (charts show as their tables).

| Section | The one orchestrated moment | Reduced motion |
| --- | --- | --- |
| Hero | Dots appear in a quick sweep (0.6s), then 235 empty out to hollow rings, then 64 turn teal; the stat strip counts up in step. About 2.2s total, plays on load. | Final dot state, final numbers. |
| 01 | Each beat's chart draws as it enters: dots leave (beat 1); the line draws left to right and the cliff shading drops in (2); bars grow from zero, whiskers after (3); "did" dots slide out from the "didn't" dots so each gap opens (4); columns rise in order (5); cards fade up (6). Each plays once. | Charts drawn in final state. |
| 02 | Journey stepping: as each step's text passes the middle of the screen, its node lights and its connector draws. Scrolling back reverses. | All nodes lit, connectors drawn. |
| 03 | Phone slides up 40px and settles from a 2° tilt, then badges 1–6 pop in sequence. The A/B toggle crossfades the subject line. | Phone in place, badges shown, toggle swaps instantly. |
| 04 | The 56 booking dots light up in the problem strip, then the three how-it-works steps reveal with the connecting line drawing. The demo itself has no animation. | Final state. |
| 05 | Big catch: the bars shrink from 36.3/7.2 to 28.2/9.8, then "0.98" stamps in and step 3 slides in. | Final state, all three steps visible. |

Count-ups: the HTML carries the final number; the animated span is `aria-hidden` with the final value in the parent's label, so screen readers never hear "17%". Count-ups use tabular figures so the width doesn't jitter.

---

## 4. Design tokens

### Colour (refined from CLAUDE.md, contrast measured)

| Token | Value | Role | Contrast |
| --- | --- | --- | --- |
| `--ink-900` | `#0A1A2F` | hero/dark bands, primary text | 17.5:1 on white |
| `--ink-800` | `#10243F` | raised surfaces on navy (phone, cards) | |
| `--ink-700` | `#1D3354` | secondary dark surfaces, whiskers | 12.7:1 on white |
| `--paper` | `#F6F8FB` | page background | |
| `--surface` | `#FFFFFF` | panels | |
| `--line` | `#DCE3ED` | rules, gridlines (light) | |
| `--line-dark` | `rgba(255,255,255,.12)` | rules on navy | |
| `--muted` | `#5A6B85` | secondary text on light | 5.4:1 on white |
| `--muted-on-dark` | `#AAB8CC` | secondary text on navy | 8.7:1 on navy |
| `--chart-other` | `#8A97AB` | "everything else" marks | 3.0:1, always with labels + table |
| `--signal` | `#0FB5A6` | signal on navy | 6.8:1 on navy |
| `--signal-mark` | `#0B9488` | signal marks on light | 3.8:1 on white |
| `--signal-text` | `#087A70` | signal text on light | 5.2:1 on white |
| `--signal-ramp` | `#9FE3DC → #3CC4B6 → #0B9488` | dose columns 1, 2, 3 | ordinal |
| `--cobalt` | `#3D63F5` | links, buttons, focus on light | 4.9:1 on white; white text on it 4.9:1 |
| `--cobalt-on-dark` | `#7C93FF` | links on navy | 6.2:1 on navy |
| `--caution` | `#E8A33D` | caveat rules, icons, Low chip border | 8.1:1 on navy (fill only on light) |
| `--caution-text` | `#9A5B0B` | caveat text on light | 5.4:1 on white |

Colour meaning everywhere: teal = key actions / real client work / success; grey = everything else; caution = caveats. The retention line and the "came back" bar use ink, not teal, because returning isn't one of the three actions.

The navy hero has a very faint 1px grid (4% white) to suggest precision. No gradients.

### Type

| Role | Font | Size (fluid) | Line height | Tracking |
| --- | --- | --- | --- | --- |
| Hero H1 | Sora 600 | clamp(2.25rem, 1.4rem + 3.2vw, 4rem) | 1.05 | −0.025em |
| Section H2 | Sora 600 | clamp(1.75rem, 1.2rem + 2vw, 2.75rem) | 1.1 | −0.02em |
| Beat H3 | Sora 600 | clamp(1.25rem, 1.05rem + 0.8vw, 1.5rem) | 1.2 | −0.01em |
| Lead | Plex Sans 400 | 1.25rem | 1.5 | |
| Body | Plex Sans 400 | 1.0625rem (17px), max 65ch | 1.6 | |
| Small / source line | Plex Sans 400 | 0.8125rem | 1.45 | |
| Eyebrow, nav, chips | Plex Mono 500 | 0.75rem, uppercase | 1.2 | +0.08em |
| Stat figures | Plex Mono 500, tabular | clamp(2.25rem, 1.6rem + 2.4vw, 3.5rem) | 1 | −0.03em |
| Chart axes | Plex Mono 400, tabular | 0.75rem | | |
| Chart data labels | Plex Mono 500, tabular | 0.8125rem | | |

Weights loaded: Sora 600/700, Plex Sans 400/500/600, Plex Mono 400/500, `display=swap`. Headings use `text-wrap: balance`, body `text-wrap: pretty`.

### Spacing and layout

- 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Section padding: clamp(64px, 10vw, 128px) top and bottom.
- Max width 1200px; 12-column grid, 24px gaps desktop; side gutter 16px (mobile), 24px (tablet), 32px (desktop).
- Radius: 2px on chart panels (crisp, not bubbly), 8px on buttons and inputs, 999px on chips, 28px on the phone, 12px on the demo frame. Most content is separated by hairlines and whitespace, not cards, so it doesn't look like a card template.
- Shadow: one "lift" shadow, used only on the phone and the demo frame.
- Breakpoints: base 375, 600, 768, 1024, 1280.

### Performance note

Hand-built SVG instead of D3 saves about 90KB gzipped; the charts are simple (dots, bars, one step line). With GSAP + ScrollTrigger (about 45KB gzipped), fonts preconnected and the iframe lazy, Lighthouse mobile 90+ is realistic. If you'd rather have D3 for any reason, it's an easy switch.

---

## 5. Selling Open Slot in 30 seconds

The reader's path, timed:

1. **0–5s, the problem.** Headline plus the dot strip: 56 of 518 dots light teal. "A client booking online is one of the three moments that go with paying, yet only 11% of trials (56 of 518) ever got one."
2. **5–10s, the idea.** "Open Slot: a free tool that turns a practitioner's booking link into ready-to-paste wording for every place a new client might find them, plus a printable QR card." Chips: Free · No sign-up · Nothing stored.
3. **10–15s, how it works.** Three steps with small line drawings: details + link → the kit (directory profile, enquiry reply, email signature, bio, voicemail, out-of-office, printable card) → copy, paste, print.
4. **15–25s, it's real.** The live demo, pre-filled with example details so it is already showing output before anyone types. Changing the name or tone updates every output live.
5. **25–30s, why say yes.** Two jobs side by side. *Activation:* it's Email 2 in the journey (links back to 02); a booking page only brings in bookings if clients can find the link. *Acquisition:* useful to any practitioner, Carepatron user or not, and links to the free trial with UTM tracking (the tool's footer link already carries `utm_source=open-slot`). Then the low-risk row: runs in the browser, no backend, no accounts, nothing stored or sent.
6. **For the reader who keeps going:** how we'd measure it (tool sessions → copies per session and which outputs → trial clicks via UTM → among Email 2 recipients, share with a first online booking within 7 days vs the holdout), "No targets are claimed until there's data", and what I'd do next.

No user numbers, ratings or projected results anywhere in the section.

**How the demo is embedded**

- `tool/index.html` = `tool/open-slot.html` plus `<!doctype html>`, `<html lang="en">`, a `<head>` with charset, viewport, its title, fonts and styles, and `<body>`. All features kept: live outputs, tone switch, services editor, QR card, copy buttons. QR library stays at `qrcode-generator@1.4.4`.
- Restyled to the site tokens: Sora/Plex instead of Bricolage/Source Sans; buttons in cobalt; the "copied" state in teal. It keeps its own dark mode when opened on its own.
- Embed mode, `tool/?embed=1`: hides the tool's own title block (the section already introduces it) but keeps the "Example details are filled in" note and its footer (independence note + trial link); forces light theme; and posts its content height to the page so the iframe grows to fit (no scroll-inside-scroll on phones). `postMessage` works when served and when opened from disk.
- `<iframe src="tool/?embed=1" title="Open Slot booking-link kit" loading="lazy" allow="clipboard-write">` inside a browser-style frame, fallback height 1100px; "Open the full tool ↗" link above and below.
- In embed mode the "Copied" toast (currently fixed to the bottom of the tool's window, which inside a tall iframe could be off-screen) is replaced by the button's own "Copied" state.

---

## 6. Claims I think are unclear

1. **The AI story vs the journey's entry (most important).** The AI section says the first trigger was wrong because it "would have caught 86% of trials" (A4). The final journey enters "about 85% of new trials" (J1). A sharp reader will see a contradiction. The real point is that leavers can't be told apart at the end of day 0, so the design stopped trying to target them: it enters everyone who hasn't come back, with a holdout, and every later step reacts to behaviour. I'll write the catch that way: "aimed at the 45%, it would have caught 86%, because leavers and later returners look identical at the end of day 0. So the journey stopped pretending to target leavers…"
2. **"Days 1–4" (D6) is really 20–96 hours after sign-up.** The bucket starts at hour 20, inside day 0, and there's also a 0–20h group (20.3%) not mentioned. D2 (days 1–3, 30%) and D6 (days 1–4, 33%) are close enough to confuse skimmers. Plan: use D2 for the chart; use D6 only in "Why day 4", worded "first came back between 20 and 96 hours after sign-up".
3. **The retention curve is not "nearly flat" after day 1.** It holds near 53–55% to day 4, then falls to 11.4% by day 14 (trials reaching the end). The chart will show the real shape and annotate only the cliff; no copy will say "flat". Also "after day one" in the first hero option could be read as day 1, so I've used "after their first day".
4. **"34 fake accounts" in the stat strip.** 9 of them are internal QA accounts, not fake. I'll say "34 spam and test accounts removed".
5. **The journey's decision rule vs its sample size.** The test is sized to detect +8 points (about 1,000 entrants) but the rule says keep it at +5. By my rough check, at about 1,000 entrants a 5-point difference has a 95% interval of roughly ±5 points, so it could be noise. See question 3.
6. **"They add up" (S4)** can read as additive effects. I'd title the beat "The more of the three, the higher the paid rate", with the correlation note nearby.
7. **Intervals in the dumbbell plot.** `findings.json` has 95% intervals only for practices that *did* each action, not for those that didn't. I'll show the "did" intervals and say so in the caption. If you want both, it means adding them to `analysis.py`.
8. **The tool's footer says "Most practice management software includes one [a booking page]".** That's not in the claims register. I'd change it to "Many practice management tools include one" or drop the clause. (Its other line, that Carepatron includes a booking page with its 14-day trial, is supported by the brief.)
9. **Hero subhead "a free tool that helps"** is a mild outcome claim. Suggest "a free tool built for one of those moments".

---

## 7. Questions for you

1. **Findings doc link.** What's the shareable URL of your Claude Docs findings (with link sharing on)? It's used by "Read the full findings" and the footer. Until then I'll use a placeholder and flag it.
2. **Hero headline.** I recommend "Almost half of new practices never come back after their first day." (it's the most striking, and the dot field shows it). The alternative is "The trials that pay start doing real client work early." Which?
3. **Journey decision rule** (claim 5 above). Options: (a) "keep it if the primary measure rises 5+ points *and* its 95% interval excludes zero"; (b) keep +5 and add the sample size for +5 to `analysis.py`; (c) change the rule to +8 to match the sizing. I'd pick (a).
4. **AI tools.** Anything beyond Claude (app), Claude Docs, Claude artifacts and Claude Code to list?
5. **Setup for the checks.** Python 3.11 is installed but not on PATH and has no pandas/SciPy/statsmodels, so gate 1 (`analysis.py --check`) can't run yet. May I run `pip install -r requirements.txt` for it? For gate 3 I'd use the built-in browser to dump the rendered text rather than install Playwright.

Also needed later (deploy, not now): the repo name; I'll suggest `carepatron-growth-challenge`.

---

## 8. Build order (after approval)

1. Tokens, base layout, nav, hero (+ dot field) → screenshots at 375 and 1440.
2. 01, beat by beat, with tables and bindings → screenshots.
3. 02 journey → 03 message → screenshots.
4. `tool/index.html` + embed → 04 → screenshots, every tool feature tested.
5. 05 and footer → screenshots.
6. Then Phase 3 gates.

`PLAN.md` is a working file; I'll leave it out of the public repo unless you want it in.
