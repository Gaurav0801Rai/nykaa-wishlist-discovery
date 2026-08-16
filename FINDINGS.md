# FINDINGS — Nykaa Fashion Wishlist→Purchase Discovery (Part 1)

> **Goal:** raise the % of users who buy ≥1 wishlisted item within 30 days of saving it. **Constraint:** no monetary incentives — levers are confidence, recall, decision support.

### ⚠️ Read this first (status & honesty)
- Tagging is **heuristic_v0** (deterministic keyword rules, no LLM yet). Numbers are **provisional** pending the mandatory ~20-item spot-check (`outputs/tag_spotcheck.md`) and an optional Anthropic re-tag.
- Every % below is over **179 primary Nykaa items** and is reproducible from `data/classified.json`. **External** evidence (26 items) is labelled and **never** counted in a Nykaa %.
- Public data is **post-purchase and negative-skewed** (app reviews, Quora complaints). It over-represents trust/quality/fulfilment and **under-observes pre-purchase decision friction** — the people who defer a saved item rarely leave reviews. Treat low counts for choice/context blockers as *under-sampling, not absence.*

## What we did
Collected **481** items across categories (Play Store 413; real scraped Trustpilot/PissedConsumer/Quora 25; open-web external 26; iOS RSS returned 0; Reddit/most forums IP-blocked). Stage-2 relevance filter → **205 kept** (**179 primary Nykaa** + 26 external), **276 rejected** (top reasons: pure-delivery 103, too-short 72, customer-care-ops 35, refund-dispute 22). Stage-3 multi-label blocker tagging → `data/classified.json`.

## Ranked blockers — Nykaa-measured (leads the finding)
| # | Blocker | Nykaa # | Nykaa % of 179 | External # | X-cat reach | Evidence |
|---|---------|--------:|-----:|-----:|-----:|---|
| 1 | `trust_authenticity` | 65 | 36.3% | 1 | 5 | nykaa_strong+external |
| 2 | `quality_doubt` | 45 | 25.1% | 0 | 4 | nykaa_strong |
| 3 | `price_wait` | 38 | 21.2% | 1 | 3 | nykaa_strong+external |
| 4 | `confidence_validation_gap` | 29 | 16.2% | 0 | 3 | nykaa_strong |
| 5 | `fit_size_doubt` | 23 | 12.8% | 4 | 3 | nykaa_strong+external |
| 6 | `within_category_compare_gap` | 18 | 10.1% | 1 | 3 | nykaa_strong+external |
| 7 | `occasion_timing` | 13 | 7.3% | 0 | 5 | nykaa_moderate |
| 8 | `delivery_return_friction` | 12 | 6.7% | 0 | 2 | nykaa_moderate |
| 9 | `endless_search_deferral` | 7 | 3.9% | 5 | 2 | nykaa_moderate+external |
| 10 | `size_or_stock_gone` | 4 | 2.2% | 1 | 2 | nykaa_thin+external |
| 11 | `context_loss` | 3 | 1.7% | 5 | 0 | nykaa_thin+external |
| 12 | `choice_overload` | 0 | 0.0% | 13 | 0 | external_only+external |
| 13 | `cross_sell_miss` | 0 | 0.0% | 1 | 0 | external_only+external |

## The central finding (the tension we must carry into Part 3)
Two things are true at once, and the contrast is the argument:

1. **What Nykaa's own data shows — a CONFIDENCE problem.** The measurable top blockers are a cluster of *confidence/value* doubts: `trust_authenticity` (65, 36.3%), `quality_doubt` (45), `price_wait` (38), `confidence_validation_gap` (29), `fit_size_doubt` (23). Users hesitate because they're not sure the item is genuine / good quality / worth it / right size.

