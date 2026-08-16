"""
Nykaa Fashion — Wishlist Discovery Engine (Part 1) — browser app.

A small Streamlit app to browse the ranked blockers and real quotes, and filter
by category / buyer-segment / blocker. This is the "testable link" for the deck.

Run:  streamlit run app.py
Deploy: Streamlit Community Cloud (point it at this repo, main file app.py).

All numbers come from data/classified.json + outputs/*.csv produced by src/.
External items are labelled and excluded from Nykaa percentages.
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
OUT = ROOT / "outputs"

st.set_page_config(page_title="Nykaa Wishlist Discovery — Part 1", layout="wide")


@st.cache_data
def load():
    items = json.loads((DATA / "classified.json").read_text(encoding="utf-8"))
    df = pd.DataFrame(items)
    df["blocker_codes"] = df["blocker_codes"].apply(list)
    ranking = pd.read_csv(OUT / "opportunity_ranking.csv")
    return df, ranking


if not (DATA / "classified.json").exists():
    st.error("Run the pipeline first:  python src/run_all.py")
    st.stop()

df, ranking = load()
primary = df[~df["is_external"]]
n_primary = len(primary)
pctcol = [c for c in ranking.columns if c.startswith("primary_pct_of_")][0]

st.title("Nykaa Fashion — Wishlist→Purchase Discovery (Part 1)")
st.caption("Why users don't buy items they wishlist within 30 days — across categories. "
           "No monetary incentives; levers are confidence, recall, decision support.")

tag_method = df["tagging_method"].iloc[0] if len(df) else "n/a"
if tag_method.startswith("heuristic"):
    st.warning("⚠️ Tags are **heuristic_v0** (deterministic keyword rules, no LLM yet). "
               "Numbers are **provisional** pending the ~20-item spot-check + optional "
               "Anthropic re-tag. External items are excluded from Nykaa %.")

# ---------------- sidebar filters ----------------
st.sidebar.header("Filters")
show = st.sidebar.radio("Population", ["Primary Nykaa only", "Include external"], index=0)
base = df if show == "Include external" else primary

cats = sorted(base["category_signal"].unique())
segs = sorted(base["segment_signal"].unique())
all_blockers = sorted({b for bl in base["blocker_codes"] for b in bl})

sel_cat = st.sidebar.multiselect("Category", cats)
sel_seg = st.sidebar.multiselect("Buyer segment", segs)
sel_blk = st.sidebar.multiselect("Blocker", all_blockers)
q = st.sidebar.text_input("Search text")

f = base.copy()
if sel_cat:
    f = f[f["category_signal"].isin(sel_cat)]
if sel_seg:
    f = f[f["segment_signal"].isin(sel_seg)]
if sel_blk:
    f = f[f["blocker_codes"].apply(lambda bl: any(b in bl for b in sel_blk))]
if q:
    f = f[f["text"].str.contains(q, case=False, na=False)]

# ---------------- top: ranking ----------------
c1, c2 = st.columns([3, 2])
with c1:
    st.subheader(f"Ranked blockers — Nykaa-measured (n={n_primary} primary)")
    chart_df = ranking.set_index("blocker_code")["primary_count"]
    st.bar_chart(chart_df)
with c2:
    st.subheader("Ranking table")
    st.dataframe(
        ranking[["rank", "blocker_code", "primary_count", pctcol,
                 "external_count", "cross_category_reach", "evidence_strength"]],
        hide_index=True, use_container_width=True)

st.info("**Central tension:** Nykaa's public data shows a **confidence problem** "
        "(trust/quality/validation on top); the **decision-graveyard** blockers "
        "(choice_overload, context_loss) are strong in *external* evidence but barely "
        "appear in post-purchase reviews — a sampling artifact to resolve in Part 3, "
        "not a disproven idea.")

# ---------------- quotes browser ----------------
st.subheader(f"Evidence browser — {len(f)} items")
st.caption("Real collected text. External items are marked.")
for _, it in f.head(200).iterrows():
    ext = " · :orange[external]" if it["is_external"] else ""
    with st.expander(f"[{it['source']}]{ext} — {', '.join(it['blocker_codes'][:3])} "
                     f"· {it['category_signal']} · conf={it['model_confidence']}"):
        st.write(it["text"])
        st.caption(f"quote: “{it['supporting_quote']}”  |  segment: {it['segment_signal']}"
                   + (f"  |  {it['url']}" if it.get("url") else ""))

st.divider()
st.caption("Pipeline: src/collect_* → filter → classify → quantify → segment → synthesize → "
           "handoff. See FINDINGS.md, research_hypotheses.md, interview_guide.md.")
