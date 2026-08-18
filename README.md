# Nykaa Fashion — Wishlist Discovery Engine

An AI engine that reads real shopper feedback and ranks the reasons people don't buy the
items they save to a wishlist.

**Live:** https://nykaa-wishlist-discovery.vercel.app

## What it does

The site has three views:

- **Ask Assistant** — a chatbot grounded in the analysed feedback. Ask about blockers,
  categories or opportunities and it answers with the real numbers.
- **Dashboard** — the ranked blockers with counts and percentages, each expanding to a short
  summary and real verbatims, plus a view that re-reads the same blockers by where in the
  shopping journey they occur.
- **Live Analyzer** — paste reviews (up to 20) and they are classified live against the same
  taxonomy. Session-only: nothing is saved, and the underlying data never changes.

## The data

276 pieces of real user feedback from the Play Store, Reddit, review forums, Q&A sites and
community discussions. Every item was read and tagged by hand against a 15-blocker taxonomy.
Tagging is multi-label, so an item can carry several blockers and percentages do not sum to
100; items showing no blocker were left untagged rather than forced into one.

`data/claude_tags*.json` holds the per-item tags, so any number on the site can be traced
back to the feedback behind it. `npm run check` verifies that every quote shown on the site
exists in the corpus, sits under a blocker it is actually tagged with, and is verbatim — it
runs on every build.

## Repository layout

```
├── web/          the Next.js site (see web/README.md to run or deploy it)
├── src/          collection scripts, the relevance filter, and the analysis/report pipeline
├── data/         collected feedback and the manual tags
└── outputs/      ranked blockers and the blocker x category crosstab, as CSV
```

## Running the analysis

```bash
python -m pip install -r requirements.txt
python src/run_all.py          # applies the tags, regenerates outputs/
```

## Running the site

```bash
cd web
npm install
cp .env.example .env.local     # add GEMINI_API_KEY and GROQ_API_KEY
npm run dev
```

The two keys are read server-side only and are never exposed to the browser: Gemini powers
the Live Analyzer, Groq powers the Ask Assistant. The dashboard needs no keys. Full setup and
deployment notes are in [`web/README.md`](web/README.md).
