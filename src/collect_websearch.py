"""
Stage 1 - Open-web decision-friction evidence (WebSearch-driven path).

WHY THIS EXISTS: app reviews (Play/App store) are post-purchase and skew to
delivery/return complaints; they barely contain the wishlist DECISION-moment
signal (choice_overload, context_loss, endless_search_deferral, price_wait).
That signal lives in open-web shopper discussion. Reddit/Quora/Trustpilot are
IP-blocked from this environment, so discovery was done via assisted WebSearch +
WebFetch and the verbatim extracts saved to web_seed_extracts.json.

This script just NORMALIZES that curated file into data/raw/web.json so the pull
is reproducible and additive. To refresh: re-run the search, update the JSON,
re-run this script.

IMPORTANT (honesty rule): every item here is EXTERNAL supporting evidence. It is
tagged source='web_<domain>' and evidence_type in query_hint, and MUST be excluded
from any Nykaa-specific percentage in Stage 4. It informs the blocker vocabulary
and provides quotable external context -- not Nykaa measurements.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from common import make_item, save_items, log_run

SEED = Path(__file__).with_name("web_seed_extracts.json")


def collect() -> list[dict]:
    data = json.loads(SEED.read_text(encoding="utf-8"))
    items = []
    for ex in data.get("extracts", []):
        item = make_item(
            source=f"web_{ex['domain']}",
            raw_text=ex["text"],
            url=ex["url"],
            query_hint=f"{ex['evidence_type']}|region={ex.get('region','?')}",
        )
        if item:
            # mark external explicitly for downstream stages
            item["evidence_type"] = ex["evidence_type"]
            item["region"] = ex.get("region")
            items.append(item)
    return items


def main() -> int:
    print("Normalizing open-web extracts -> data/raw/web.json ...")
    items = collect()
    save_items("web", items)
    log_run("web", len(items), note="EXTERNAL supporting evidence only")
    return 0


if __name__ == "__main__":
    sys.exit(main())
