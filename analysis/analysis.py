#!/usr/bin/env python3
"""
Regenerates every number used in the findings doc and on the site, from the raw CSVs.

    python3 analysis/analysis.py            # writes data/findings.json
    python3 analysis/analysis.py --check    # recomputes and fails if findings.json differs

Requires: pandas, numpy, scipy, statsmodels  (pip install pandas numpy scipy statsmodels)

Definitions (used everywhere):
- Genuine practices: all workspaces minus 25 spam accounts (no clinical activity AND 10+ portal
  invites) and 9 internal QA accounts (owner email on carepatron-staff.example). Duplicate event
  rows are dropped first.
- Trial clock starts at the workspace_created event (UTC). "Day d" = days since that moment.
- "Did X" = did it at least once in days 0-14 AND before paying (for payers).
- Outcome = paid_within_30_days.
- Conversion intervals are 95% Wilson intervals.
- "Holds after allowing for activity" = p < 0.05 in a logistic regression of paying on that action
  plus the number of distinct active days (days 0-14, before paying).
"""
import json
import pathlib
import sys
import warnings

warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf
from scipy.stats import fisher_exact
from statsmodels.stats.multitest import multipletests
from statsmodels.stats.power import NormalIndPower
from statsmodels.stats.proportion import proportion_confint, proportion_effectsize

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "findings.json"


def r1(x):
    return round(float(x), 1)


def r2(x):
    return round(float(x), 2)


def pct(k, n):
    return r1(100 * k / n) if n else None


def wilson(k, n):
    lo, hi = proportion_confint(k, n, method="wilson")
    return [r1(lo * 100), r1(hi * 100)]


