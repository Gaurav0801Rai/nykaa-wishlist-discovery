# Project Summary — Nykaa Fashion Wishlist→Purchase Discovery Engine

> Hand-off doc: what exists, how it was built, and how to run it.
> Last updated: 2026-08-18.

---

## 1. What this is
A PM case study for **Nykaa Fashion** (multi-category: apparel, footwear, watches,
sunglasses, bags, belts, jewellery, makeup).

- **Goal:** increase the share of users who buy at least one wishlisted item within 30 days
  of saving it.
- **Constraint:** no monetary incentives — the levers are confidence, recall and decision support.
- **This repo is the discovery engine**: it finds *which blockers* stop a saved item from
  being bought, across all categories, from public user feedback.
- **Deliverable:** a live website (Vercel) plus a reproducible analysis in this repo.

**Live site:** https://nykaa-wishlist-discovery.vercel.app
**Repo:** https://github.com/Gaurav0801Rai/nykaa-wishlist-discovery

---

## 2. How the analysis was produced
| Step | Script | Output |
|------|--------|--------|
| Collect | `collect_playstore.py`, `collect_appstore.py`, `collect_reddit.py`, `collect_forums.py`, `collect_websearch.py`, `ingest_provided.py`, `ingest_extra.py` | `data/raw/*.json`, `data/extra_raw.json` |
| Filter | `filter.py` | `data/filtered.json`, `data/rejected.json` |
| Analyse | manual review recorded in `data/claude_tags*.json`, applied by `apply_tags.py` | `web/src/data/classified.json` |
| Report | `report.py` | `outputs/*.csv`, `FINDINGS.md` |
| Orchestrate | `run_all.py` | applies tags + regenerates reports |

**Method:** thematic (multi-label) classification, not sentiment analysis. Every one of the
276 items was read and tagged by hand against a 15-blocker taxonomy. An item can carry
several blockers, so percentages do not sum to 100. Items showing no blocker were left
untagged rather than forced into one (29 of them). `data/claude_tags*.json` is the audit trail.

---

## 3. The corpus — 276 items
| Source | Items |
|--------|------:|
| Play Store (`com.fsn.nds`, India) | 159 |
| Reddit | 84 |
| Community & web | 13 |
| Review forums (Trustpilot, PissedConsumer) | 10 |
| Q&A sites (Quora) | 10 |

**Known gaps:** App Store India returns 0 reviews via Apple's public RSS. Reddit and most
forums were IP-blocked from the sandbox, so that material was collected separately and
ingested. AI-synthesised or paraphrased text is never counted as user feedback.

**Store IDs:** Play `com.fsn.nds` · iOS `1439872423`. (Nykaa Beauty deliberately excluded.)

---

## 4. Results
**Ranked blockers (share of 276):**

| # | Blocker | Items | % |
|---|---------|------:|--:|
| 1 | Delivery / return friction | 158 | 57.2% |
| 2 | Trust / authenticity | 63 | 22.8% |
| 3 | Price wait | 42 | 15.2% |
| 4 | Quality doubt | 38 | 13.8% |
| 5 | Decision paralysis | 30 | 10.9% |
| 6 | Confidence / validation gap | 23 | 8.3% |
| 7 | Fit / size doubt | 23 | 8.3% |
| 8 | Comparison gap | 21 | 7.6% |
| 9 | Bookmarking, no intent | 17 | 6.2% |
| 10 | Context loss / wishlist visibility | 15 | 5.4% |
| 11 | Occasion / timing | 10 | 3.6% |
| 12 | Size / stock gone | 10 | 3.6% |

*Decision paralysis merges choice overload and endless search/deferral — two sides of one
behaviour: options stay open and no decision is reached.*

**By theme:**

| Theme | Items | % |
|-------|------:|--:|
| Post-purchase | 158 | 57.2% |
| Confidence gap | 116 | 42.0% |
| Decision friction | 67 | 24.3% |
| Value & timing | 50 | 18.1% |
| Availability | 10 | 3.6% |

**What it shows:** public review writing is dominated by what happens *after* checkout —
fulfilment and the confidence cluster (trust, quality, fit, validation), both reported by
people who already ordered. Friction while an item is still *saved* is a distinct, smaller
signal, led by decision paralysis, the comparison gap, saving without buying, and context
loss. Category profiles differ: apparel carries fit and quality doubts, beauty is led by
validation-seeking and price waiting.

---

## 5. The website (`web/`)
Next.js (App Router), deployed on Vercel with **Root Directory = `web`**. Three views:

- **Ask Assistant** — chatbot grounded in this corpus, with the discovery questions as
  shortcuts. Answers are short, cite real numbers, and do not prescribe solutions.
- **Dashboard** — corpus stats and source mix; the ranked blockers with counts and %,
  each expanding to a short summary plus 3–4 real verbatims; an opportunity view that
  re-reads the same blockers by where in the journey they occur; and observations.
- **Live Analyzer** — paste reviews (max 20) and they are classified live against the same
  taxonomy. Session-only: nothing is saved or shared, and the base corpus never changes.

**Keys (server-side only, never sent to the browser):**
- `GEMINI_API_KEY` — Live Analyzer (`gemini-3.5-flash`)
- `GROQ_API_KEY` (+ `GROQ_API_KEY_2` for rotation) — Ask Assistant (`openai/gpt-oss-20b`)

The static analysis is **not** produced by an LLM; Gemini only classifies text a visitor
pastes into the Analyzer.

**Integrity check:** `npm run check` verifies every displayed quote exists in the corpus, is
tagged with the blocker it appears under, and is verbatim. It runs on every build.

---

## 6. How to run it

**Analysis (offline, no keys needed):**
```bash
python -m pip install -r requirements.txt
python src/run_all.py
```

**Website:**
```bash
cd web
npm install
cp .env.example .env.local   # add GEMINI_API_KEY and GROQ_API_KEY
npm run dev                  # http://localhost:3000
```

**Deploy:** import the repo on Vercel → Root Directory `web` → add the env vars → deploy.

---

## 7. Repo map
```
nykaa-discovery/
├── CLAUDE.md, README.md, summary.md, seed_sources.md, FINDINGS.md
├── requirements.txt, .env.example
├── src/                 collectors, filter.py, apply_tags.py, report.py, run_all.py
├── data/
│   ├── raw/*.json       collected items
│   ├── claude_tags*.json   the manual analysis (audit trail)
│   ├── extra_raw.json, verified_extra.json
│   └── filtered.json, rejected.json
├── outputs/             opportunity_ranking.csv, segment_crosstab.csv
├── web/                 the Next.js site (see web/README.md)
└── app.py               early Streamlit prototype, superseded by web/
```
