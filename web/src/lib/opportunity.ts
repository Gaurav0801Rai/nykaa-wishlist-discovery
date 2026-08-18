// Opportunity view. Nothing is hidden: every blocker keeps its real numbers and
// stays in the list. We re-order by how much each one sits inside the browsing
// and saving experience (and can move without price levers).
//
// Rationales describe the NATURE of each blocker and where it comes from. They
// deliberately do not prescribe fixes or frame the problem statement.

import type { BlockerAgg } from "./corpus";

export interface Actionability {
  weight: 1 | 2 | 3;
  rationale: string;
}

export const ACTIONABILITY: Record<string, Actionability> = {
  decision_paralysis: {
    weight: 3,
    rationale: "Described while options are still open and nothing has been bought, entirely within browsing and saving.",
  },
  context_loss: {
    weight: 3,
    rationale: "Described while the item is still saved and unbought, entirely inside the browsing experience.",
  },
  choice_overload: {
    weight: 3,
    rationale: "Arises at the moment of choosing between saved options, before any purchase is made.",
  },
  confidence_validation_gap: {
    weight: 3,
    rationale: "Shoppers look for reassurance while still deciding; it is shaped by what the platform shows them.",
  },
  competitor_comparison: {
    weight: 3,
    rationale: "Raised while still choosing where to buy, before committing to Nykaa at all.",
  },
  endless_search_deferral: {
    weight: 3,
    rationale: "Describes browsing and saving that never converts, independent of price.",
  },
  bookmarking_no_intent: {
    weight: 3,
    rationale: "Reveals how people actually use a saved list, which shapes how much of it is convertible.",
  },
  styling_uncertainty: {
    weight: 2,
    rationale: "A pre-purchase hesitation, though raised far less often than the others.",
  },
  cross_sell_miss: {
    weight: 2,
    rationale: "Concerns what shoppers see alongside items they have already shown interest in.",
  },
  occasion_timing: {
    weight: 2,
    rationale: "Tied to an external event, so the window is set by the shopper rather than the platform.",
  },
  size_or_stock_gone: {
    weight: 2,
    rationale: "Occurs after the decision has effectively been made, and depends on inventory.",
  },
  fit_size_doubt: {
    weight: 2,
    rationale: "A genuine pre-purchase doubt, but it applies mainly to clothing and footwear rather than across categories.",
  },
  quality_doubt: {
    weight: 1,
    rationale: "Mostly voiced after an item arrived and disappointed, so it reports an outcome rather than a hesitation.",
  },
  price_wait: {
    weight: 1,
    rationale: "Turns on discounts and sale timing, which sit outside the levers available here.",
  },
  trust_authenticity: {
    weight: 1,
    rationale: "Raised almost entirely in reviews written after an order arrived, and already addressed on-app through verified reviews and real product photos.",
  },
  delivery_return_friction: {
    weight: 1,
    rationale: "Describes what happened after checkout — shipping, pickups and refunds — rather than anything that occurs while an item is still saved.",
  },
};

export interface OpportunityRow extends BlockerAgg {
  weight: number;
  rationale: string;
}

const TIER_LABEL: Record<number, string> = {
  3: "While the item is saved",
  2: "Adjacent",
  1: "After ordering / price-driven",
};

export function tierLabel(weight: number): string {
  return TIER_LABEL[weight] ?? "Other";
}

export function lens2Rank(aggs: BlockerAgg[]): OpportunityRow[] {
  return aggs
    .map((a) => {
      const act = ACTIONABILITY[a.code] ?? { weight: 2, rationale: "" };
      return { ...a, weight: act.weight, rationale: act.rationale };
    })
    .sort((a, b) => b.weight - a.weight || b.count - a.count);
}