def build():
    t = pd.read_csv(RAW / "trials.csv")
    e_raw = pd.read_csv(RAW / "events.csv")
    e = e_raw.drop_duplicates().copy()
    e["ts"] = pd.to_datetime(e.timestamp_utc, utc=True)
    t["paid_ts"] = pd.to_datetime(t.paid_at_utc, utc=True)
    t["dom"] = t.owner_email.str.split("@").str[1]

    # ---------------- cleaning ----------------
    clin = ["note_created", "appointment_created", "ai_scribe_used", "template_opened"]
    per_ws = e.groupby("workspace_id").agg(
        inv=("event", lambda s: (s == "client_portal_invite_sent").sum()),
        clin=("event", lambda s: s.isin(clin).sum()),
    )
    spam = set(per_ws[(per_ws.clin == 0) & (per_ws.inv >= 10)].index)
    qa = set(t[t.dom == "carepatron-staff.example"].workspace_id)
    domain_rule = set(t[t.dom.isin(["tempbox.example", "quickinbox.example"])].workspace_id)

    spam_span_h = (
        e[e.workspace_id.isin(spam)].groupby("workspace_id").ts.agg(lambda s: (s.max() - s.min()).total_seconds() / 3600)
    )
    imports = e[e.properties == "source=import"]
    invites = e[e.event == "client_portal_invite_sent"]
    y_all = t.set_index("workspace_id").paid_within_30_days.eq("yes")
    imp_any = y_all.index.isin(imports.workspace_id)
    keep_all = ~y_all.index.isin(spam | qa)

    bp = e[e.event == "billing_page_viewed"].merge(t[["workspace_id", "paid_ts"]], on="workspace_id")
    bp_payers = bp[bp.paid_ts.notna()]

    cleaning = {
        "workspaces_raw": int(len(t)),
        "events_raw": int(len(e_raw)),
        "duplicate_event_rows": int(len(e_raw) - len(e)),
        "spam_accounts": len(spam),
        "qa_accounts": len(qa),
        "removed_total": len(spam | qa),
        "spam_caught_by_domain_filter": len(domain_rule & spam),
        "spam_missed_by_domain_filter": len(spam - domain_rule),
        "spam_paid": int(y_all[list(spam)].sum()),
        "qa_paid": int(y_all[list(qa)].sum()),
        "spam_practice_names": sorted(t[t.workspace_id.isin(spam)].practice_name.unique().tolist()),
        "spam_median_active_hours": r1(spam_span_h.median()),
        "spam_clinical_events": int(e[e.workspace_id.isin(spam) & e.event.isin(clin)].shape[0]),
        "imports_total": int(len(imports)),
        "imports_from_spam": int(imports.workspace_id.isin(spam).sum()),
        "imports_from_spam_pct": pct(imports.workspace_id.isin(spam).sum(), len(imports)),
        "portal_invites_total": int(len(invites)),
        "portal_invites_from_spam": int(invites.workspace_id.isin(spam).sum()),
        "portal_invites_from_spam_pct": pct(invites.workspace_id.isin(spam).sum(), len(invites)),
        "import_conversion_with_junk_pct": pct(y_all[imp_any].sum(), imp_any.sum()),
        "import_conversion_clean_any_time_pct": pct(y_all[imp_any & keep_all].sum(), (imp_any & keep_all).sum()),
        "payer_billing_views_after_payment_pct": pct((bp_payers.ts >= bp_payers.paid_ts).sum(), len(bp_payers)),
        "all_billing_views_after_payment_pct": pct((bp.ts >= bp.paid_ts).sum(), len(bp)),
    }

    # ---------------- clean population ----------------
    T = t[~t.workspace_id.isin(spam | qa)].copy()
    start = e[e.event == "workspace_created"].set_index("workspace_id").ts
    T["start"] = T.workspace_id.map(start)
    T["y"] = (T.paid_within_30_days == "yes").astype(int)
    T["pay_day"] = (T.paid_ts - T.start).dt.total_seconds() / 86400
    Ti = T.set_index("workspace_id")
    y = Ti.y
    E = e[e.workspace_id.isin(T.workspace_id)].merge(T[["workspace_id", "start", "paid_ts", "y"]], on="workspace_id")
    E["day"] = (E.ts - E.start).dt.total_seconds() / 86400
    E["src"] = E.properties.str.extract(r"source=(\w+)")[0]
    E["ev"] = np.where(E.event == "client_created", "client_created:" + E.src.fillna(""), E.event)
    W = E[(E.day <= 14) & (E.paid_ts.isna() | (E.ts < E.paid_ts))]  # first 14 days, before paying
    A = E[E.event != "workspace_created"]

    base = {
        "practices": int(len(T)),
        "paid": int(y.sum()),
        "conversion_pct": pct(y.sum(), len(T)),
        "conversion_ci": wilson(y.sum(), len(T)),
        "signup_months": "July-August 2026",
        "signups_per_month": r1(len(T) / 2),
        "july_conversion_pct": pct(T[T.start.dt.month == 7].y.sum(), (T.start.dt.month == 7).sum()),
        "august_conversion_pct": pct(T[T.start.dt.month == 8].y.sum(), (T.start.dt.month == 8).sum()),
    }

    # ---------------- signals ----------------
    names = {
        "client_booked_online": "A client booked online",
        "invoice_sent": "Sent an invoice",
        "ai_scribe_used": "Used the AI scribe",
        "video_call_started": "Ran a video call",
        "client_created:import": "Imported clients",
        "intake_form_sent": "Sent an intake form",
        "client_portal_invite_sent": "Sent a portal invite",
        "client_created:manual": "Added a client by hand",
        "template_opened": "Opened a template",
        "appointment_created": "Created an appointment",
        "note_created": "Wrote a note",
        "appointment_reminder_sent": "Reminder sent to a client",
        "staff_invited": "Invited a team member",
    }
    R = (W.groupby(["workspace_id", "ev"]).size().unstack(fill_value=0) > 0).reindex(y.index, fill_value=False)
    Wd = W.assign(d=np.floor(W.day))
    active_days = Wd[Wd.event != "workspace_created"].groupby("workspace_id").d.nunique()
    D = pd.DataFrame({"y": y})
    D["active_days"] = active_days.reindex(D.index).fillna(0)
    rows = []
    for key, label in names.items():
        a = R[key]
        k, n = int(y[a].sum()), int(a.sum())
        k0, n0 = int(y[~a].sum()), int((~a).sum())
        p = fisher_exact([[k, n - k], [k0, n0 - k0]])[1]
        col = key.replace(":", "_")
        D[col] = a.astype(int)
        m = smf.logit(f"y ~ {col} + active_days", D).fit(disp=0)
        ci = np.exp(m.conf_int().loc[col])
        rows.append({
            "key": col, "action": label, "practices_did": n, "paid_did": k,
            "conversion_did_pct": pct(k, n), "conversion_did_ci": wilson(k, n),
            "conversion_not_pct": pct(k0, n0),
            "share_of_trials_pct": pct(n, len(T)),
            "fisher_p": float(p),
            "adj_odds_ratio": r2(np.exp(m.params[col])), "adj_or_ci": [r2(ci[0]), r2(ci[1])],
            "adj_p": float(m.pvalues[col]),
        })
    S = pd.DataFrame(rows)
    S["fisher_p_bh"] = multipletests(S.fisher_p, method="fdr_bh")[1]
    S["adj_p_bh"] = multipletests(S.adj_p, method="fdr_bh")[1]
    S["holds_after_activity"] = S.adj_p < 0.05
    for c in ["fisher_p", "adj_p", "fisher_p_bh", "adj_p_bh"]:
        S[c] = S[c].map(lambda v: float(f"{v:.4g}"))
    signals = S.to_dict("records")

    jm = smf.logit("y ~ ai_scribe_used + client_booked_online + invoice_sent + video_call_started + client_created_import + active_days", D).fit(disp=0)
    jci = np.exp(jm.conf_int())
    joint = {k: {"odds_ratio": r2(np.exp(jm.params[k])), "ci": [r2(jci.loc[k, 0]), r2(jci.loc[k, 1])], "p": float(f"{jm.pvalues[k]:.3g}")}
             for k in ["ai_scribe_used", "client_booked_online", "invoice_sent", "video_call_started", "client_created_import"]}

    core = ["ai_scribe_used", "client_booked_online", "invoice_sent"]
    D["n_core"] = D[core].sum(1)
    dose = []
    for k_ in range(4):
        s = D[D.n_core == k_]
        dose.append({"key_actions_done": k_, "practices": int(len(s)), "paid": int(s.y.sum()),
                     "conversion_pct": pct(s.y.sum(), len(s)), "conversion_ci": wilson(s.y.sum(), len(s))})
    any_core = D[D.n_core > 0]
    no_core = D[D.n_core == 0]

    # ---------------- early window: days 0-3, among practices not yet paid by day 3 ----------------
    alive = Ti[(Ti.pay_day.isna()) | (Ti.pay_day > 3)]
    W3 = E[(E.day <= 3) & E.workspace_id.isin(alive.index)]
    early = {"practices_not_paid_by_day3": int(len(alive)), "of_which_paid_later": int(alive.y.sum())}
    for key in ["ai_scribe_used", "client_booked_online", "invoice_sent", "client_created:import"]:
        a = alive.index.isin(W3[W3.ev == key].workspace_id)
        early[key.replace(":", "_")] = {
            "practices_did": int(a.sum()), "paid_did": int(alive.y[a].sum()),
            "conversion_did_pct": pct(alive.y[a].sum(), a.sum()), "conversion_did_ci": wilson(alive.y[a].sum(), a.sum()),
            "conversion_not_pct": pct(alive.y[~a].sum(), (~a).sum()),
        }
    first_use = W.groupby(["workspace_id", "ev"]).day.min().unstack()
    early["median_first_use_day"] = {k: r1(first_use[k].median()) for k in core}

    # ---------------- drop-off ----------------
    last = A.groupby("workspace_id").day.max().reindex(Ti.index).fillna(0)
    gone = last < 1
    ret13 = alive.index.isin(A[(A.day >= 1) & (A.day <= 3)].workspace_id)
    d0 = Ti.index[gone]
    d0_events = A[A.workspace_id.isin(d0)]
    dropoff = {
        "never_back_after_day0": int(gone.sum()),
        "never_back_after_day0_pct": pct(gone.sum(), len(Ti)),
        "never_back_after_day0_paid": int(Ti.y[gone].sum()),
        "retention_curve_pct": [{"day": d, "pct_active_on_or_after": pct((last >= d).sum(), len(Ti))} for d in range(15)],
        "returned_day1to3": {"practices": int(ret13.sum()), "paid": int(alive.y[ret13].sum()),
                             "conversion_pct": pct(alive.y[ret13].sum(), ret13.sum()), "conversion_ci": wilson(alive.y[ret13].sum(), ret13.sum())},
        "not_returned_day1to3": {"practices": int((~ret13).sum()), "paid": int(alive.y[~ret13].sum()),
                                 "conversion_pct": pct(alive.y[~ret13].sum(), (~ret13).sum()), "conversion_ci": wilson(alive.y[~ret13].sum(), (~ret13).sum())},
        "day0_leavers_median_events": r1(d0_events.groupby("workspace_id").size().median()),
        "day0_leavers_used_scribe_booking_or_invoice": int(d0_events[d0_events.event.isin(core)].workspace_id.nunique()),
        "day0_leavers_top_actions": {k: int(v) for k, v in d0_events.ev.value_counts().head(5).items()},
    }

    # session-based return timing (first session = events chained with gaps under 2 hours)
    ret_h, n1, len1, scribe1 = {}, {}, {}, {}
    for ws, g in E.sort_values("ts").groupby("workspace_id"):
        h = g.day.values * 24
        end, k_, r = h[0], 1, np.nan
        for v in h[1:]:
            if v - end < 2:
                end, k_ = v, k_ + 1
            else:
                r = v
                break
        ret_h[ws], n1[ws], len1[ws] = r, k_ - 1, end * 60
        scribe1[ws] = bool((g.iloc[:k_].event == "ai_scribe_used").any())
    Ti["ret_h"] = pd.Series(ret_h)
    Ti["n1"] = pd.Series(n1)
    Ti["len1"] = pd.Series(len1)
    Ti["pay_h"] = Ti.pay_day * 24
    never = Ti.ret_h.isna()
    later = Ti.ret_h > 20

    def bucket(lo, hi):
        s = Ti[(Ti.ret_h > lo) & (Ti.ret_h <= hi)]
        return {"practices": int(len(s)), "paid": int(s.y.sum()), "conversion_pct": pct(s.y.sum(), len(s))}

    no_ret_20 = Ti[((Ti.ret_h.isna()) | (Ti.ret_h > 20)) & ~(Ti.pay_h < 20)]
    timing = {
        "median_first_return_hours": r1(Ti.ret_h.median()),
        "median_first_return_days": r1(Ti.ret_h.median() / 24),
        "no_return_by_20h_pct_of_trials": pct(len(no_ret_20), len(Ti)),
        "first_return_0_20h": bucket(0, 20),
        "first_return_20_96h": bucket(20, 96),
        "first_return_after_96h": bucket(96, 10_000),
        "first_session_events_never_returned": r1(Ti[never].n1.mean()),
        "first_session_events_returned_later": r1(Ti[later].n1.mean()),
        "first_session_minutes_never_returned": r1(Ti[never].len1.mean()),
        "first_session_minutes_returned_later": r1(Ti[later].len1.mean()),
        "first_session_scribe_users": int(sum(scribe1.values())),
    }

    # ---------------- what it doesn't explain ----------------
    P = Ti[Ti.y == 1].copy()
    P["core"] = R.reindex(P.index, fill_value=False)[core].any(axis=1)
    pre_bp = bp[(bp.paid_ts.isna()) | (bp.ts < bp.paid_ts)]
    Ti["viewed_billing"] = Ti.index.isin(pre_bp.workspace_id)
    Ti["scribe"] = Ti.index.isin(W[W.event == "ai_scribe_used"].workspace_id)
    country = {}
    for c in ["US", "AU", "GB", "CA", "NZ"]:
        s = Ti[Ti.country == c]
        if len(s) == 0:
            continue
        country[c] = {"practices": int(len(s)), "paid": int(s.y.sum()), "conversion_pct": pct(s.y.sum(), len(s)),
                      "scribe_use_pct": pct(s.scribe.sum(), len(s)),
                      "viewed_billing": int(s.viewed_billing.sum()), "viewed_billing_paid": int(s[s.viewed_billing].y.sum())}
    team = {}
    for g in ["1", "2-5", "6+"]:
        s = Ti[Ti.team_size_at_signup == g]
        team[g] = {"practices": int(len(s)), "paid": int(s.y.sum()), "conversion_pct": pct(s.y.sum(), len(s))}
    gbca = Ti[Ti.country.isin(["GB", "CA"])]
    us = Ti[Ti.country == "US"]
    caveats = {
        "payers_without_key_actions": int((~P.core).sum()),
        "payers_without_key_actions_median_pay_day": r1(P[~P.core].pay_day.median()),
        "payers_with_key_actions_median_pay_day": r1(P[P.core].pay_day.median()),
        "payers_without_key_actions_median_events": r1(W[W.workspace_id.isin(P.index[~P.core])].groupby("workspace_id").size().median()),
        "payers_paid_after_day14": int((P.pay_day > 14).sum()),
        "payers_paid_within_24h": int((P.pay_day < 1).sum()),
        "median_pay_day_all_payers": r1(P.pay_day.median()),
        "country": country,
        "gb_ca_viewed_billing": int(gbca.viewed_billing.sum()),
        "gb_ca_viewed_billing_paid": int(gbca[gbca.viewed_billing].y.sum()),
        "us_billing_viewer_conversion_pct": pct(us[us.viewed_billing].y.sum(), us.viewed_billing.sum()),
        "team_size": team,
        "re_signups_same_email": int(T.owner_email.duplicated().sum()),
    }

    # ---------------- robustness ----------------
    rob = {"month_split": {}}
    for mo, label in [(7, "July"), (8, "August")]:
        idx = Ti.index[Ti.start.dt.month == mo]
        rob["month_split"][label] = {}
        for c in core + ["client_created_import"]:
            a = D.loc[idx, c] == 1
            rob["month_split"][label][c] = {"did_pct": pct(D.loc[idx][a].y.sum(), a.sum()), "not_pct": pct(D.loc[idx][~a].y.sum(), (~a).sum())}
    first_ws = T.sort_values("start").drop_duplicates("owner_email").workspace_id.values
    for label, idx in [("dedupe_re_signups", first_ws), ("drop_paid_within_24h", Ti.index[~(Ti.pay_day < 1)])]:
        d = D.loc[idx]
        m = smf.logit("y ~ ai_scribe_used + client_booked_online + invoice_sent + active_days", d).fit(disp=0)
        rob[label] = {"practices": int(len(d)), "paid": int(d.y.sum()),
                      "odds_ratios": {k: r2(np.exp(m.params[k])) for k in core},
                      "p": {k: float(f"{m.pvalues[k]:.3g}") for k in core}}

    # ---------------- journey sizing ----------------
    first_core = E[E.event.isin(core)].groupby("workspace_id").day.min()
    Ti["core_day"] = first_core
    entry = Ti[((Ti.ret_h.isna()) | (Ti.ret_h > 24)) & ~(Ti.pay_h < 24) & ~(Ti.core_day < 1)]
    core_by7 = W[W.event.isin(core) & (W.day <= 7)].workspace_id.unique()
    b_primary = entry.index.isin(core_by7).mean()
    b_return = entry.ret_h.le(96).mean()
    b_paid = entry.y.mean()
    per_month = len(entry) / 2
    pw = NormalIndPower()

    def need(base_, lift, ratio):
        n1_ = pw.solve_power(proportion_effectsize(base_ + lift, base_), alpha=0.05, power=0.8, ratio=ratio)
        return int(round(n1_ * (1 + ratio)))

    journey = {
        "entrants": int(len(entry)), "entrants_pct_of_trials": pct(len(entry), len(Ti)),
        "entrants_per_month": r1(per_month),
        "baseline_key_action_by_day7_pct": r1(b_primary * 100),
        "baseline_return_by_day4_pct": r1(b_return * 100),
        "baseline_paid_pct": r1(b_paid * 100),
        "sample_size": {
            "primary_plus8pts_50_50": need(b_primary, 0.08, 1), "primary_plus8pts_80_20": need(b_primary, 0.08, 0.25),
            "return_plus8pts_50_50": need(b_return, 0.08, 1),
            "paid_plus3pts_50_50": need(b_paid, 0.03, 1), "paid_plus3pts_80_20": need(b_paid, 0.03, 0.25),
        },
    }
    journey["months_at_dataset_volume"] = {k: r1(v / per_month) for k, v in journey["sample_size"].items()}

    # ---------------- the AI story: reproduce the first-pass import figure, then the corrections ----------------
    # First pass (the mistake): spam removed by email domain only (missing 4 accounts), imports counted at any
    # time in the 30 days, including after payment.
    fp = t[~t.workspace_id.isin(domain_rule | qa)].set_index("workspace_id")
    fp_y = fp.paid_within_30_days.eq("yes")
    fp_imp = fp.index.isin(imports.workspace_id)
    ai_story = {
        "first_pass_import_conversion_pct": pct(fp_y[fp_imp].sum(), fp_imp.sum()),
        "first_pass_import_practices": int(fp_imp.sum()),
        "first_pass_no_import_conversion_pct": pct(fp_y[~fp_imp].sum(), (~fp_imp).sum()),
        "corrected_window_import_conversion_pct": next(s["conversion_did_pct"] for s in signals if s["key"] == "client_created_import"),
        "corrected_window_no_import_conversion_pct": next(s["conversion_not_pct"] for s in signals if s["key"] == "client_created_import"),
        "import_odds_ratio_with_key_actions": joint["client_created_import"]["odds_ratio"],
    }

    return {
        "_about": "Generated by analysis/analysis.py from data/raw/*.csv. Do not edit by hand. Data is fictional, supplied by Carepatron for the growth challenge.",
        "ai_story": ai_story,
        "base": base,
        "cleaning": cleaning,
        "signals": signals,
        "joint_model": joint,
        "dose_response": dose,
        "any_key_action": {"practices": int(len(any_core)), "paid": int(any_core.y.sum()), "conversion_pct": pct(any_core.y.sum(), len(any_core))},
        "no_key_action": {"practices": int(len(no_core)), "paid": int(no_core.y.sum()), "conversion_pct": pct(no_core.y.sum(), len(no_core))},
        "early_window": early,
        "dropoff": dropoff,
        "return_timing": timing,
        "caveats": caveats,
        "robustness": rob,
        "journey": journey,
    }


if __name__ == "__main__":
    result = build()
    text = json.dumps(result, indent=2, ensure_ascii=False)
    if "--check" in sys.argv:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current.strip() != text.strip():
            print("MISMATCH: data/findings.json differs from a fresh run of the analysis.")
            sys.exit(1)
        print("OK: data/findings.json matches a fresh run of the analysis.")
    else:
        OUT.write_text(text + "\n", encoding="utf-8")
        # Same data as a script, so the site can load it with <script src="data/findings.js"> (works on
        # GitHub Pages and when index.html is opened straight from disk).
        (OUT.parent / "findings.js").write_text(
            "// Generated by analysis/analysis.py. Do not edit by hand.\nwindow.FINDINGS = " + text + ";\n",
            encoding="utf-8",
        )
        print(f"Wrote {OUT.relative_to(ROOT)} and data/findings.js")
