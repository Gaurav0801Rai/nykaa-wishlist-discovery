"""
Apply the manual analysis (data/claude_tags*.json) to the website corpus.

Every item in web/src/data/corpus_base.json was read and tagged by hand against
the blocker taxonomy in CLAUDE.md -- no keyword rules, no LLM. This script just
expands the short codes and writes web/src/data/classified.json.

Short codes:
  blockers: tr=trust_authenticity qd=quality_doubt cv=confidence_validation_gap
            fs=fit_size_doubt pw=price_wait ot=occasion_timing
            dr=delivery_return_friction es=endless_search_deferral
            co=choice_overload cg=within_category_compare_gap cl=context_loss
            sg=size_or_stock_gone su=styling_uncertainty cs=cross_sell_miss
            bn=bookmarking_no_intent
  category: ap=apparel_ethnic fw=footwear wa=watches sn=sunglasses bg=bags
            be=belts jw=jewellery mb=makeup_beauty un=unknown_general
"""
from __future__ import annotations

import json
import re

from common import ROOT

WEBDATA = ROOT / "web" / "src" / "data"
DATA = ROOT / "data"

B = {
    "tr": "trust_authenticity", "qd": "quality_doubt", "cv": "confidence_validation_gap",
    "fs": "fit_size_doubt", "pw": "price_wait", "ot": "occasion_timing",
    "dr": "delivery_return_friction", "es": "endless_search_deferral",
    "co": "choice_overload", "cg": "within_category_compare_gap", "cl": "context_loss",
    "sg": "size_or_stock_gone", "su": "styling_uncertainty", "cs": "cross_sell_miss",
    "bn": "bookmarking_no_intent",
}
C = {
    "ap": "apparel_ethnic", "fw": "footwear", "wa": "watches", "sn": "sunglasses",
    "bg": "bags", "be": "belts", "jw": "jewellery", "mb": "makeup_beauty",
    "un": "unknown_general",
}

# Phrases that make a good pull-quote for each blocker (for the expandable rows).
QUOTE_HINTS = {
    "context_loss": r"forgot|forget|remember|overflow|impossible to sort|marooned|cluttered|accumulat|clear my|\d{2,}\s*items|toxic relationship|hidden",
    "choice_overload": r"overwhelm|too many|so many|can'?t decide|how many|cluttered|quit the process|undecided",
    "endless_search_deferral": r"never bought|no purchasing|rabbit hole|thrill of the hunt|browsing|skip the purchase|haven'?t gotten around|wishlist for|forever|hunt never stops",
    "price_wait": r"sale|discount|price|expensive|cheaper|deal|off\b|afford|budget",
    "confidence_validation_gap": r"review|photo|suggest|recco|not sure|scared|check ingredient|described|help out|any suggestions",
    "trust_authenticity": r"fake|genuine|authentic|duplicate|replica|scam|fraud|cheat|copy|not the real",
    "quality_doubt": r"quality|material|fabric|cheap|poor|damaged|defective|worth",
    "fit_size_doubt": r"\bsize\b|\bfit\b|too small|too big|tight|sizing",
    "size_or_stock_gone": r"out of stock|oos|sold out|not available|unavailable|stock",
    "within_category_compare_gap": r"compar|myntra|ajio|amazon|flipkart|tira|zepto|other (site|app|platform)|physical store|cheaper",
    "occasion_timing": r"wedding|birthday|function|gift|occasion|festiv|urgent|in time",
    "delivery_return_friction": r"return|refund|deliver|pickup|pick up|replace|exchange",
    "bookmarking_no_intent": r"no.?buy|impulse|don'?t check out|not because i want|organi[sz]|wishlist so i|hoard|thrill",
    "cross_sell_miss": r"pair|match|complete the look|goes with|recommend",
    "styling_uncertainty": r"styl|wear|match",
}


def pick_quote(text: str, codes: list[str]) -> str:
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", text) if len(s.strip()) > 12]
    for code in codes:
        rx = QUOTE_HINTS.get(code)
        if not rx:
            continue
        for s in sentences:
            if re.search(rx, s, re.I):
                return s[:230]
    return (sentences[0] if sentences else text.strip())[:230]


def main() -> int:
    base = json.loads((WEBDATA / "corpus_base.json").read_text(encoding="utf-8"))

    tags: dict[str, dict] = {}
    tags.update(json.loads((DATA / "claude_tags.json").read_text(encoding="utf-8"))["tags"])
    for n in range(2, 7):
        f = DATA / f"claude_tags_b{n}.json"
        if f.exists():
            tags.update(json.loads(f.read_text(encoding="utf-8")))

    missing = [i for i in range(len(base)) if str(i) not in tags]
    if missing:
        print(f"ERROR: {len(missing)} items untagged: {missing[:20]}")
        return 1

    out = []
    for i, item in enumerate(base):
        t = tags[str(i)]
        codes = [B[x] for x in t.get("b", []) if x in B]
        out.append({
            "id": item["id"],
            "source": item["source"],
            "text": item.get("text", ""),
            "blocker_codes": codes,
            "category_signal": C.get(t.get("c", "un"), "unknown_general"),
            "supporting_quote": pick_quote(item.get("text", ""), codes),
            "rating": item.get("rating"),
            "tagging_method": "manual_review",
        })

    (WEBDATA / "classified.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    from collections import Counter
    blk = Counter(b for r in out for b in r["blocker_codes"])
    n = len(out)
    print(f"Applied manual tags to {n} items -> web/src/data/classified.json\n")
    print(f"{'blocker':32s} {'n':>4}  {'%':>6}")
    for b, c in blk.most_common():
        print(f"  {b:30s} {c:>4}  {100*c/n:>5.1f}%")
    print(f"\nitems with no blocker: {sum(1 for r in out if not r['blocker_codes'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
