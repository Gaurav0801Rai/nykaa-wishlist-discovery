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
Two server-only routes; keys read on the server only, never exposed to the browser.

- **`/api/analyze`** — reads **`GEMINI_API_KEY`**, calls Gemini (`gemini-3.5-flash` by
  default; override with `GEMINI_MODEL`), returns only `{ count, results }`. Defensive JSON
  parsing (validates blocker codes against the taxonomy). Powers the live "Add data" analyzer.
- **`/api/chat`** — reads **`GROQ_API_KEY`** (Groq, `llama-3.3-70b-versatile` by default;
  override with `GROQ_MODEL` — set a current model from your Groq console), returns `{ reply }`.
  Powers the **"Ask the data"** chatbot. It is grounded in this study's corpus + the Part-1
  discovery questions (see `src/lib/knowledge.ts`), answers free-form questions too, and is
  told to cite real numbers and flag thin-data questions honestly.

Both fail with a generic message (no backend detail) when their key is missing, and the rest
of the site keeps working.

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

> **Free-tier quota note:** Gemini's free tier allows only ~20 requests, so a full base re-tag
> (~9 requests at `BATCH=20`) must run in one clean pass — if you hit `RESOURCE_EXHAUSTED` (429),
> wait for the quota to reset (or use a paid key) and re-run. By design the **base analysis stays
> as the committed snapshot**; Gemini is used live for the small batches of reviews visitors paste,
> which stays well within limits.

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
