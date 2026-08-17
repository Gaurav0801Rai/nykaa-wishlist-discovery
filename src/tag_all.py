"""
Tag the full website corpus (Nykaa + Reddit/community) with the deterministic
heuristic classifier and write web/src/data/classified.json. Quota-independent
fallback for when the Gemini batch re-tag can't run (free-tier limit).

Reads web/src/data/corpus_base.json (produced by web/scripts/sync-data.mjs).
"""
from __future__ import annotations

import json

from common import ROOT
from classify import B_RE, C_RE, pick_quote

WEBDATA = ROOT / "web" / "src" / "data"


def main() -> int:
    base = json.loads((WEBDATA / "corpus_base.json").read_text(encoding="utf-8"))
    out = []
    for x in base:
        text = x.get("text", "")
        # direct pattern match only -- NO default-to-confidence fallback, so an
        # item that matches nothing stays untagged (honest) rather than inflating.
        blockers = [name for name, rx in B_RE.items() if rx.search(text)]
        cats = [name for name, rx in C_RE.items() if rx.search(text)]
        out.append({
            "id": x["id"],
            "source": x["source"],
            "text": text,
            "blocker_codes": blockers,
            "category_signal": cats[0] if cats else "unknown_general",
            "supporting_quote": pick_quote(text, blockers) if blockers else text[:160],
            "rating": x.get("rating"),
            "tagging_method": "heuristic_v0",
        })

    (WEBDATA / "classified.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    from collections import Counter
    by_blk = Counter(b for r in out for b in r["blocker_codes"])
    by_src = Counter(r["source"] for r in out)
    print(f"Tagged {len(out)} items -> web/src/data/classified.json")
    print("By source:", dict(by_src))
    print("Blocker frequency:")
    for b, n in by_blk.most_common():
        print(f"  {b:30s} {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
