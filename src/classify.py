"""
Stage 3 - Classify (blocker tagging).

Two paths:
  * --use-api : Anthropic Haiku bulk tagging (per CLAUDE.md). Requires
    ANTHROPIC_API_KEY. This is a PAID run -- the script asks for confirmation
    unless --yes is passed. It caches per-item so re-runs are cheap.
  * default   : a transparent DETERMINISTIC keyword classifier ("heuristic_v0").
    Produces the same JSON schema so the whole pipeline runs end-to-end for free.
    Every item is marked tagging_method="heuristic_v0" and gets a heuristic
    model_confidence -- these tags are provisional pending the human ~20-item
    spot-check (mandatory) and the optional model re-tag.

Output: data/classified.json  (schema per CLAUDE.md):
  {id, source, url, text, blocker_codes[], category_signal, segment_signal,
   model_confidence, supporting_quote, is_external, region, rating, tagging_method}
"""
from __future__ import annotations

import json
import os
import re
import sys

from common import ROOT

DATA = ROOT / "data"
CACHE = ROOT / "cache" / "classifications"
CACHE.mkdir(parents=True, exist_ok=True)

# ---- the locked candidate blocker vocabulary (CLAUDE.md) ----
BLOCKER_PATTERNS = {
    "choice_overload": r"too many|so many (option|choice|thing|item|dress|style|design)|overwhelm|can'?t (decide|choose|pick)|hard to (choose|decide|pick)|spoilt for choice|cluttered|decision fatigue|cognitive load|paralys|how many (shade|colour|color|type)",
    # WISHLIST context-loss: accumulation / overflow / forgetting near a
    # wishlist/save/cart token, not conversational "forgot to reply".
    "context_loss": r"(?:wish ?list|saved items?|\bcart\b|shortlist)\b.{0,70}(?:forgot|forget|lost track|overflow|impossible to sort|cluttered|too many|so many|accumulat|piling|hundreds|gazillion|for (?:months|weeks|years)|never (?:clear|able|get)|\bclear\b|\d{2,}\s*items?)|(?:toxic|hundreds of|gazillion|so many|piling up|clear my|buy my|huge loan|can'?t clear|never clear).{0,30}wish ?list|(?:forgot|forget|lost track|accumulat)\w*.{0,50}(?:wish ?list|saved|to buy)|overflowing|impossible to sort|marooned|out of sight,? out of mind|black hole|no way to (?:filter|sort)|\d{2,}\s*(?:saved )?items?\b.{0,25}(?:wish ?list|cart|list)|so many saved|shortlist now feels|cluttered and overwhelming|mark[- ]and[- ]forget",
    "within_category_compare_gap": r"compar(e|ing|ison)|which one|hard to compare|across (separate|different) (window|tab)|side by side|too similar|look(s)? the same",
    "confidence_validation_gap": r"not sure|unsure|doubt|second[- ]guess|need (an )?opinion|reviews?|verified buyer|photos?|as (shown|described|advertised|expected)|looks? different|true to size|will it (fit|suit|match)|confiden|trust the",
    "endless_search_deferral": r"just browsing|keep (looking|scrolling|checking)|browsing mode|thrill of the hunt|rabbit hole|almost no purchasing|quit the process|never (buy|purchas)|keep scrolling past|window shop",
    "cross_sell_miss": r"complete the look|pair(ed)? with|what to wear with|frequently bought|matching (item|accessor)|cross[- ]sell|complementary|goes with|add[- ]on",
    "occasion_timing": r"wedding|function|festiv|diwali|party|birthday|occasion|needed it for|gift|urgent|special (function|event)|in time",
    "price_wait": r"wait(ing|ed)? for (a )?(sale|discount|price|offer)|price drop|expensive|too costly|overpriced|budget|on sale|end of season|cheaper (on|elsewhere|at)|value for money|worth the (price|money)",
    "fit_size_doubt": r"\bsize\b|\bfit\b|too (small|big|large|tight|loose)|sizing|size chart|fitting|runs (tight|small|large)",
    "styling_uncertainty": r"how to (wear|style)|what to (wear|pair)|styl(e|ing)|will it match my|not my style|suit me",
    "size_or_stock_gone": r"out of stock|sold out|not available|no longer available|unavailable|stock (gone|over)|size .* (gone|not available)",
    "quality_doubt": r"quality|material|fabric|cheap(ly)? made|flimsy|poor(ly)? (made|quality)|not worth the quality|old stock",
    "trust_authenticity": r"\bfake\b|genuine|authentic|first copy|duplicate|counterfeit|scam|cheat|fool|hoax|not (the )?real|fraud|copy product|local product",
    # Only when return/delivery is framed as a PURCHASE BARRIER (a reason not to buy
    # a saved item), not merely narrated. Incidental "my refund is stuck" is NOT this
    # blocker -- it was kept for its trust/quality decision signal instead.
    "delivery_return_friction": r"return (policy|window|process|is a|are a|was a|nightmare|hassle|difficult|refus|reject)|no return|hard to return|returns? (are|is|were) (a )?(nightmare|hassle|worst|difficult|pain)|won'?t (buy|order).*(return|refund|delivery)|because of .*(return|delivery)|(15|30) ?days? return|return window|exchange policy|delivery (keeps changing|always (late|delayed)|never)|shorter? return",
    "bookmarking_no_intent": r"fantasy shopping|window shopping|just sav(e|ing)|no intention to buy|mental bookmark|save(d)? but never|in my wishlist for (month|week)|holding pattern",
}

