# Nykaa Fashion — Wishlist→Purchase Discovery Engine (Part 1)

Discovers *why users don't buy items they wishlist within 30 days*, **across all
categories**, from public data. Analysis is a manual review of every collected item.

## Pipeline (scripts in `src/`, re-runnable)
| Step | Script | Output |
|------|--------|--------|
| Collect | `collect_playstore.py`, `collect_appstore.py`, `collect_reddit.py`, `collect_forums.py`, `collect_websearch.py`, `ingest_provided.py`, `ingest_extra.py` | `data/raw/*.json`, `data/extra_raw.json` |
| Filter | `filter.py` | `data/filtered.json`, `data/rejected.json` |
| Analyse | manual review recorded in `data/claude_tags*.json`, applied by `apply_tags.py` | `web/src/data/classified.json` |
| Report | `report.py` | `outputs/*.csv`, `FINDINGS.md` |

Every corpus item was read and tagged by hand against the 15-blocker taxonomy;
`data/claude_tags*.json` is the audit trail. Run the analysis end-to-end:
```bash
python src/run_all.py
```

## Data provenance
- **One counted bucket:** all corpus items are real user feedback — Play Store reviews
  (`com.fsn.nds`), scraped Trustpilot / PissedConsumer / Quora, and Reddit + community
  discussion about wishlist shopping.
- **Excluded:** AI-synthesised or paraphrased text is never counted as user feedback.
- **Blocked in collection:** App Store India returned 0 reviews; Reddit and most forums
  were IP-blocked from the sandbox, so that material was collected separately.

## Key finding (provisional)
Nykaa's public post-purchase data shows a **confidence problem** (trust/authenticity,
quality, price-deferral, validation, fit). The **decision-graveyard** blockers
(choice_overload, context_loss) are strong in **external** evidence but nearly absent in
reviews — a **sampling artifact**, and the central question for Part 3. See `FINDINGS.md`.

## Public website (the "testable link")
A Next.js app in [`web/`](web/), deployable to Vercel. Powered by **Google Gemini**
(`GEMINI_API_KEY`, server-side only in `/api/analyze` — the browser never sees the key or
any backend detail). Presents two lenses — **Lens 1: what users tell us** (raw frequency)
and **Lens 2: where the opportunity is** (re-ranked by actionability) — plus **Discovery
Questions**, a **How-it-works** panel, and a live **Analyzer** that appends pasted feedback
to the corpus and recomputes both lenses. `npm run retag` re-tags the whole base corpus with
the same Gemini classifier. See [`web/README.md`](web/README.md) for local run and Vercel deploy.
