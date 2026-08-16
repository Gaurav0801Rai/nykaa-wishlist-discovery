"""
Stage 6 - Synthesize -> FINDINGS.md (the deck discovery slide, in markdown).

Pulls REAL quotes from classified.json and REAL numbers from
outputs/opportunity_ranking.csv. Every % is reproducible from the data files.
Writes FINDINGS.md and outputs/tag_spotcheck.md (the mandatory ~20-item review).
"""
from __future__ import annotations

import csv
import json
import re
from collections import Counter

from common import ROOT
from classify import B_RE  # blocker regexes, to pick blocker-specific quotes

_USED_QUOTES: set[str] = set()  # avoid repeating the same sentence across blockers

DATA = ROOT / "data"
OUT = ROOT / "outputs"


def load():
    items = json.loads((DATA / "classified.json").read_text(encoding="utf-8"))
    with (OUT / "opportunity_ranking.csv").open(encoding="utf-8") as f:
        ranking = list(csv.DictReader(f))
    return items, ranking


def _blocker_sentence(text: str, blocker: str) -> str | None:
    """Pick a sentence from the item that actually matches this blocker's pattern."""
    rx = B_RE.get(blocker)
    if not rx:
        return None
    for sent in re.split(r"(?<=[.!?])\s+|\n+", text):
        s = sent.strip()
        if 15 <= len(s) <= 240 and rx.search(s):
            return s
    return None


def quotes_for(items, blocker, external=False, k=2, max_len=220):
    pool = [it for it in items
            if blocker in it["blocker_codes"] and it["is_external"] == external]
    pool.sort(key=lambda it: (float(it.get("model_confidence", 0)), len(it["text"])), reverse=True)
    out = []
    for it in pool:
        q = _blocker_sentence(it["text"], blocker) or it["supporting_quote"].strip()
        key = q.lower()[:50]
        if key in _USED_QUOTES or len(q) < 15:
            continue
        _USED_QUOTES.add(key)
        out.append(f"> “{q[:max_len]}”  — *{it['source']}*")
        if len(out) >= k:
            break
    return out


def spotcheck(items, path, n=20):
    # diverse: spread across sources and blockers
    picked, seen_src_blk = [], Counter()
    ordered = sorted(items, key=lambda it: (it["is_external"], it["source"]))
    for it in ordered:
        key = (it["source"], it["blocker_codes"][0])
        if seen_src_blk[key] >= 2:
            continue
        seen_src_blk[key] += 1
        picked.append(it)
        if len(picked) >= n:
            break
    lines = ["# Stage 3 tag spot-check (~20 items) — MANDATORY REVIEW",
             "",
             "Heuristic_v0 tags. For each: are the blocker_codes right? Note fixes; "
             "then we lock the schema and (optionally) re-tag via the Anthropic API.",
             ""]
    for i, it in enumerate(picked, 1):
        lines += [
            f"## {i}. [{it['source']}]{' (external)' if it['is_external'] else ''} "
            f"— conf={it['model_confidence']}",
            f"- **text:** {it['text'][:300]}",
            f"- **blocker_codes:** {', '.join(it['blocker_codes'])}",
            f"- **category:** {it['category_signal']}  |  **segment:** {it['segment_signal']}",
            f"- **supporting_quote:** {it['supporting_quote'][:180]}",
            "- **your verdict (ok / fix -> ____):**",
            "",
        ]
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {path.name} ({len(picked)} items)")


