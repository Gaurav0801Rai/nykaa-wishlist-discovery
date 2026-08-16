"""
Shared helpers for Stage 1 (collect) and later stages.

Item schema (per CLAUDE.md): {source, url, date?, rating?, raw_text}
We add: id (stable hash), collected_at, and a free-text `query_hint` so we can
see which category/search term surfaced an item (useful for the relevance check;
NOT the same as the classifier's category_signal, which comes in Stage 3).

No fabricated data: collectors only ever store text they actually pulled.
"""
from __future__ import annotations

import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = ROOT / "data" / "raw"
CACHE_RAW = ROOT / "cache" / "raw_pulls"
LOGS = ROOT / "logs"

for _d in (DATA_RAW, CACHE_RAW, LOGS):
    _d.mkdir(parents=True, exist_ok=True)

# Polite defaults for any hand-rolled HTTP scraping.
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_id(source: str, url: str, text: str) -> str:
    """Stable id so re-runs dedup instead of duplicating."""
    h = hashlib.sha1(f"{source}|{url}|{text}".encode("utf-8")).hexdigest()
    return f"{source}_{h[:12]}"


def make_item(source: str, raw_text: str, url: str = "",
              date: str | None = None, rating=None,
              query_hint: str = "") -> dict | None:
    """Normalize into the stored schema. Returns None for empty text."""
    text = (raw_text or "").strip()
    if not text:
        return None
    return {
        "id": make_id(source, url, text),
        "source": source,
        "url": url,
        "date": date,
        "rating": rating,
        "raw_text": text,
        "query_hint": query_hint,
        "collected_at": now_iso(),
    }


def save_items(source_file: str, items: list[dict]) -> Path:
    """
    Write deduped items to data/raw/<source_file>.json.
    Merges with anything already on disk (re-runnable / additive).
    """
    out = DATA_RAW / f"{source_file}.json"
    existing: dict[str, dict] = {}
    if out.exists():
        for it in json.loads(out.read_text(encoding="utf-8")):
            existing[it["id"]] = it

    added = 0
    for it in items:
        if it and it["id"] not in existing:
            existing[it["id"]] = it
            added += 1

    merged = list(existing.values())
    out.write_text(json.dumps(merged, ensure_ascii=False, indent=2),
                   encoding="utf-8")
    print(f"  [{source_file}] +{added} new, {len(merged)} total -> {out.name}")
    return out


def polite_sleep(seconds: float = 1.5) -> None:
    time.sleep(seconds)


def log_run(source: str, count: int, note: str = "") -> None:
    line = f"{now_iso()},collect,{source},{count},{note}\n"
    (LOGS / "collect_log.csv").open("a", encoding="utf-8").write(line)


# Category-spanning search terms so we collect ACROSS categories, not just
# clothing (per CLAUDE.md scope). Used by Reddit search + any keyword scraping.
CATEGORY_TERMS = [
    "dress", "kurta", "saree", "lehenga",          # apparel / ethnic
    "shoes", "heels", "sneakers", "footwear",       # footwear
    "watch", "sunglasses", "belt", "bag", "handbag",  # accessories
    "jewellery", "earrings",                        # jewellery
    "makeup", "lipstick",                           # beauty-adjacent
]
