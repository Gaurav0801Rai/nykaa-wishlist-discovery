// Lens 2 — "Where the opportunity is".
// Nothing is hidden. Every blocker stays visible; we RE-RANK by actionability
// against the goal (wishlist->purchase in 30 days, NO monetary levers).
// Sort = actionability tier (desc), then raw count (desc). Trust & price keep
// their real numbers and stay in the list with an honest note.

import type { BlockerAgg } from "./corpus";

export interface Actionability {
  weight: 1 | 2 | 3; // 3 = highly solvable via product/discovery, no money
  rationale: string; // why it's actionable (or not) for our goal
  note?: string; // shown when a high-frequency blocker is less actionable
}

export const ACTIONABILITY: Record<string, Actionability> = {
  context_loss: { weight: 3, rationale: "Wishlist visibility: sort, filter & recall saved items — fully in product control." },
  confidence_validation_gap: { weight: 3, rationale: "Surface reviews, real photos & social proof at the decision point." },
  within_category_compare_gap: { weight: 3, rationale: "An in-wishlist compare view for similar saved items." },
  endless_search_deferral: { weight: 3, rationale: "Nudge a decision; convert saving into buying." },
  choice_overload: { weight: 3, rationale: "Organise / curate a large wishlist to ease the decision." },
  cross_sell_miss: { weight: 2, rationale: "'Complete the look' from already-saved items." },
  styling_uncertainty: { weight: 2, rationale: "Styling guidance on saved items." },
  bookmarking_no_intent: { weight: 2, rationale: "Separate genuine intent; re-engage the real ones." },
  occasion_timing: { weight: 2, rationale: "Occasion-aware reminders on saved items." },
  size_or_stock_gone: { weight: 2, rationale: "Back-in-stock / size alerts (non-monetary)." },
  fit_size_doubt: { weight: 1, rationale: "Size guidance helps, but it's clothing-only — not cross-category." },
  quality_doubt: { weight: 1, rationale: "Partly solved by reviews/photos; overlaps trust.", note: "Real frequency, but overlaps the already-addressed trust surface." },
  trust_authenticity: { weight: 1, rationale: "Largely already addressed on-app (verified reviews + real product photos).", note: "The #1 raw blocker — but already addressed on-app, so lower marginal opportunity." },
  price_wait: { weight: 1, rationale: "Would need a monetary lever, which is out of scope for this goal.", note: "Real and frequent, but needs discounts — out of scope (no monetary incentives)." },
  delivery_return_friction: { weight: 1, rationale: "Fulfilment sits outside product/discovery control.", note: "Operational, not a discovery lever." },
};

export interface OpportunityRow extends BlockerAgg {
  weight: number;
  rationale: string;
  note?: string;
}

const TIER_LABEL: Record<number, string> = { 3: "High", 2: "Medium", 1: "Lower" };

export function tierLabel(weight: number): string {
  return TIER_LABEL[weight] ?? "Lower";
}

// Re-rank: actionability weight first, then raw frequency. Nothing dropped.
export function lens2Rank(aggs: BlockerAgg[]): OpportunityRow[] {
  return aggs
    .map((a) => {
      const act = ACTIONABILITY[a.code] ?? { weight: 2, rationale: "" };
      return { ...a, weight: act.weight, rationale: act.rationale, note: act.note };
    })
    .sort((a, b) => b.weight - a.weight || b.count - a.count);
}
