# Project Summary — Nykaa Fashion Wishlist→Purchase Discovery Engine (Part 1)

> Hand-off doc. Paste this into another chat to bring it up to speed, or read it to
> understand exactly what exists and what's pending. Last updated: 2026-08-16.

---

## 1. What this project is
A PM case study for **Nykaa Fashion** (a multi-category platform: apparel, footwear,
watches, sunglasses, bags, belts, jewellery, makeup).

- **Strategic goal:** increase the % of users who **purchase ≥1 wishlisted item within
  30 days** of adding it.
- **Hard constraint:** **no monetary incentives** — levers are confidence, recall,
  decision support.
- **This repo = Part 1 only: the AI-Powered Discovery Engine.** It discovers *which
  blocker* stops wishlist→purchase, then feeds Part 3 (survey/interviews) and Part 5 (MVP).
- **Lens:** investigate the wishlist as a whole (a 40–50 item mixed list) **across all
  categories**, not per-product fit. Tag **all** candidate blockers (including the
  clothing-only ones) and let frequency rank them — never rig toward a preferred answer.

---

## 2. Pipeline (7 stages, each a re-runnable script in `src/`)
| Stage | Script(s) | Output |
|------|-----------|--------|
| 1 Collect | `collect_playstore.py`, `collect_appstore.py`, `collect_reddit.py`, `collect_forums.py`, `collect_websearch.py`, `ingest_provided.py`, `ingest_md.py` | `data/raw/*.json` |
| 2 Filter | `filter.py` | `data/filtered.json`, `data/rejected.json` |
| 3 Classify | `classify.py` | `data/classified.json` |
| 4 Quantify | `quantify.py` | `outputs/opportunity_ranking.csv` |
| 5 Segment | `segment.py` | `outputs/segment_crosstab.csv`, `outputs/blocker_by_buyersegment.csv` |
| 6 Synthesize | `synthesize.py` | `FINDINGS.md`, `outputs/tag_spotcheck.md` |
| 7 Handoff | `handoff.py` | `research_hypotheses.md`, `interview_guide.md` |
| — Browser | `app.py` (Streamlit) | the "testable link" |
| — Orchestrator | `run_all.py` | runs Stages 2–7 |

---

## 3. Data sources — what worked vs. what was blocked
Collected from **this environment** (a sandbox with datacenter IP):

| Source | Result | Notes |
|--------|--------|-------|
| **Play Store** (`com.fsn.nds`, in) | ✅ **413** reviews | primary data; spans categories |
| **Real scraped** (Trustpilot/PissedConsumer/Quora — from File 1 below) | ✅ **25** | primary Nykaa voice |
| **Open web** (Vice, Medium, MarketExpress, Kissmetrics, SellersCommerce, Shopify, MDPI + benchmarks) | ✅ **26** | **EXTERNAL** — never in Nykaa % |
| App Store iOS (`id1439872423`) | ⚠️ 0 | Apple RSS returns no `in` reviews (real gap) |
| Reddit | ⛔ 0 | 403 — Reddit blocks datacenter IPs |
| Trustpilot/PissedConsumer/Quora (live) | ⛔ blocked | anti-bot/timeout from sandbox |

**Store IDs (confirmed):** Play `com.fsn.nds` · iOS `1439872423`. (Nykaa *Beauty* app,
excluded per your instruction: Play `com.fsn.nykaa`, iOS `1022363908`.)

**seed_sources.md health:** of the 30 links, only ~4 were usable from here; **6 are dead
(404/301)** and **PMC10418091 is mislabeled** (loads a microbiology paper). Worth fixing.

---

## 4. The two markdown files you provided (how each was used)
- **`nykaa_fashion_raw_scraped_data.md` (RAW / real):** ingested as **primary Nykaa data**
  via `src/ingest_provided.py` → 25 items (Trustpilot 12, PissedConsumer 2, Quora 11 after
  dedup). Dropped the one "(Bot/Assistant)" Quora answer and the Voxya boilerplate.
- **`nykaa_fashion_failed_sources_synthesized.md` (SYNTHESIZED):** its own header says it's
  synthesized from snippets/memory. It contains **fabricated quotes and invented stats**, so
  it is **quarantined** — none of it enters the Nykaa corpus (project rule: *NO FABRICATED
  NUMBERS*). Only its well-established **benchmarks** (Iyengar jam 3%/30%, Baymard ~70% cart
  abandonment, Boldmetrics 70% sizing / 36% returns) are used, **labelled external +
  unverified**, and its UX claims became **Part-3 hypotheses**.

