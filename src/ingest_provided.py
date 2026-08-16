"""
Stage 1 - Ingest the user-provided RAW scraped markdown
(nykaa_fashion_raw_scraped_data.md) into the primary corpus.

Only REAL scraped Nykaa user voice is kept as primary data:
  Trustpilot, PissedConsumer, Quora.
Excluded:
  - Voxya section (site boilerplate, no actual complaint text)
  - any answer marked "(Bot/Assistant)" (AI-generated, not a real user)
  - MDPI / Shopify sections here (they are EXTERNAL; handled via web layer)
Duplicates (Quora answers repeated across questions) are removed by the
content-hash dedup in save_items().

We do NOT touch the *synthesized* file here -- synthesized quotes/stats must
never enter the Nykaa corpus (CLAUDE.md: NO FABRICATED NUMBERS).

Usage: python ingest_provided.py "C:\\path\\to\\nykaa_fashion_raw_scraped_data.md"
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from common import make_item, save_items, log_run

# Map a "## SOURCE n: <name>" heading to our source label, or None to skip.
SOURCE_MAP = [
    ("trustpilot", "trustpilot"),
    ("pissedconsumer", "pissedconsumer"),
    ("quora", "quora"),
]
SKIP_HINTS = ("voxya", "mdpi", "shopify", "baymard", "columbia", "bigcommerce",
              "forbes", "mirrago", "boldmetrics", "kissmetrics", "sellerscommerce",
              "nust", "pmc", "reddit", "youtube", "x (twitter)", "nykaa fashion official website")

META_PREFIXES = ("**Title:**", "**Date:**", "**Type:**", "**Updated:**",
                 "**Original review:**", "**URL:**", "**Status:**",
                 "**Overall Rating:**", "**Total Complaints:**", "**Data Source:**",
                 "[IMAGE", "Related questions")


def source_for(heading: str) -> str | None:
    h = heading.lower()
    for skip in SKIP_HINTS:
        if skip in h:
            return None
    for key, label in SOURCE_MAP:
        if key in h:
            return label
    return None


def parse(md: str) -> list[dict]:
    lines = md.splitlines()
    items: list[dict] = []
    cur_source: str | None = None
    in_item = False
    is_bot = False
    body: list[str] = []
    date_val: str | None = None

    def flush():
        nonlocal body, is_bot, date_val
        if in_item and cur_source and not is_bot:
            text = "\n".join(body).strip()
            # strip markdown separators / stray asterisks-only lines
            text = re.sub(r"\n{3,}", "\n\n", text).strip()
            if len(text) >= 15 and not text.lower().startswith("file a consumer"):
                it = make_item(source=cur_source, raw_text=text,
                               url="", date=date_val, query_hint="provided_raw")
                if it:
                    items.append(it)
        body = []
        is_bot = False
        date_val = None

    for line in lines:
        s = line.strip()
        if s.startswith("## SOURCE"):
            flush()
            in_item = False
            cur_source = source_for(s)
            continue
        if s.startswith("### "):
            flush()
            in_item = True
            is_bot = "bot/assistant" in s.lower() or "(bot" in s.lower()
            continue
        if not in_item:
            continue
        if s == "---":
            flush()
            in_item = False
            continue
        if s.startswith("**Date:**"):
            m = re.search(r"\*\*Date:\*\*\s*(.+)", s)
            if m:
                date_val = m.group(1).strip()
            continue
        if any(s.startswith(p) for p in META_PREFIXES):
            continue
        body.append(line)
    flush()
    return items


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        # default to the known Downloads path
        default = Path.home() / "Downloads" / "nykaa_fashion_raw_scraped_data.md"
        path = default
    else:
        path = Path(argv[1])
    if not path.exists():
        print(f"File not found: {path}")
        return 1
    items = parse(path.read_text(encoding="utf-8"))
    by_src: dict[str, int] = {}
    for it in items:
        by_src[it["source"]] = by_src.get(it["source"], 0) + 1
    print(f"Parsed {len(items)} real user-voice items: {by_src}")
    save_items("provided_scraped", items)
    log_run("provided_scraped", len(items), note="real scraped; bot+boilerplate excluded")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
