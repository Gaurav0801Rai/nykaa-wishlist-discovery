"""
Stage 1 - Reddit via public JSON endpoints (no API key).

Two pulls:
  1) Search across relevant subreddits for "nykaa" + category terms, so we get
     cross-category wishlist/decision chatter (not just clothing).
  2) Fetch the comment trees of the seed threads named in seed_sources.md.

Polite: descriptive User-Agent + delays. Reddit rate-limits hard; on 429 we
back off and keep whatever we already have (re-run later to top up).
"""
from __future__ import annotations

import sys

import requests

from common import (CATEGORY_TERMS, make_item, polite_sleep, save_items,
                    log_run)

REDDIT_HEADERS = {
    "User-Agent": "nykaa-discovery-research/0.1 (PM case study; contact via repo)",
    "Accept-Language": "en-IN,en;q=0.9",
}

SUBREDDITS = [
    "IndianFashionAddicts",
    "IndianMakeupAddicts",
    "IndianFashionAddicts",
    "india",
    "IndianBeautyDeals",
]

# Seed threads from seed_sources.md (permalink stubs).
SEED_THREADS = [
    "https://www.reddit.com/r/IndianBeautyDeals/comments/1j8x6q2/nykaa_fashion_is_a_scam/",
    "https://www.reddit.com/r/InstaCelebsGossip/comments/zuux04/nykaa_is_a_bully_nykaa_got_my_twitter_account/",
]


def _get_json(url: str, params: dict | None = None):
    try:
        resp = requests.get(url, headers=REDDIT_HEADERS, params=params, timeout=20)
        if resp.status_code == 429:
            print("  reddit 429 (rate limited) -- backing off 20s")
            polite_sleep(20)
            resp = requests.get(url, headers=REDDIT_HEADERS, params=params, timeout=20)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  reddit fetch failed ({url}): {e}")
        return None


def search_subreddits() -> list[dict]:
    items: list[dict] = []
    seen_queries = set()
    for sub in SUBREDDITS:
        for term in ["wishlist", "cart", "order"] + CATEGORY_TERMS:
            q = f"nykaa {term}"
            key = (sub, q)
            if key in seen_queries:
                continue
            seen_queries.add(key)
            data = _get_json(
                f"https://www.reddit.com/r/{sub}/search.json",
                params={"q": q, "restrict_sr": 1, "limit": 15,
                        "sort": "relevance", "t": "all"},
            )
            polite_sleep(2.0)
            if not data:
                continue
            for child in data.get("data", {}).get("children", []):
                d = child.get("data", {})
                text = " ".join(filter(None, [d.get("title", ""),
                                              d.get("selftext", "")])).strip()
                item = make_item(
                    source="reddit",
                    raw_text=text,
                    url="https://www.reddit.com" + d.get("permalink", ""),
                    date=str(d.get("created_utc", "")),
                    rating=d.get("score"),
                    query_hint=f"r/{sub} q='{q}'",
                )
                if item:
                    items.append(item)
    return items


def fetch_seed_threads() -> list[dict]:
    items: list[dict] = []
    for permalink in SEED_THREADS:
        data = _get_json(permalink.rstrip("/") + ".json", params={"limit": 200})
        polite_sleep(2.0)
        if not data or not isinstance(data, list):
            continue
        # data[0] = the post, data[1] = comments listing
        for listing in data:
            for child in listing.get("data", {}).get("children", []):
                d = child.get("data", {})
                text = d.get("selftext") or d.get("body") or ""
                item = make_item(
                    source="reddit",
                    raw_text=text,
                    url="https://www.reddit.com" + d.get("permalink", permalink),
                    date=str(d.get("created_utc", "")),
                    rating=d.get("score"),
                    query_hint="seed_thread",
                )
                if item:
                    items.append(item)
    return items


def main() -> int:
    print("Collecting Reddit (search + seed threads)...")
    items = search_subreddits() + fetch_seed_threads()
    save_items("reddit", items)
    log_run("reddit", len(items))
    return 0


if __name__ == "__main__":
    sys.exit(main())
