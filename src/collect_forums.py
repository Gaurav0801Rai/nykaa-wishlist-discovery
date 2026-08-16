"""
Stage 1 - Forums & Q&A (best-effort, anti-bot-prone).

Sources from seed_sources.md: Trustpilot, PissedConsumer, Voxya, Quora.
These sites use Cloudflare / login walls, so this is a BEST-EFFORT requests+
BeautifulSoup pass. It degrades gracefully: if a site blocks us we log 0 and
move on. Anything it can't reach becomes a gap we fill via web fetch or note as
a sampling caveat -- we never fabricate reviews to fill the gap.
"""
from __future__ import annotations

import sys

import requests
from bs4 import BeautifulSoup

from common import DEFAULT_HEADERS, make_item, polite_sleep, save_items, log_run

# (label, url) pairs pulled straight from seed_sources.md
FORUM_URLS = [
    ("trustpilot", "https://www.trustpilot.com/review/nykaafashion.com"),
    ("trustpilot", "https://www.trustpilot.com/review/nykaa.com?page=7"),
    ("pissedconsumer", "https://nykaa-fashion.pissedconsumer.com/"),
    ("pissedconsumer", "https://nykaa-fashion.pissedconsumer.com/complaints/RT-P.html"),
    ("voxya", "https://voxya.com/company/nykaa-fashion-complaints/1234016"),
    ("quora", "https://www.quora.com/What-is-your-review-of-Nykaa-Fashion"),
    ("quora", "https://www.quora.com/Is-it-advisable-to-buy-clothes-from-Nykaa-Fashion"),
    ("quora", "https://www.quora.com/What-is-your-experience-shopping-from-the-Nykaa-app"),
]

# Reasonable text blocks look like reviews/answers; drop nav/boilerplate.
MIN_LEN = 60
MAX_LEN = 4000


def _extract_text_blocks(html: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    blocks = []
    for p in soup.find_all(["p", "span", "div"]):
        t = " ".join(p.get_text(" ", strip=True).split())
        if MIN_LEN <= len(t) <= MAX_LEN:
            blocks.append(t)
    # dedup while preserving order
    seen, out = set(), []
    for b in blocks:
        if b not in seen:
            seen.add(b)
            out.append(b)
    return out


def collect() -> list[dict]:
    items: list[dict] = []
    for label, url in FORUM_URLS:
        try:
            resp = requests.get(url, headers=DEFAULT_HEADERS, timeout=25)
            status = resp.status_code
        except Exception as e:
            print(f"  {label} {url} -> error {e}")
            polite_sleep(2.0)
            continue

        if status != 200:
            print(f"  {label} {url} -> HTTP {status} (likely anti-bot wall)")
            polite_sleep(2.0)
            continue

        blocks = _extract_text_blocks(resp.text)
        kept = 0
        for b in blocks:
            item = make_item(source=label, raw_text=b, url=url,
                             query_hint="forum_scrape")
            if item:
                items.append(item)
                kept += 1
        print(f"  {label} {url} -> {kept} text blocks")
        polite_sleep(3.0)
    return items


def main() -> int:
    print("Collecting forums/Q&A (best-effort)...")
    items = collect()
    save_items("forums", items)
    log_run("forums", len(items), note="best-effort; anti-bot prone")
    return 0


if __name__ == "__main__":
    sys.exit(main())
