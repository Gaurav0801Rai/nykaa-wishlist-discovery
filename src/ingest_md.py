"""
Stage 1 - Ingest an externally-collected markdown file (e.g. produced by Kimi
for the sources that are IP-blocked from this sandbox: Trustpilot, PissedConsumer,
Reddit, Quora, YouTube, X).

Expected format: items separated by a line containing only '---'. Each item is
key: value lines; `text` is the verbatim content and may span multiple lines
(everything after `text:` until the next '---' separator).

Required per item: source, text.  Optional: url, date, rating, category_hint.

Example:
    source: trustpilot
    url: https://www.trustpilot.com/review/nykaafashion.com
    date: 2025-03-14
    rating: 2
    category_hint: footwear
    text: I saved three pairs of heels for weeks and could never decide which
    to buy, so I gave up and bought nothing.
    ---
    source: quora
    url: https://www.quora.com/...
    text: My Nykaa wishlist has 40 items and I just keep scrolling past them.

Usage:  python ingest_md.py <path-to.md>
Writes deduped items to data/raw/kimi.json (additive, re-runnable).
"""
from __future__ import annotations

import sys
from pathlib import Path

from common import make_item, save_items, log_run

FIELD_KEYS = {"source", "url", "date", "rating", "category_hint"}
# These sources are real Nykaa (or competitor) user voice, NOT external commentary.
KNOWN_SOURCES = {"trustpilot", "pissedconsumer", "voxya", "reddit", "quora",
                 "youtube", "twitter", "x"}


def parse_items(md: str) -> list[dict]:
    raw_items, cur, in_text = [], {}, False
    text_lines: list[str] = []

    def flush():
        if cur or text_lines:
            cur["text"] = "\n".join(text_lines).strip()
            raw_items.append(dict(cur))

    for line in md.splitlines():
        if line.strip() == "---":
            flush()
            cur, text_lines, in_text = {}, [], False
            continue
        if in_text:
            text_lines.append(line)
            continue
        if ":" in line:
            key, _, val = line.partition(":")
            key = key.strip().lower()
            if key == "text":
                in_text = True
                if val.strip():
                    text_lines.append(val.strip())
            elif key in FIELD_KEYS:
                cur[key] = val.strip()
            # unknown key before text -> ignore (tolerant of headings/noise)
        # blank / heading lines before text: ignore
    flush()
    return raw_items


def to_items(raw_items: list[dict]) -> list[dict]:
    out = []
    for r in raw_items:
        text = (r.get("text") or "").strip()
        src = (r.get("source") or "").strip().lower()
        if not text or not src:
            continue
        if src not in KNOWN_SOURCES:
            print(f"  WARN: unknown source '{src}' -- keeping but review it")
        item = make_item(
            source=src,
            raw_text=text,
            url=r.get("url", ""),
            date=r.get("date") or None,
            rating=r.get("rating") or None,
            query_hint="kimi_import" +
            (f"|cat={r['category_hint']}" if r.get("category_hint") else ""),
        )
        if item:
            out.append(item)
    return out


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: python ingest_md.py <path-to.md>")
        return 2
    path = Path(argv[1])
    if not path.exists():
        print(f"File not found: {path}")
        return 1
    raw = parse_items(path.read_text(encoding="utf-8"))
    items = to_items(raw)
    print(f"Parsed {len(raw)} blocks -> {len(items)} valid items from {path.name}")
    save_items("kimi", items)
    log_run("kimi_import", len(items), note=f"from {path.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
