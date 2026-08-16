# Nykaa Fashion — Wishlist Discovery Engine (Part 1)

## What this project is
PM case study for **Nykaa Fashion** — a MULTI-CATEGORY platform (apparel, footwear,
watches, sunglasses, belts, ethnic wear, bags, makeup, beauty-adjacent). Strategic
goal: **increase the % of users who purchase at least one wishlisted item within 30
days of adding it.** Hard constraint: **NO monetary incentives**. Levers must be
confidence, recall, and decision support.

This repo builds **Part 1 only: the AI-Powered Discovery Engine.** Its output (a)
determines which problem we pursue and (b) directly feeds the downstream chain:
**engine → survey → interviews → problem definition → MVP.** Write every output so a
PM can act on it in the next stage (see Deliverables).

## Scope & lens (this is a deliberate framing choice)
Investigate wishlist→purchase decision friction **across ALL categories**, treating
the wishlist as a whole (a list of 40-50 mixed items), NOT per-product fit. Reason:
fit/size is real but applies to clothing only; a platform-wide solution needs blockers
that span shoes, watches, sunglasses, makeup, etc. — choice overload, context loss,
comparison difficulty, confidence, cross-sell. So we collect ACROSS categories and use
a broad taxonomy, so cross-category friction can actually surface in the data.

## Honesty rule — orient the scope, but never rig the conclusion
Aiming the engine at the wishlist-decision moment = good scoping. Discarding evidence
that doesn't fit a preferred answer = rigging, and it destroys the finding's value
(Part 1 is graded on DISCOVERING the problem). Therefore:
- Tag EVERY relevant item against ALL candidate blockers, including fit_size_doubt and
  price_wait. Keep contrary evidence — we USE it in Part 4 to argue why a cross-category
  blocker beats a clothing-only one. Contrast is our strongest argument; don't hide it.
- Let the frequencies rank the blockers. "Decision graveyard" (choice_overload +
  context_loss) is a LEADING HYPOTHESIS we favor for its cross-category reach, but it
  must earn its rank from real data. If the data points elsewhere, report that straight.

## Relevance filter vs. confirmation filter (Stage 2 must get this right)
- KEEP (relevant): anything about the save→buy / browse / wishlist decision moment —
  across any category.
- DROP (irrelevant): pure delivery-delay, refund, app-crash, authenticity rants that
  don't explain non-purchase of a saved item.
- NEVER drop a decision-relevant item just because it names price or fit instead of
  "too many items." That is confirmation filtering — forbidden.
- Log a rejected count + reasons so we can show what was filtered and why.

## ⚠️ NO FABRICATED NUMBERS
Every % must come from items WE collected and tagged, reproducible from the data files.
External research (Iyengar jam study; Baymard benchmarks) = supporting evidence, labeled
external, never a Nykaa-specific measurement. Anything we can't measure = a HYPOTHESIS
for Part 3 interviews, labeled as such.

## Pipeline — separate, re-runnable stages under src/
1. **Collect (scrape widely, across categories).**
   - **Play Store** via `google-play-scraper`: find the exact Nykaa Fashion package id
     from its Play Store URL (also the main Nykaa app if Fashion is bundled), country='in'.
   - **App Store** via `app-store-scraper`/`app_store_scraper`: exact iOS app id, country='in'.
   - **Reddit** via public JSON / API: r/IndianFashionAddicts, r/IndianMakeupAddicts,
     r/india, r/IndianBeautyDeals + Nykaa threads (seed_sources.md).
   - **Forums & Q&A** from seed_sources.md: Trustpilot, PissedConsumer, Voxya, Quora.
   - **Web search + fetch**: wishlist behavior, choice overload, decision deferral,
     online-shopping regret, Nykaa reviews.
   - **YouTube** (optional, free API key): comments on Nykaa haul/review videos.
   Skip anti-bot walls (Twitter/X, nykaafashion.com itself). Relevance > raw volume;
   aim ~300-500 relevant items post-filter. Store {source, url, date?, rating?, raw_text}.
2. **Filter.** Apply the relevance-vs-confirmation rule above. Report rejected count.
3. **Classify.** Tag kept items via Anthropic API. JSON per item: {id, source, url, text,
   blocker_codes[], category_signal, segment_signal, model_confidence, supporting_quote}.
   Let the model propose new codes; I review, we lock the schema, then re-tag.
4. **Quantify.** Ranked blocker share (counts + %), reproducible from data.
5. **Segment.** Cross-tab blockers by product category and by buyer-behavior signals.
6. **Synthesize.** Ranked opportunity areas = blocker × segment × evidence weight, with
   real quotes + sampling caveats. Report top findings as the data shows them.
   (The pipeline ends here. Interviews are NOT run in this repo.)

## Candidate blockers to detect (broad; surface emergent ones too)
choice_overload, context_loss, within_category_compare_gap, confidence_validation_gap,
endless_search_deferral, cross_sell_miss, occasion_timing, price_wait, fit_size_doubt,
styling_uncertainty, size_or_stock_gone, quality_doubt, trust_authenticity,
delivery_return_friction, bookmarking_no_intent.

## MVP comes LATER, from the data
Don't design the MVP in this repo. The Part 5 solution follows Stage 6's findings. (The
category-organized wishlist + confidence signal + wishlist-aware cross-sell is a strong
candidate — but it must be justified by the ranked data, not assumed here.)

## Deliverables
- `data/raw/*`, `data/classified.json`
- `outputs/opportunity_ranking.csv`, `outputs/segment_crosstab.csv`
- `FINDINGS.md` (deck discovery slide)
- Public **Next.js website** (deploy: Vercel) — the "testable link": a live Analyzer
  (paste feedback → Anthropic classifies) + a Corpus Explorer over `data/classified.json`.
  (`app.py` Streamlit browser is the earlier local prototype.) Build AFTER analysis is solid.

## Tech conventions
Python. Anthropic API (Haiku for bulk tagging, Sonnet for synthesis). Key from
`ANTHROPIC_API_KEY` env var — never hardcode. Cache raw pulls AND classifications. Log
cost. Each stage a separate script under `src/`. Parse model JSON defensively. Polite
scraper delays.

## Working style
- Read this file AND seed_sources.md before proposing anything.
- Explain each stage's plan before writing much code.
- After Stage 1, show 15-20 raw items for a relevance check.
- **Pause after Stage 3** for my ~20-item tag spot-check (mandatory).
- Flag every sampling bias. Ask before bulk paid-API runs.