CATEGORY_PATTERNS = {
    "apparel_ethnic": r"dress|top\b|shirt|t[- ]?shirt|jean|trouser|kurta|kurti|saree|lehenga|suit\b|pajama|gown|blazer|palazzo|ethnic|clothe?s|apparel|lower\b",
    "footwear": r"shoe|heel|sneaker|footwear|sandal|slipper|boot",
    "watches": r"\bwatch(es)?\b",
    "sunglasses": r"sunglass|goggle|eyewear",
    "bags": r"\bbag\b|handbag|wallet|clutch|backpack|purse",
    "belts": r"\bbelt\b",
    "jewellery": r"jewel|earring|necklace|\bring\b|bangle|jewellery|jewelry",
    "makeup_beauty": r"makeup|lipstick|kajal|foundation|serum|face wash|body mist|\bspf\b|lakme|\bdove\b|pond'?s|cosmetic|shampoo|conditioner|beauty|plum",
}

SEGMENT_PATTERNS = {
    "deal_seeker": r"discount|\bsale\b|price|cheap|budget|offer|deal|expensive|costly",
    "occasion_buyer": r"wedding|function|gift|festiv|occasion|birthday|party|diwali|urgent",
    "cautious_validator": r"reviews?|photos?|not sure|doubt|authentic|\bfake\b|trust|confiden|genuine|verified",
    "browser_no_intent": r"browsing|wishlist|saved?|fantasy|window shop|never buy|scrolling",
    "quality_conscious": r"quality|material|fabric|premium|worth",
    "comparison_shopper": r"myntra|ajio|amazon|flipkart|tata ?cliq|compar|\bvs\b|other (site|app)",
}

# Fallback: filter keep-signal -> a default blocker, so nothing is left untagged.
KEEPSIGNAL_FALLBACK = {
    "confidence_trust": "confidence_validation_gap",
    "deferral_price": "price_wait",
    "quality_decision": "quality_doubt",
    "fit_style": "fit_size_doubt",
    "comparison": "within_category_compare_gap",
    "purchase_deterrent": "trust_authenticity",
    "wishlist_save": "context_loss",
    "choice_overload": "choice_overload",
    "external_evidence": "choice_overload",
}


def _compile(d):
    return {k: re.compile(v, re.I) for k, v in d.items()}


B_RE = _compile(BLOCKER_PATTERNS)
C_RE = _compile(CATEGORY_PATTERNS)
S_RE = _compile(SEGMENT_PATTERNS)


_QUOTE_FALLBACK = re.compile(
    r"wish ?list|\bcart\b|saved|shortlist|forgot|forget|too many|so many|"
    r"discount|sale|price|size|fit|quality|compare|genuine|authentic|fake", re.I)


def pick_quote(text: str, blocker_codes: list[str]) -> str:
    sentences = [s for s in re.split(r"(?<=[.!?])\s+|\n+", text) if len(s.strip()) > 8]
    for code in blocker_codes:
        rx = B_RE.get(code)
        for sent in sentences:
            if rx and rx.search(sent):
                return sent.strip()[:220]
    # no sentence matched the blocker directly -> prefer a decision-relevant sentence
    for sent in sentences:
        if _QUOTE_FALLBACK.search(sent):
            return sent.strip()[:220]
    return (sentences[0].strip() if sentences else text.strip())[:220]


