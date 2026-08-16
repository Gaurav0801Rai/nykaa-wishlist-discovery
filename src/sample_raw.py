"""
Helper (not a pipeline stage): print a cross-category sample of RAW collected
items for the manual relevance check after Stage 1. No filtering/classifying --
this shows what we actually pulled, spanning categories, so a human can eyeball
relevance before Stage 2.
"""
from __future__ import annotations

import json
import re
import sys

from common import DATA_RAW

# Windows consoles default to cp1252; force UTF-8 so emoji/Hindi don't crash.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# Map raw category terms -> a display bucket.
BUCKETS = {
    "apparel/ethnic": ["dress", "kurta", "saree", "lehenga", "top", "jean", "shirt", "cloth"],
    "footwear": ["shoe", "heel", "sneaker", "footwear", "sandal", "slipper"],
    "watches": ["watch"],
    "sunglasses/eyewear": ["sunglass", "goggle", "eyewear"],
    "bags/belts": ["bag", "handbag", "belt", "wallet", "clutch"],
    "jewellery": ["jewel", "earring", "necklace", "ring", "bangle"],
    "makeup/beauty": ["makeup", "lipstick", "kajal", "foundation", "beauty", "cream", "serum"],
}


def load_all() -> list[dict]:
    items = []
    for f in sorted(DATA_RAW.glob("*.json")):
        items.extend(json.loads(f.read_text(encoding="utf-8")))
    return items


def bucket_of(text: str) -> str | None:
    t = text.lower()
    for name, kws in BUCKETS.items():
        if any(re.search(r"\b" + re.escape(k), t) for k in kws):
            return name
    return None


def main():
    items = load_all()
    print(f"Total raw items on disk: {len(items)}")
    by_source = {}
    for it in items:
        by_source[it["source"]] = by_source.get(it["source"], 0) + 1
    print("By source:", by_source)

    # Pick up to 3 per category bucket, spread across text length (short/med/long)
    # so we don't only surface the longest delivery rants. No theme filtering --
    # relevance is the human's call here.
    picked, seen_ids = [], set()
    for bucket in BUCKETS:
        cands = [it for it in items
                 if it["id"] not in seen_ids and bucket_of(it["raw_text"]) == bucket]
        cands.sort(key=lambda x: len(x["raw_text"]))
        if not cands:
            continue
        n = len(cands)
        # sample at ~25%, 55%, 85% percentiles for length variety
        idxs = sorted(set(min(n - 1, int(n * p)) for p in (0.25, 0.55, 0.85)))
        for j in idxs:
            it = cands[j]
            if it["id"] not in seen_ids:
                picked.append((bucket, it))
                seen_ids.add(it["id"])

    print(f"\n=== Cross-category raw sample ({len(picked)} items) ===\n")
    for i, (bucket, it) in enumerate(picked, 1):
        text = it["raw_text"].replace("\n", " ")
        if len(text) > 320:
            text = text[:320] + "..."
        rating = it.get("rating")
        print(f"[{i}] ({bucket}) source={it['source']} rating={rating}")
        print(f"    {text}")
        print(f"    id={it['id']}")
        print()


if __name__ == "__main__":
    main()
