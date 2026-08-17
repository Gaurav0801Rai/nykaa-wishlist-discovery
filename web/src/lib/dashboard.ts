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
      "The most-cited blockers are confidence doubts — trust, quality, fit, and validation lead the ranking.",
    takeaway: "Shoppers hold saved items until they feel sure enough to commit.",
  },
  {
    finding:
      "A distinct cluster is wishlist decision-friction: too many saved items, and no easy way to recall or compare them.",
    takeaway: "Users lose track of what they saved and why.",
  },
  {
    finding:
      "With no discounts to offer and trust already handled on-app, the biggest movable lever is decision support at the moment of choice.",
    takeaway: "Fix the decision, not the price.",
  },
  {
    finding:
      "Helping users recall, compare, and validate the items already in their wishlist is what turns saving into buying.",
    takeaway: "Growth comes from acting on what's already saved.",
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