2. **What the strategic lens predicts — a DECISION GRAVEYARD.** `choice_overload` is **0 in Nykaa data but 13 in external evidence**; `context_loss` 3/5. This cross-category blocker (a 40-item wishlist you can't sort, act on, or remember why you saved) is **structurally invisible in post-purchase reviews** — so it is a leading **hypothesis for Part 3**, not a disproven one.

**So:** confidence blockers are *validated* by Nykaa data; the decision-graveyard blockers are *externally supported but Nykaa-unmeasured*. Part 3 interviews exist to resolve exactly this gap. We do **not** crown choice_overload on external evidence, nor bury it on a biased sample.

## Evidence — real quotes
### `trust_authenticity` — 65 Nykaa / 1 external
> “I was cheated out of my money as they failed to include 5 of the items, which happened to be the MOST EXPENSIVE ONES.”  — *quora*
> “About 30% of Nykaa's products are either fake or not how they are described on the website.”  — *quora*

### `quality_doubt` — 45 Nykaa / 0 external
> “Nykaa Fashion has attractive and trendy designs, but I feel the products are overpriced for the quality offered.”  — *play_store*
> “I have wasted my money trusting Nykaa will never purchase again from Nyka even if it is on sale or any other offer you are giving will delete my account from this nykaa”  — *play_store*

### `price_wait` — 38 Nykaa / 1 external
> “bought damn expensive products worth 26k.”  — *quora*
> “The products are quite expensive, and the return process is very slow.”  — *play_store*

### `confidence_validation_gap` — 29 Nykaa / 0 external
> “After attempting to dispute the issue via their 'replacement' procedures, TWICE (sending in photos as proof which is already a flawed system in itself), they rejected it both times.”  — *quora*
> “They didnt care.I am attaching reference photographs which I had to mail them.”  — *quora*

### `fit_size_doubt` — 23 Nykaa / 4 external
> “I also noticed that the sizing runs slightly tight compared to standard sizing.”  — *play_store*
> “On another order, I received a different size from the one I had ordered.”  — *play_store*

### `within_category_compare_gap` — 18 Nykaa / 1 external
> “Can't compare with flipkart, Myntra amazon etc.”  — *play_store*
> “Compared to Nykaa, Myntra offers much faster delivery, quicker resolution of return issues, and even same-day refunds in many cases.”  — *play_store*

## External support for the decision-graveyard hypothesis (labelled external)
**`choice_overload`**
> “The wishlist that was supposed to be your shortlist now feels cluttered and overwhelming.”  — *web_medium_sneha*
> “Cognitive load increases, and worst of all, intent to purchase often vanishes.”  — *web_medium_sneha*

**`context_loss`**
> “You're scrolling endlessly through a mix of items - some out of stock, some not in your size.”  — *web_medium_sneha*
> “There is no way to filter by size, price range, brand, availability.”  — *web_medium_sneha*

**`endless_search_deferral`**
> “Roughly 50% to 60% of cart additions represent shoppers in browsing mode rather than genuine purchase intent.”  — *web_kissmetrics*
> “It's an endless rabbit hole that can never be exhausted, and I think that's part of the comfort I get from it”  — *web_vice*

## Category & segment (directional only)
Most reviews don't name a product category (`unknown_general` dominates), so category cross-tabs are **directional, not representative** — see `outputs/segment_crosstab.csv`. Where category is known, `trust_authenticity` leads apparel & footwear; `occasion_timing` and `trust_authenticity` show the widest cross-category reach.

## Opportunity lens (prioritisation, not the finding)
`opportunity_score = nykaa_count + 0.5×external + 3×cross_category_reach` rewards platform-wide reach (the strategic ask). Use it to *prioritise*, but the raw Nykaa ranking above is what the data actually says. Full scores in `outputs/opportunity_ranking.csv`.

## Caveats
- Heuristic_v0 tags, not model-reviewed yet (spot-check pending).
- Non-random, negative-skewed, post-purchase sample; English-heavy.
- iOS reviews and Reddit/most forums were unreachable — the decision-friction sources are the ones most under-collected.
- External benchmarks (Iyengar, Baymard, Boldmetrics) are supporting context, some synthesised/unverified — never Nykaa measurements.

_Provisional discovery output. Numbers finalise after the tag spot-check (`outputs/tag_spotcheck.md`) and optional Anthropic re-tag._