// Dashboard content model: group blockers into types (like Blinkit's cluster
// types), plus the honest key-insights and user-needs shown on the dashboard.

export const BLOCKER_TYPE: Record<string, string> = {
  choice_overload: "Decision friction",
  context_loss: "Decision friction",
  within_category_compare_gap: "Decision friction",
  endless_search_deferral: "Decision friction",
  bookmarking_no_intent: "Decision friction",
  cross_sell_miss: "Decision friction",
  styling_uncertainty: "Decision friction",
  confidence_validation_gap: "Confidence gap",
  trust_authenticity: "Confidence gap",
  quality_doubt: "Confidence gap",
  fit_size_doubt: "Confidence gap",
  size_or_stock_gone: "Confidence gap",
  price_wait: "Value & timing",
  occasion_timing: "Value & timing",
  delivery_return_friction: "Operational",
};

export function blockerType(code: string): string {
  return BLOCKER_TYPE[code] ?? "Other";
}

export interface Insight {
  finding: string;
  takeaway: string;
}

export const INSIGHTS: Insight[] = [
  {
    finding:
      "The top blockers are all confidence doubts — trust, quality, fit, validation — because reviews are written by people who already bought and were let down.",
    takeaway: "Reviews capture buyers' regret, not savers' hesitation.",
  },
  {
    finding:
      "The wishlist “decision graveyard” — too many saved items, no easy way to recall or compare them — shows up in community discussion but stays thin in app reviews.",
    takeaway: "People who quietly abandon a saved item don't leave a review, so the gap is under-counted, not absent.",
  },
  {
    finding:
      "With no discounts allowed and trust largely handled on-app already, the movable lever is decision support at the moment of choice.",
    takeaway: "Fix the decision, not the price.",
  },
  {
    finding:
      "The same habit that makes a saved item easy to forget is exactly what a nudge, a comparison, or a recall prompt can break.",
    takeaway: "Growth comes from helping users act on what they already saved.",
  },
];

export interface NeedGroup {
  title: string;
  items: string[];
}

export const NEEDS: NeedGroup[] = [
  {
    title: "Decision support (highest opportunity)",
    items: [
      "In-wishlist comparison for similar saved items.",
      "Verified reviews and real buyer photos surfaced at the wishlist decision point.",
      "Wishlist recall — sort, filter, and a reminder of why each item was saved.",
      "“Complete the look” suggestions built from already-saved items.",
    ],
  },
  {
    title: "Confidence & clarity",
    items: [
      "Prominent authenticity and quality signals on the product page and in the wishlist.",
      "Clear size / fit guidance for apparel and footwear saves.",
    ],
  },
];
