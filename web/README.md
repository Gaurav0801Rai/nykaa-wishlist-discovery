# Nykaa Fashion — Wishlist Discovery Engine (public website)

The Vercel-deployable "testable link" for Part 1. A live AI discovery engine for
Nykaa Fashion's wishlist→purchase problem, presented in two lenses plus discovery
Q&A — all powered by one **Google Gemini** classifier.

## What's on it
- **Analyzer** — paste feedback (one item/line, max 20). Each line is classified live by
  Gemini and **appended to the in-memory corpus**; both lenses recompute. A **Base ⇄ Base +
  added** toggle switches the working set.
- **Lens 1 · What users tell us** — raw blocker frequency (counts + %) over all user
  feedback. Honest: trust/authenticity ranks #1 as the data shows. Filter by source &
  category; expand any blocker for real quotes.
- **Lens 2 · Where the opportunity is** — the same blockers **re-ranked by actionability**
  for the goal (wishlist→purchase in 30 days, no monetary levers). Nothing is hidden;
  wishlist blockers (context loss, confidence, comparison, deferral) rise; trust & price
  stay visible with a note. Includes the honest under-sampling caveat.
- **Discovery Questions** — the assignment's questions answered from data, each with
  blockers/%/quotes and a "thin data → needs primary research" flag where reviews can't answer.
- **How it works** — pipeline strip + real corpus/rejected counts + known gaps.
- **Supporting research** — external benchmarks (Iyengar, Baymard, Boldmetrics), labelled
  and **never** counted in a Nykaa %.

## Backend (hidden)
`/api/analyze` (server-only, Node runtime) reads **`GEMINI_API_KEY`** and calls Gemini
(`gemini-3.5-flash` by default; override with `GEMINI_MODEL`). The key, model, endpoint, and every backend detail stay on
the server — the route returns only `{ count, results }`. JSON parsing is defensive
(validates blocker codes against the taxonomy). The **same** classifier re-tags the base
corpus via `npm run retag`, so every number on the site comes from one classifier.

## Run locally
```bash
cd web
npm install
# add your key (gitignored):
cp .env.local.example .env.local        # then set GEMINI_API_KEY=...
npm run dev                              # http://localhost:3000
```
`sync-data` (auto-runs) refreshes the snapshots from `../data` + `../outputs`.

### Re-tag the base corpus with Gemini (one consistent classifier)
```bash
npm run retag        # reads GEMINI_API_KEY from .env.local; ~179 items, batched
```
This overwrites `src/data/classified.json` with Gemini tags (`gemini:<model>`), replacing the
provisional keyword seed. A badge in **How it works** shows which classifier is live. The site
builds and runs before you retag (it ships with the seeded snapshot).

## Deploy to Vercel
1. Push the repo to GitHub.
2. Vercel → **New Project** → import → set **Root Directory = `web`** (Next.js auto-detected).
3. **Settings → Environment Variables**: add `GEMINI_API_KEY` (and optional `GEMINI_MODEL`).
4. Deploy. The committed snapshot in `src/data` means the build needs no Python.
   (Run `npm run retag` locally and commit the updated `classified.json` to ship Gemini
   numbers to production.)

## Structure
```
web/
├── src/app/            layout.tsx, page.tsx, globals.css, api/analyze/route.ts (Gemini-only)
├── src/components/     Analysis (shell+tabs), AddDataBox, Lens1UserVoice, Lens2Opportunity,
│                       DiscoveryQuestions, HowItWorks, Filters, BlockerRow, BlockerBarChart,
│                       SupportingResearch
├── src/lib/            codes.mjs, gemini.mjs (server-only), taxonomy.ts, corpus.ts,
│                       opportunity.ts, questions.ts, types.ts
├── src/data/           corpus_base.json, external.json, classified.json, methodology.json
└── scripts/            sync-data.mjs, retag-corpus.mjs
```
