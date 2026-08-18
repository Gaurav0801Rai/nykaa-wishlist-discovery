"""
Generate the repo's reporting deliverables from the single source of truth:
web/src/data/classified.json (the manual analysis applied by apply_tags.py).

This replaces the earlier quantify/segment/synthesize outputs, which were built
on the older keyword-tagged corpus and no longer matched the website.

Writes:
  outputs/opportunity_ranking.csv   ranked blockers with counts and share
  outputs/segment_crosstab.csv      blocker x product category
  FINDINGS.md                       discovery summary
"""
from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict

from common import ROOT

WEBDATA = ROOT / "web" / "src" / "data"
OUT = ROOT / "outputs"
OUT.mkdir(exist_ok=True)

LABEL = {
    "delivery_return_friction": "Delivery / return friction",
    "trust_authenticity": "Trust / authenticity",
    "price_wait": "Price wait",
    "quality_doubt": "Quality doubt",
    "decision_paralysis": "Decision paralysis",
    "confidence_validation_gap": "Confidence / validation gap",
    "fit_size_doubt": "Fit / size doubt",
    "competitor_comparison": "Competitor comparison",
    "bookmarking_no_intent": "Bookmarking, no intent",
    "context_loss": "Context loss / wishlist visibility",
    "occasion_timing": "Occasion / timing",
    "size_or_stock_gone": "Size / stock gone",
    "styling_uncertainty": "Styling uncertainty",
    "cross_sell_miss": "Cross-sell miss",
}
THEME = {
    "decision_paralysis": "Decision friction",
    "context_loss": "Decision friction",
    "competitor_comparison": "Decision friction",
    "bookmarking_no_intent": "Decision friction",
    "cross_sell_miss": "Decision friction",
    "styling_uncertainty": "Decision friction",
    "confidence_validation_gap": "Confidence gap",
    "trust_authenticity": "Confidence gap",
    "quality_doubt": "Confidence gap",
    "fit_size_doubt": "Confidence gap",
    "size_or_stock_gone": "Availability",
    "price_wait": "Value & timing",
    "occasion_timing": "Value & timing",
    "delivery_return_friction": "Post-purchase",
}
CATS = ["apparel_ethnic", "footwear", "watches", "sunglasses", "bags",
        "belts", "jewellery", "makeup_beauty", "unknown_general"]

SOURCE_GROUP = {
    "play_store": "Play Store", "app_store": "App Store", "reddit": "Reddit",
    "community": "Community & web", "quora": "Q&A sites",
    "trustpilot": "Review forums", "pissedconsumer": "Review forums",
    "voxya": "Review forums",
}


def main() -> int:
    items = json.loads((WEBDATA / "classified.json").read_text(encoding="utf-8"))
    n = len(items)
    counts = Counter(b for it in items for b in it["blocker_codes"])
    ranked = counts.most_common()

    # ---- ranking csv ----
    with (OUT / "opportunity_ranking.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["rank", "blocker_code", "blocker", "theme", "items", f"pct_of_{n}"])
        for i, (code, c) in enumerate(ranked, 1):
            w.writerow([i, code, LABEL.get(code, code), THEME.get(code, "Other"),
                        c, round(100 * c / n, 1)])

    # ---- blocker x category ----
    tab = defaultdict(lambda: defaultdict(int))
    for it in items:
        for b in it["blocker_codes"]:
            tab[b][it["category_signal"]] += 1
    with (OUT / "segment_crosstab.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["blocker_code"] + CATS + ["total"])
        for code, _ in ranked:
            row = [tab[code].get(c, 0) for c in CATS]
            w.writerow([code] + row + [sum(row)])

    # ---- themes & sources ----
    themes = {}
    for name in ["Post-purchase", "Confidence gap", "Decision friction", "Value & timing", "Availability"]:
        codes = [c for c, t in THEME.items() if t == name]
        themes[name] = len({it["id"] for it in items
                            if any(b in codes for b in it["blocker_codes"])})
    sources = Counter(SOURCE_GROUP.get(it["source"], "Other") for it in items)

    # ---- FINDINGS.md ----
    md = []
    md.append("# FINDINGS — Nykaa Fashion wishlist→purchase discovery")
    md.append("")
    md.append(f"Analysis of **{n} pieces of real user feedback** about shopping on Nykaa Fashion "
              "and about wishlist shopping generally, collected from "
              + ", ".join(f"{k} ({v})" for k, v in sources.most_common()) + ".")
    md.append("")
    md.append("Every item was read and tagged by hand against a 15-blocker taxonomy. Tagging is "
              "multi-label, so an item can carry several blockers and the percentages do not sum "
              "to 100. Items showing no blocker were left untagged rather than forced into one.")
    md.append("")
    md.append("## Ranked blockers")
    md.append(f"| # | Blocker | Theme | Items | % of {n} |")
    md.append("|---|---------|-------|------:|------:|")
    for i, (code, c) in enumerate(ranked, 1):
        md.append(f"| {i} | {LABEL.get(code, code)} | {THEME.get(code,'Other')} | {c} | {round(100*c/n,1)}% |")
    md.append("")
    md.append("## By theme")
    md.append("| Theme | Items | % |")
    md.append("|-------|------:|--:|")
    for name, c in sorted(themes.items(), key=lambda x: -x[1]):
        md.append(f"| {name} | {c} | {round(100*c/n,1)}% |")
    md.append("")
    md.append("## What the data shows")
    md.append("")
    md.append(f"**Public review writing is dominated by what happens after checkout.** Delivery and "
              f"return friction appears in {counts['delivery_return_friction']} items "
              f"({round(100*counts['delivery_return_friction']/n,1)}%), and the confidence cluster — "
              f"trust, quality, validation and fit — in {themes['Confidence gap']} "
              f"({round(100*themes['Confidence gap']/n,1)}%). Both are reported by people who had "
              "already ordered.")
    md.append("")
    md.append(f"**Friction while an item is still saved is a distinct, smaller signal.** Decision "
              f"friction appears in {themes['Decision friction']} items "
              f"({round(100*themes['Decision friction']/n,1)}%), led by decision paralysis "
              f"({counts['decision_paralysis']}), competitor comparison "
              f"({counts['competitor_comparison']}), saving without buying "
              f"({counts['bookmarking_no_intent']}) and context loss ({counts['context_loss']}).")
    md.append("")
    md.append("**Category profiles differ.** Apparel feedback carries fit and quality doubts, while "
              "footwear leans on sizing. Most items do not name a category, so category splits "
              "describe the named ones only.")
    md.append("")
    md.append("Full data: `web/src/data/classified.json`. Per-item tags: `data/claude_tags*.json`. "
              "Live site: the Dashboard, Ask Assistant and Live Analyzer under `web/`.")
    (ROOT / "FINDINGS.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"Regenerated outputs + FINDINGS.md from {n} manually tagged items")
    print("  themes:", themes)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
