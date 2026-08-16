# Nykaa Fashion — Wishlist→Purchase Discovery Engine (Part 1)

Discovers *why users don't buy items they wishlist within 30 days*, **across all
categories**, from public data. The pipeline ends at Stage 6 (synthesize).

## Pipeline (each stage a script in `src/`, re-runnable)
| Stage | Script | Output |
|------|--------|--------|
| 1 Collect | `collect_playstore.py`, `collect_appstore.py`, `collect_reddit.py`, `collect_forums.py`, `collect_websearch.py`, `ingest_provided.py`, `ingest_md.py` | `data/raw/*.json` |
| 2 Filter | `filter.py` | `data/filtered.json`, `data/rejected.json` |
| 3 Classify | `classify.py` | `data/classified.json` |
| 4 Quantify | `quantify.py` | `outputs/opportunity_ranking.csv` |
| 5 Segment | `segment.py` | `outputs/segment_crosstab.csv`, `outputs/blocker_by_buyersegment.csv` |
| 6 Synthesize | `synthesize.py` | `FINDINGS.md`, `outputs/tag_spotcheck.md` |

Run the analysis end-to-end (Stages 2–6):
```bash
python src/run_all.py
```
Browse results:
```bash
streamlit run app.py
```

## Data provenance & honesty rules
- **Primary Nykaa data** (counts toward %): Play Store reviews (`com.fsn.nds`), and
  real scraped Trustpilot / PissedConsumer / Quora (`data/raw/provided_scraped.json`).
- **External evidence** (`data/raw/web.json`, `source=web_*`): open-web + benchmarks.
  Labelled `is_external`, **never** counted in a Nykaa percentage.
- **Excluded**: File-2 *synthesized* quotes/stats (fabricated) — used only as labelled
  external benchmarks (Iyengar, Baymard, Boldmetrics) and as Part-3 hypotheses.
- **Blocked from this environment**: iOS RSS (0 reviews), Reddit + most forums (IP walls).
  Their collectors are built and should run from a residential IP.

## ⚠️ Two things still pending (by design)
1. **Tag spot-check (mandatory).** Stage-3 tags are `heuristic_v0` (deterministic keyword
   rules — no LLM). Review `outputs/tag_spotcheck.md` (~20 items) before trusting numbers.
2. **Optional model re-tag.** With `ANTHROPIC_API_KEY` set:
   ```bash
   python src/classify.py --use-api --yes   # PAID Haiku run; then re-run run_all.py
   ```

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
