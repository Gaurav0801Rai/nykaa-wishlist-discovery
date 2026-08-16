"""
Stage 2 - Filter (relevance vs. confirmation).

Rule (CLAUDE.md):
  KEEP  anything about the save->buy / browse / wishlist DECISION moment, any category.
  DROP  pure delivery-delay / refund / app-crash / authenticity-logistics rants that
        do NOT explain non-purchase of a saved item.
  NEVER drop a decision-relevant item just because it names price or fit.
  LOG   rejected count + reasons (data/rejected.json).

Design notes:
- A review that expresses a PURCHASE-DECISION consequence ("never buying again",
  "lost trust", "switched to Myntra", "not genuine so I won't...") is KEPT, because
  trust/quality/return-friction are candidate BLOCKERS when they deter buying a saved
  item. A purely operational complaint ("not delivered, tracking wrong, no pickup")
  with no decision framing is DROPPED.
- External web items (source web_*) are curated relevant evidence -> always kept,
  flagged is_external so Stage 4 excludes them from Nykaa-specific %.
- This is deterministic/transparent so the keep/drop calls are reproducible and
  auditable. Stage 3 does the finer blocker tagging.
"""
from __future__ import annotations

import json
import re
import sys

from common import DATA_RAW, ROOT

DATA = ROOT / "data"

# ----- signal patterns (case-insensitive) -----
KEEP_PATTERNS = {
    "wishlist_save": r"wishlist|wish list|saved? (it|them|item|this|for later)|save for later|add(ed)? to (cart|bag|wishlist)|bookmark|shortlist",
    "choice_overload": r"too many|so many (option|choice|thing|item|dress|style)|overwhelm|can'?t (decide|choose|pick)|hard to (choose|decide|pick)|spoilt for choice|confus(ed|ing)|endless(ly)? scroll|paralys|decision fatigue|cluttered",
    "comparison": r"compar(e|ing|ison)|which one|better (option|deal)|\bvs\b|versus|myntra|ajio|tata ?cliq|amazon|flipkart|physical store|in[- ]store|other (site|app|platform)",
    "confidence_trust": r"not sure|unsure|doubt|second[- ]guess|reviews?|photos?|looks? different|as (shown|described|advertised|expected)|true to size|will it (fit|suit|match)|confiden|trust|genuine|authentic|\bfake\b|first copy|duplicate|scam|cheat|fool|hoax",
    "deferral_price": r"wait(ing|ed)?|later|for (a|the|my)? ?(sale|wedding|function|occasion|festiv|party|birthday|diwali)|price drop|discount|expensive|too costly|overpriced|value for money|worth (it|buying|the)|budget|on sale|end of season",
    "fit_style": r"\bsize\b|\bfit\b|too (small|big|large|tight|loose)|sizing|styl|pair with|how to wear|what to wear|occasion|match(es|ing)? (my|the)",
    "quality_decision": r"quality|cheap quality|poor quality|material|fabric|worth",
}
# Purchase-decision consequence -> keep even if otherwise operational.
DETERRENT = r"never (buy|order|shop|use|purchas|trust)\w*.*(again|from|this|nykaa)|won'?t (buy|order|recommend|use|shop)|will (never|not) (buy|order|recommend|shop|use)|lost trust|uninstall|deleted the app|switch(ed)? to|buy(ing)? (on|from) (myntra|ajio|amazon|flipkart|tata)|would not recommend|don'?t (buy|order|trust)|avoid (nykaa|at all)"

# Pure-operational (drop only if NO keep/deterrent signal present).
OPERATIONAL = {
    "pure_delivery_logistics": r"not delivered|delivery (date|delay|guy|partner|attempt)|deliver(ed|y)|shipp(ed|ing)|pick ?up|pickup|courier|delhivery|shadowfax|tracking|out for delivery|reschedul",
    "pure_refund_return_dispute": r"refund|return (request|pickup|window)|replace(ment)?|money (stuck|back|refund)|not picked|amount (stuck|not)",
    "app_bug_only": r"crash|hang|not working|app is (slow|bad|worst)|bug|glitch|\botp\b|login (issue|problem|error)|payment (failed|issue)",
    "customer_care_ops": r"customer (care|support|service)|helpline|call(ed|ing)?|chat|email|ticket|executive|escalat|representative|resolution|revert",
}
BOILERPLATE = r"file a consumer complaint|voxya|attorney[- ]client|consumer forum|all trademarks|© ?20\d\d|independent platform"


def compiled(d):
    return {k: re.compile(v, re.I) for k, v in d.items()}


KEEP_RE = compiled(KEEP_PATTERNS)
OPER_RE = compiled(OPERATIONAL)
DET_RE = re.compile(DETERRENT, re.I)
BOIL_RE = re.compile(BOILERPLATE, re.I)


def load_corpus() -> list[dict]:
    seen, items = set(), []
    for f in sorted(DATA_RAW.glob("*.json")):
        for it in json.loads(f.read_text(encoding="utf-8")):
            if it["id"] in seen:
                continue
            seen.add(it["id"])
            items.append(it)
    return items


def classify_relevance(it: dict) -> tuple[bool, list[str], str]:
    """Return (keep?, keep_signals, reject_reason)."""
    text = it.get("raw_text", "")
    if it["source"].startswith("web_"):
        return True, ["external_evidence"], ""
    # The scraped Voxya page was entirely site boilerplate (how-to-file-a-complaint),
    # no actual user complaints -> drop the whole source.
    if it["source"] == "voxya":
        return False, [], "boilerplate_nav"
    if BOIL_RE.search(text) and len(text) < 600 and not any(r.search(text) for r in KEEP_RE.values()):
        return False, [], "boilerplate_nav"

    keep_signals = [name for name, rx in KEEP_RE.items() if rx.search(text)]
    if DET_RE.search(text):
        keep_signals.append("purchase_deterrent")

    if keep_signals:
        return True, keep_signals, ""

    # No decision signal -> see if it's purely operational.
    for reason, rx in OPER_RE.items():
        if rx.search(text):
            return False, [], reason

    if len(text) < 40:
        return False, [], "too_short_noise"
    return False, [], "off_topic_no_decision_signal"


def main() -> int:
    corpus = load_corpus()
    kept, rejected = [], []
    for it in corpus:
        keep, signals, reason = classify_relevance(it)
        rec = dict(it)
        rec["is_external"] = it["source"].startswith("web_")
        rec["is_primary"] = not rec["is_external"]
        if keep:
            rec["filter_keep_signals"] = signals
            kept.append(rec)
        else:
            rec["reject_reason"] = reason
            rejected.append(rec)

    (DATA / "filtered.json").write_text(
        json.dumps(kept, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "rejected.json").write_text(
        json.dumps(rejected, ensure_ascii=False, indent=2), encoding="utf-8")

    # ----- report -----
    print(f"Corpus: {len(corpus)}  ->  KEPT {len(kept)} | REJECTED {len(rejected)}")
    print(f"  primary kept: {sum(1 for k in kept if k['is_primary'])} | "
          f"external kept: {sum(1 for k in kept if k['is_external'])}")

    from collections import Counter
    print("\nReject reasons:")
    for reason, n in Counter(r["reject_reason"] for r in rejected).most_common():
        print(f"  {reason:32s} {n}")
    print("\nKeep signals (multi-count):")
    sig = Counter(s for k in kept for s in k["filter_keep_signals"])
    for name, n in sig.most_common():
        print(f"  {name:24s} {n}")
    print("\nKept by source:")
    for src, n in Counter(k["source"] for k in kept).most_common():
        print(f"  {src:20s} {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