def heuristic_tag(it: dict) -> dict:
    text = it.get("raw_text", "")
    blockers = [name for name, rx in B_RE.items() if rx.search(text)]
    if not blockers:
        for sig in it.get("filter_keep_signals", []):
            fb = KEEPSIGNAL_FALLBACK.get(sig)
            if fb and fb not in blockers:
                blockers.append(fb)
    if not blockers:
        blockers = ["confidence_validation_gap"]

    cats = [name for name, rx in C_RE.items() if rx.search(text)]
    category = cats[0] if cats else "unknown_general"

    segs = [(name, len(rx.findall(text))) for name, rx in S_RE.items() if rx.search(text)]
    segs.sort(key=lambda x: x[1], reverse=True)
    segment = segs[0][0] if segs else "general"

    # heuristic confidence: more distinct blocker hits + longer text -> higher
    strong = len([b for b in blockers if B_RE.get(b) and B_RE[b].search(text)])
    conf = min(0.85, 0.4 + 0.12 * strong + (0.05 if len(text) > 150 else 0))
    conf = round(conf, 2)

    return {
        "id": it["id"],
        "source": it["source"],
        "url": it.get("url", ""),
        "text": text,
        "blocker_codes": blockers,
        "category_signal": category,
        "segment_signal": segment,
        "model_confidence": conf,
        "supporting_quote": pick_quote(text, blockers),
        "is_external": it.get("is_external", it["source"].startswith("web_")),
        "region": it.get("region"),
        "rating": it.get("rating"),
        "tagging_method": "heuristic_v0",
    }


# ---------- optional Anthropic API path ----------
API_SYSTEM = (
    "You are tagging e-commerce user feedback for a Nykaa Fashion wishlist->purchase "
    "discovery study. For each item return STRICT JSON with keys: blocker_codes (array "
    "from this fixed set only: " + ", ".join(BLOCKER_PATTERNS.keys()) + "), category_signal, "
    "segment_signal, model_confidence (0-1), supporting_quote (verbatim substring). "
    "Tag ALL blockers that apply, including fit_size_doubt and price_wait. Do not invent codes."
)


def api_tag(items: list[dict], model: str = "claude-haiku-4-5-20251001") -> list[dict]:
    import anthropic
    client = anthropic.Anthropic()
    out = []
    for it in items:
        cache_f = CACHE / f"{it['id']}.json"
        if cache_f.exists():
            out.append(json.loads(cache_f.read_text(encoding="utf-8")))
            continue
        msg = client.messages.create(
            model=model, max_tokens=400, system=API_SYSTEM,
            messages=[{"role": "user", "content": it["raw_text"][:1500]}],
        )
        raw = msg.content[0].text
        try:
            parsed = json.loads(re.search(r"\{.*\}", raw, re.S).group(0))
        except Exception:
            parsed = {"blocker_codes": ["confidence_validation_gap"],
                      "category_signal": "unknown_general", "segment_signal": "general",
                      "model_confidence": 0.3, "supporting_quote": it["raw_text"][:160]}
        rec = {**heuristic_tag(it), **parsed, "tagging_method": f"api:{model}"}
        cache_f.write_text(json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")
        out.append(rec)
    return out


def main(argv: list[str]) -> int:
    items = json.loads((DATA / "filtered.json").read_text(encoding="utf-8"))
    use_api = "--use-api" in argv
    if use_api:
        if not os.environ.get("ANTHROPIC_API_KEY"):
            print("ERROR: --use-api needs ANTHROPIC_API_KEY."); return 2
        if "--yes" not in argv:
            print(f"About to send {len(items)} items to the Anthropic API (PAID). "
                  f"Re-run with --use-api --yes to confirm."); return 3
        classified = api_tag(items)
    else:
        classified = [heuristic_tag(it) for it in items]
        print("Tagged with DETERMINISTIC heuristic_v0 (no API). "
              "Provisional pending spot-check + optional model re-tag.")

    (DATA / "classified.json").write_text(
        json.dumps(classified, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(classified)} classified items -> data/classified.json")

    from collections import Counter
    bc = Counter(b for c in classified for b in c["blocker_codes"])
    print("\nBlocker tag frequency (multi-label, all items):")
    for name, n in bc.most_common():
        print(f"  {name:30s} {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
