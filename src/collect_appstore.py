"""
Stage 1 - App Store (iOS) reviews for the Nykaa Fashion app (India).

App id: 1439872423  (confirmed from apps.apple.com/in listing)
Uses Apple's public customer-reviews RSS feed (JSON) directly via requests --
no fragile third-party dep. Apple exposes up to ~10 pages (~500 reviews).
"""
from __future__ import annotations

import sys

import requests

from common import DEFAULT_HEADERS, make_item, polite_sleep, save_items, log_run

APP_ID = "1439872423"
COUNTRY = "in"
MAX_PAGES = 10  # Apple's practical ceiling
FEED = ("https://itunes.apple.com/{country}/rss/customerreviews/"
        "page={page}/id={app_id}/sortby=mostrecent/json")


def collect() -> list[dict]:
    items: list[dict] = []
    for page in range(1, MAX_PAGES + 1):
        url = FEED.format(country=COUNTRY, page=page, app_id=APP_ID)
        try:
            resp = requests.get(url, headers=DEFAULT_HEADERS, timeout=20)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"  appstore page {page} failed: {e}")
            break

        entries = data.get("feed", {}).get("entry", [])
        # First entry on page 1 is app metadata, not a review -> skip if no rating.
        review_entries = [e for e in entries if "im:rating" in e]
        if not review_entries:
            break

        for e in review_entries:
            title = e.get("title", {}).get("label", "")
            body = e.get("content", {}).get("label", "")
            text = f"{title}. {body}".strip(". ").strip()
            item = make_item(
                source="app_store",
                raw_text=text,
                url=f"https://apps.apple.com/{COUNTRY}/app/id{APP_ID}",
                date=e.get("updated", {}).get("label"),
                rating=e.get("im:rating", {}).get("label"),
                query_hint=f"page={page}",
            )
            if item:
                items.append(item)
        polite_sleep(1.0)
    return items


def main() -> int:
    print("Collecting App Store reviews (id1439872423, in)...")
    items = collect()
    save_items("app_store", items)
    log_run("app_store", len(items))
    return 0


if __name__ == "__main__":
    sys.exit(main())
