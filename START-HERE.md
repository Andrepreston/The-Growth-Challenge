# Start here

This folder is everything Claude Code needs to build, check and publish your findings site. It runs in five phases that match your plan. Each phase has a prompt to paste in. Wait for each phase to finish and review it before moving on.

## What's in the folder

| Path | What it is |
| --- | --- |
| `CLAUDE.md` | The project brief. Claude Code reads it automatically at the start of every session: rules, design direction, sections, checks, deploy steps. |
| `content/copy-and-claims.md` | Approved wording for every section, the claims register (each claim with its source), and banned claims. |
| `data/findings.json` / `findings.js` | Every number from the analysis, generated from the raw data. The site's single source of truth. |
| `data/raw/` | Carepatron's sample CSVs. |
| `analysis/analysis.py` | Regenerates every number from the CSVs. `--check` confirms the data file hasn't drifted. |
| `analysis/verify_site.py` | Flags any number on the site that isn't in the findings. |
| `tool/open-slot.html` | The Open Slot booking-link kit, ready to be hosted alongside the site. |
| `reference/` | The challenge brief and your three findings tabs (findings, journey and email, AI). |

## Setup (once)

1. Unzip this folder somewhere sensible, e.g. `~/Projects/carepatron-growth-site`.
2. Open it in Claude Code: run `claude` in a terminal in that folder, or open the folder from the Code tab in the Claude desktop app.
3. For the checks, Python needs: `pip install pandas numpy scipy statsmodels`.
4. For publishing, you need a GitHub account. Claude Code will use the GitHub CLI (`gh`) and will walk you through signing in if needed.

---

## Phase 1: Plan (no code yet)

Use plan mode for this one (Shift+Tab in the terminal until it says plan mode).

```
Read CLAUDE.md, content/copy-and-claims.md, data/findings.json and everything in reference/ before doing anything else.

Then plan the single-page site. I want:
1. A section-by-section wireframe in words for desktop and for mobile: hero, 01 Read the data, 02 Design one journey, 03 Write one message, 04 Ship something, 05 Tell us about the AI, footer.
2. For each finding in "Read the data": the chart you'll use, why it's the clearest way to show that point, and the exact findings.json keys it reads.
3. The motion plan: one orchestrated moment per section, and what happens with reduced motion.
4. Final design tokens (colour, type scale, spacing), refining the palette in CLAUDE.md so it reads as innovation and trust and looks premium.
5. How Ship something will sell Open Slot to a busy manager in 30 seconds, and how the live demo is embedded.
6. Any claim in the copy you think is unclear, and up to 5 questions for me.

Don't write any code until I approve the plan.
```

Review it, push back where something feels generic, then approve.

## Phase 2: Build

```
The plan is approved, with these changes: <your edits, or "none">.

Build the site now, following CLAUDE.md exactly:
- index.html, assets/css/style.css, assets/js/main.js, assets/js/charts.js
- every number bound from window.FINDINGS (data/findings.js), with matching fallback text
- tool/index.html made from tool/open-slot.html, embedded in Ship something

Build it section by section. After each section, serve it locally (python3 -m http.server 8000), take screenshots at 375px and 1440px, and show me before moving on.
```

## Phase 3: Verify the data and the message

```
Run every verification gate in CLAUDE.md section 7 and report the results:
1. analysis.py --check
2. verify_site.py on index.html, assets/js/*.js and tool/index.html
3. the rendered-text check
4. write verification.md, mapping every sentence on the page that states a number or a finding to its claim ID, and search for banned words
5. visual QA at 375, 768, 1280 and 1440px, reduced motion, keyboard, Lighthouse

Then, separately, review it as a sceptical data analyst: does any chart or headline overstate, imply cause, drop a caveat, or show something misleadingly (cut axes, missing intervals, cherry-picked comparisons)? List every issue and fix it. Don't change any number; if a number looks wrong, tell me.
```

## Phase 4: Edit and improve

```
Now review the site as the design lead at a top studio who's been told this is being judged on quality. Be harsh. Give me a prioritised list: where the message isn't clear within 5 seconds, where it looks templated or cheap, spacing and type issues, chart readability, mobile problems, and anything in Ship something that wouldn't convince a busy manager.

Fix the top items, then show me before-and-after screenshots. Re-run verify_site.py after the changes.
```

Repeat this phase until you're happy. Ask for specific changes too ("make the hero stat strip feel more premium", "the journey animation is too busy").

## Phase 5: Publish to GitHub and submit

```
I'm happy with the site. Deploy it following CLAUDE.md section 8:
- re-run all verification gates first
- create a public GitHub repo called <repo name> and push
- enable GitHub Pages from main / root
- check the live site works, including the Open Slot tool and its QR code
- write README.md with the live link and how to reproduce the numbers
Then give me the live URL and the repo URL.
```

---

## Before you submit

- **Your two Claude links are private.** If the site links to the findings doc, turn on link sharing for it from its Share menu. The tool will now be hosted with the site, so its Claude link isn't needed.
- **Open the live site on your phone** and click through every section.
- **Read the AI section in your own voice.** Reviewers may ask about it.
- **Rules that keep you safe:** if you want a number that isn't in `data/findings.json`, it has to come from the analysis first. Ask Claude Code to add it to `analysis/analysis.py` and regenerate; never type it into the site.
