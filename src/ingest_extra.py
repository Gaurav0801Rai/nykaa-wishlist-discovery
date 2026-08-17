"""
Build data/extra_raw.json: additional REAL wishlist-decision voice to ADD to the
counted corpus, UNTAGGED (Gemini tags it later, same as the base) so tags are
consistent and accurate.

  * Reddit shopping/beauty/general-wishlist quotes (data/reddit_wishlist_raw.json),
    EXCLUDING r/Steam (video games) and self-promo, kept only if they pass the
    same Stage-2 relevance filter as the rest of the corpus.
  * Real open-web first-person wishlist quotes we actually fetched
    (src/web_seed_extracts.json, evidence_type == external_voice).

NOT included: r/Steam video games, self-promo, aggregate benchmark STATS
(Iyengar/Baymard/etc. are not user reviews), and the AI-synthesized Kimi file.
"""
from __future__ import annotations

import json
from pathlib import Path

from common import make_item, ROOT
from filter import classify_relevance

DATA = ROOT / "data"
EXCLUDE_SUBREDDITS = {"Steam", "alphaandbetausers"}


def load_reddit() -> list[dict]:
    raw = json.loads((DATA / "reddit_wishlist_raw.json").read_text(encoding="utf-8"))
    out = []
    for x in raw:
        if x.get("subreddit") in EXCLUDE_SUBREDDITS:
            continue
        it = make_item(
            source="reddit",
            raw_text=x.get("raw_text", ""),
            url=x.get("thread_url") or x.get("url", ""),
            date=x.get("date_if_available"),
            rating=x.get("score"),
            query_hint=f"r/{x.get('subreddit','')}",
        )
        if it:
            out.append(it)
    return out


def load_web_voice() -> list[dict]:
    seed = json.loads((Path(__file__).with_name("web_seed_extracts.json")).read_text(encoding="utf-8"))
    out = []
    for ex in seed.get("extracts", []):
        if ex.get("evidence_type") != "external_voice":
            continue
        it = make_item(source="community", raw_text=ex["text"], url=ex["url"],
                       query_hint=f"web:{ex.get('domain','')}")
        if it:
            out.append(it)
    return out


def main() -> int:
    candidates = load_reddit() + load_web_voice()
    kept, dropped = [], 0
    seen = set()
    for it in candidates:
        keep, _signals, _reason = classify_relevance(it)
        if not keep or it["id"] in seen:
            dropped += 1
            continue
        seen.add(it["id"])
        kept.append({
            "id": it["id"],
            "source": it["source"],
            "text": it["raw_text"],
            "rating": it.get("rating"),
        })

    (DATA / "extra_raw.json").write_text(
        json.dumps(kept, ensure_ascii=False, indent=2), encoding="utf-8")
    from collections import Counter
    print(f"Candidates {len(candidates)} -> kept {len(kept)} relevant (dropped {dropped}).")
    print("By source:", dict(Counter(k["source"] for k in kept)))
    print("-> data/extra_raw.json (untagged; Gemini will tag with the base corpus)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