> If you want to *legitimately* add the blocked sources (Reddit/Quora/Trustpilot/YouTube),
> collect their **verbatim** text (e.g. from your home network) into the format in
> `data/kimi_import_TEMPLATE.md`, then run `python src/ingest_md.py data/kimi_import.md`.

---

## 5. Results (provisional)
Corpus **481 collected → 205 kept** (179 primary Nykaa + 26 external), **276 rejected**
(logged reasons: pure-delivery 103, too-short 72, customer-care-ops 35, refund-dispute 22, …).

**Ranked blockers — % of 179 primary Nykaa items** (reproducible from `data/classified.json`):

| Blocker | Nykaa # | Nykaa % | External # |
|---------|--------:|--------:|-----------:|
| trust_authenticity | 65 | 36.3% | 1 |
| quality_doubt | 45 | 25.1% | 0 |
| price_wait | 38 | 21.2% | 1 |
| confidence_validation_gap | 29 | 16.2% | 0 |
| fit_size_doubt | 23 | 12.8% | 4 |
| within_category_compare_gap | 18 | 10.1% | 1 |
| occasion_timing | 13 | 7.3% | 0 |
| delivery_return_friction | 12 | 6.7% | 0 |
| endless_search_deferral | 7 | 3.9% | 5 |
| size_or_stock_gone | 4 | 2.2% | 1 |
| context_loss | 3 | 1.7% | 5 |
| choice_overload | **0** | 0% | **13** |
| cross_sell_miss | 0 | 0% | 1 |

**Headline finding:** Nykaa's public (post-purchase, negative-skewed) data shows a
**CONFIDENCE problem** — trust/authenticity, quality, price-deferral, validation, fit. The
**DECISION-GRAVEYARD** hypothesis (choice_overload, context_loss) is strong in **external**
evidence but nearly **invisible in reviews** — because people who defer a saved item don't
write reviews. That's a **sampling artifact**, so it's the **central question for Part 3**,
not a disproven idea. We don't crown it on external data, nor bury it on a biased sample.

---

## 6. Two things still pending (by design)
1. **Mandatory ~20-item tag spot-check** → `outputs/tag_spotcheck.md`. Stage-3 tags are
   `heuristic_v0` (deterministic keyword rules — **no LLM used**), so **all numbers are
   provisional** until reviewed.
2. **Optional model re-tag.** `ANTHROPIC_API_KEY` is **not set** in the sandbox, so the
   Anthropic (Haiku) bulk tagging did not run. With a key:
   `python src/classify.py --use-api --yes` then `python src/run_all.py`.

---

## 7. How to run it locally (Windows)
From the project folder (`C:\Users\Gaurav Kumar\Desktop\nykaa-discovery`):

```bash
# 1. Install dependencies
python -m pip install -r requirements.txt

# 2. (optional) Re-collect Play Store etc. — needs internet; may be blocked on some networks
python src/collect_playstore.py
python src/collect_websearch.py
python src/ingest_provided.py "C:/Users/Gaurav Kumar/Downloads/nykaa_fashion_raw_scraped_data.md"

# 3. Run the analysis end-to-end (Stages 2–7). Data is already in data/raw/, so this works offline
python src/run_all.py

# 4. Launch the browser app (opens at http://localhost:8501)
streamlit run app.py
```

Notes:
- If `streamlit` isn't found, use `python -m streamlit run app.py`.
- The app reads `data/classified.json` + `outputs/*.csv`. If it errors, run step 3 first.
- Windows console: scripts already force UTF-8; if you see encoding errors, prefix with
  `python -X utf8 ...`.
- To deploy the "testable link": push to GitHub → Streamlit Community Cloud → main file `app.py`.

---

## 8. Repo map
```
nykaa-discovery/
├── CLAUDE.md, seed_sources.md, README.md, summary.md
├── requirements.txt, .env.example
├── src/               # all pipeline stages + run_all.py + common.py
├── data/
│   ├── raw/*.json      # collected items (play_store, provided_scraped, web, …)
│   ├── filtered.json, rejected.json, classified.json
│   └── kimi_import_TEMPLATE.md
├── outputs/            # opportunity_ranking.csv, segment_crosstab.csv,
│   │                     blocker_by_buyersegment.csv, tag_spotcheck.md
├── FINDINGS.md, research_hypotheses.md, interview_guide.md
├── app.py              # Streamlit browser
├── cache/, logs/
```

---

## 9. What to do next
1. Run locally (section 7) and open the app.
2. Do the **tag spot-check** (`outputs/tag_spotcheck.md`) — fix any wrong tags.
3. Decide: add real Reddit/Quora data via `ingest_md.py`, and/or run the paid API re-tag.
4. Then the numbers lock, and Part 3 (interviews) runs off `interview_guide.md`.
