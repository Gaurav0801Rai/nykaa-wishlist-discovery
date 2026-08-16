"""
Stage 4 - Quantify.

Ranked blocker share, reproducible from data/classified.json.
Reports Nykaa-MEASURED counts (primary items only) separately from EXTERNAL
support, per CLAUDE.md (external evidence must never be a Nykaa-specific %).

Also emits an opportunity_score column = frequency x cross-category reach x
evidence, as a PRIORITIZATION lens -- but the table is sorted by the raw
primary_count so the honest data ranking is what leads. We do NOT let the score
reorder the finding.

Writes: outputs/opportunity_ranking.csv
"""
from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict

from common import ROOT

DATA = ROOT / "data"
OUT = ROOT / "outputs"
OUT.mkdir(exist_ok=True)

REAL_CATEGORIES = {"apparel_ethnic", "footwear", "watches", "sunglasses",
                   "bags", "belts", "jewellery", "makeup_beauty"}


def main() -> int:
    items = json.loads((DATA / "classified.json").read_text(encoding="utf-8"))
    primary = [it for it in items if not it["is_external"]]
    external = [it for it in items if it["is_external"]]
    n_primary = len(primary)

    prim_count = Counter(b for it in primary for b in it["blocker_codes"])
    ext_count = Counter(b for it in external for b in it["blocker_codes"])

    # cross-category reach among primary items (distinct real categories)
    cats_by_blocker = defaultdict(set)
    for it in primary:
        if it["category_signal"] in REAL_CATEGORIES:
            for b in it["blocker_codes"]:
                cats_by_blocker[b].add(it["category_signal"])

    all_blockers = set(prim_count) | set(ext_count)
    rows = []
    for b in all_blockers:
        pc = prim_count.get(b, 0)
        ec = ext_count.get(b, 0)
        reach = len(cats_by_blocker.get(b, set()))
        pct = round(100 * pc / n_primary, 1) if n_primary else 0.0
        score = round(pc * 1.0 + ec * 0.5 + reach * 3.0, 1)  # prioritization lens
        if pc >= 15:
            strength = "nykaa_strong"
        elif pc >= 5:
            strength = "nykaa_moderate"
        elif pc > 0:
            strength = "nykaa_thin"
        else:
            strength = "external_only"
        if ec > 0:
            strength += "+external"
        rows.append({
            "blocker_code": b,
            "primary_count": pc,
            "primary_pct_of_%d" % n_primary: pct,
            "external_count": ec,
            "cross_category_reach": reach,
            "opportunity_score": score,
            "evidence_strength": strength,
        })

    rows.sort(key=lambda r: (r["primary_count"], r["opportunity_score"]), reverse=True)
    for i, r in enumerate(rows, 1):
        r_ordered = {"rank": i, **r}
        rows[i - 1] = r_ordered

    fields = list(rows[0].keys())
    with (OUT / "opportunity_ranking.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    print(f"Primary (Nykaa) items: {n_primary} | External: {len(external)}")
    print(f"Wrote outputs/opportunity_ranking.csv ({len(rows)} blockers)\n")
    pctkey = "primary_pct_of_%d" % n_primary
    print(f"{'rank':>4} {'blocker':30s} {'nykaa#':>7} {'nykaa%':>7} {'ext#':>5} {'reach':>6} {'strength'}")
    for r in rows:
        print(f"{r['rank']:>4} {r['blocker_code']:30s} {r['primary_count']:>7} "
              f"{r[pctkey]:>7} {r['external_count']:>5} {r['cross_category_reach']:>6}  {r['evidence_strength']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