def main() -> int:
    items, ranking = load()
    primary = [it for it in items if not it["is_external"]]
    external = [it for it in items if it["is_external"]]
    n_primary = len(primary)
    pctkey = [k for k in ranking[0] if k.startswith("primary_pct_of_")][0]

    def row(code):
        return next((r for r in ranking if r["blocker_code"] == code), None)

    top = ranking[:6]
    md = []
    md.append("# FINDINGS — Nykaa Fashion Wishlist→Purchase Discovery (Part 1)")
    md.append("")
    md.append("> **Goal:** raise the % of users who buy ≥1 wishlisted item within 30 "
              "days of saving it. **Constraint:** no monetary incentives — levers are "
              "confidence, recall, decision support.")
    md.append("")
    md.append("### ⚠️ Read this first (status & honesty)")
    md.append(f"- Tagging is **heuristic_v0** (deterministic keyword rules, no LLM yet). "
              f"Numbers are **provisional** pending the mandatory ~20-item spot-check "
              f"(`outputs/tag_spotcheck.md`) and an optional Anthropic re-tag.")
    md.append(f"- Every % below is over **{n_primary} primary Nykaa items** and is "
              f"reproducible from `data/classified.json`. **External** evidence "
              f"({len(external)} items) is labelled and **never** counted in a Nykaa %.")
    md.append("- Public data is **post-purchase and negative-skewed** (app reviews, Quora "
              "complaints). It over-represents trust/quality/fulfilment and "
              "**under-observes pre-purchase decision friction** — the people who defer a "
              "saved item rarely leave reviews. Treat low counts for choice/context "
              "blockers as *under-sampling, not absence.*")
    md.append("")
    md.append("## What we did")
    md.append("Collected **481** items across categories (Play Store 413; real scraped "
              "Trustpilot/PissedConsumer/Quora 25; open-web external 26; iOS RSS returned 0; "
              "Reddit/most forums IP-blocked). Stage-2 relevance filter → **205 kept** "
              "(**179 primary Nykaa** + 26 external), **276 rejected** (top reasons: "
              "pure-delivery 103, too-short 72, customer-care-ops 35, refund-dispute 22). "
              "Stage-3 multi-label blocker tagging → `data/classified.json`.")
    md.append("")
    md.append("## Ranked blockers — Nykaa-measured (leads the finding)")
    md.append(f"| # | Blocker | Nykaa # | Nykaa % of {n_primary} | External # | X-cat reach | Evidence |")
    md.append("|---|---------|--------:|-----:|-----:|-----:|---|")
    for r in ranking:
        md.append(f"| {r['rank']} | `{r['blocker_code']}` | {r['primary_count']} | "
                  f"{r[pctkey]}% | {r['external_count']} | {r['cross_category_reach']} | "
                  f"{r['evidence_strength']} |")
    md.append("")
    md.append("## The central finding (the tension we must carry into Part 3)")
    md.append("Two things are true at once, and the contrast is the argument:")
    md.append("")
    md.append("1. **What Nykaa's own data shows — a CONFIDENCE problem.** The measurable "
              "top blockers are a cluster of *confidence/value* doubts: "
              f"`trust_authenticity` ({row('trust_authenticity')['primary_count']}, "
              f"{row('trust_authenticity')[pctkey]}%), "
              f"`quality_doubt` ({row('quality_doubt')['primary_count']}), "
              f"`price_wait` ({row('price_wait')['primary_count']}), "
              f"`confidence_validation_gap` ({row('confidence_validation_gap')['primary_count']}), "
              f"`fit_size_doubt` ({row('fit_size_doubt')['primary_count']}). Users hesitate "
              "because they're not sure the item is genuine / good quality / worth it / right size.")
    md.append("")
    md.append("2. **What the strategic lens predicts — a DECISION GRAVEYARD.** "
              f"`choice_overload` is **{row('choice_overload')['primary_count']} in Nykaa data "
              f"but {row('choice_overload')['external_count']} in external evidence**; "
              f"`context_loss` {row('context_loss')['primary_count']}/"
              f"{row('context_loss')['external_count']}. This cross-category blocker "
              "(a 40-item wishlist you can't sort, act on, or remember why you saved) is "
              "**structurally invisible in post-purchase reviews** — so it is a leading "
              "**hypothesis for Part 3**, not a disproven one.")
    md.append("")
    md.append("**So:** confidence blockers are *validated* by Nykaa data; the decision-graveyard "
              "blockers are *externally supported but Nykaa-unmeasured*. Part 3 interviews exist "
              "to resolve exactly this gap. We do **not** crown choice_overload on external "
              "evidence, nor bury it on a biased sample.")
    md.append("")
    md.append("## Evidence — real quotes")
    for r in top:
        code = r["blocker_code"]
        md.append(f"### `{code}` — {r['primary_count']} Nykaa / {r['external_count']} external")
        qs = quotes_for(items, code, external=False, k=2) or \
            quotes_for(items, code, external=True, k=2)
        md += qs if qs else ["> *(no quote extracted)*"]
        md.append("")
    md.append("## External support for the decision-graveyard hypothesis (labelled external)")
    for code in ("choice_overload", "context_loss", "endless_search_deferral"):
        md.append(f"**`{code}`**")
        md += quotes_for(items, code, external=True, k=2) or ["> *(none)*"]
        md.append("")
    md.append("## Category & segment (directional only)")
    md.append("Most reviews don't name a product category (`unknown_general` dominates), so "
              "category cross-tabs are **directional, not representative** — see "
              "`outputs/segment_crosstab.csv`. Where category is known, `trust_authenticity` "
              "leads apparel & footwear; `occasion_timing` and `trust_authenticity` show the "
              "widest cross-category reach.")
    md.append("")
    md.append("## Opportunity lens (prioritisation, not the finding)")
    md.append("`opportunity_score = nykaa_count + 0.5×external + 3×cross_category_reach` "
              "rewards platform-wide reach (the strategic ask). Use it to *prioritise*, but the "
              "raw Nykaa ranking above is what the data actually says. Full scores in "
              "`outputs/opportunity_ranking.csv`.")
    md.append("")
    md.append("## Caveats")
    md.append("- Heuristic_v0 tags, not model-reviewed yet (spot-check pending).")
    md.append("- Non-random, negative-skewed, post-purchase sample; English-heavy.")
    md.append("- iOS reviews and Reddit/most forums were unreachable — the decision-friction "
              "sources are the ones most under-collected.")
    md.append("- External benchmarks (Iyengar, Baymard, Boldmetrics) are supporting context, "
              "some synthesised/unverified — never Nykaa measurements.")
    md.append("")
    md.append("_Provisional discovery output. Numbers finalise after the tag spot-check "
              "(`outputs/tag_spotcheck.md`) and optional Anthropic re-tag._")

    (ROOT / "FINDINGS.md").write_text("\n".join(md), encoding="utf-8")
    print("Wrote FINDINGS.md")
    spotcheck(items, OUT / "tag_spotcheck.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
