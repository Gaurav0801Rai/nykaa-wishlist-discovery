"""
Stage 5 - Segment.

Cross-tab blockers by (a) product category and (b) buyer-behaviour segment,
for PRIMARY Nykaa items only.

Writes:
  outputs/segment_crosstab.csv        (blocker x category)
  outputs/blocker_by_buyersegment.csv (blocker x behaviour segment)
"""
from __future__ import annotations

import csv
import json
from collections import defaultdict

from common import ROOT

DATA = ROOT / "data"
OUT = ROOT / "outputs"
OUT.mkdir(exist_ok=True)

CATEGORIES = ["apparel_ethnic", "footwear", "watches", "sunglasses", "bags",
              "belts", "jewellery", "makeup_beauty", "unknown_general"]
SEGMENTS = ["deal_seeker", "occasion_buyer", "cautious_validator",
            "browser_no_intent", "quality_conscious", "comparison_shopper", "general"]


def crosstab(items, axis_key, axis_values, path, axis_label):
    table = defaultdict(lambda: defaultdict(int))
    for it in items:
        col = it.get(axis_key, "unknown")
        for b in it["blocker_codes"]:
            table[b][col] += 1
    blockers = sorted(table.keys(), key=lambda b: -sum(table[b].values()))
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["blocker_code"] + axis_values + ["total"])
        for b in blockers:
            row = [table[b].get(c, 0) for c in axis_values]
            w.writerow([b] + row + [sum(row)])
    print(f"Wrote {path.name}  (blocker x {axis_label}, {len(blockers)} blockers)")
    return table, blockers


def main() -> int:
    items = json.loads((DATA / "classified.json").read_text(encoding="utf-8"))
    primary = [it for it in items if not it["is_external"]]

    crosstab(primary, "category_signal", CATEGORIES,
             OUT / "segment_crosstab.csv", "category")
    table, blockers = crosstab(primary, "segment_signal", SEGMENTS,
                               OUT / "blocker_by_buyersegment.csv", "buyer-segment")

    # quick console view: top blocker per category
    print("\nTop blocker x category (primary items):")
    cat_tab = defaultdict(lambda: defaultdict(int))
    for it in primary:
        for b in it["blocker_codes"]:
            cat_tab[it["category_signal"]][b] += 1
    for cat in CATEGORIES:
        if cat_tab[cat]:
            top = max(cat_tab[cat].items(), key=lambda x: x[1])
            n = sum(cat_tab[cat].values())
            print(f"  {cat:16s} n={n:3d}  top={top[0]} ({top[1]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
