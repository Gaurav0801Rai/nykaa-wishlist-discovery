"""
Stage 1 - Play Store reviews for the Nykaa Fashion app (India).

Package id: com.fsn.nds  (confirmed from the Play Store listing)
Uses google-play-scraper (pure-python). Pulls across sort orders so we don't
only get the angriest 1-star delivery rants. Relevance filtering is Stage 2.
"""
from __future__ import annotations

import sys

from common import make_item, save_items, log_run

PACKAGE_ID = "com.fsn.nds"
COUNTRY = "in"
LANG = "en"
TARGET = 250  # raw target; Stage 2 will cut


def collect() -> list[dict]:
    try:
        from google_play_scraper import Sort, reviews
    except ImportError:
        print("google-play-scraper not installed. `pip install google-play-scraper`")
        return []

    items: list[dict] = []
    # Two passes so the sample isn't dominated by one sort order.
    for sort in (Sort.NEWEST, Sort.MOST_RELEVANT):
        try:
            result, _ = reviews(
                PACKAGE_ID,
                lang=LANG,
                country=COUNTRY,
                sort=sort,
                count=TARGET,
            )
        except Exception as e:  # network / package issues
            print(f"  play sort={sort} failed: {e}")
            continue

        for r in result:
            item = make_item(
                source="play_store",
                raw_text=r.get("content", ""),
                url=f"https://play.google.com/store/apps/details?id={PACKAGE_ID}",
                date=str(r.get("at", "")),
                rating=r.get("score"),
                query_hint=f"sort={getattr(sort, 'name', sort)}",
            )
            if item:
                items.append(item)
    return items


def main() -> int:
    print("Collecting Play Store reviews (com.fsn.nds, in)...")
    items = collect()
    save_items("play_store", items)
    log_run("play_store", len(items))
    return 0


if __name__ == "__main__":
    sys.exit(main())
