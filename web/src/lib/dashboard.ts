// Dashboard content model: blocker type grouping and the observations shown
// alongside the ranking. Observations stay descriptive — they report what the
// feedback contains, without prescribing fixes or stating a problem definition.

export const BLOCKER_TYPE: Record<string, string> = {
  decision_paralysis: "Decision friction",
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
  size_or_stock_gone: "Availability",
  price_wait: "Value & timing",
  occasion_timing: "Value & timing",
  delivery_return_friction: "Post-purchase",
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
      "Most of what shoppers write publicly is about what happened after they ordered — shipping, pickups, refunds and whether the item matched its listing.",
    takeaway: "Public reviews are written by buyers, about orders.",
  },
  {
    finding:
      "A separate group of feedback comes from people talking while items are still saved: lists that grow, options that blur together, and saves they no longer recognise.",
    takeaway: "This voice appears in discussion, not in app reviews.",
  },
  {
    finding:
      "Shoppers describe saving for very different reasons — tracking a price, parking an impulse, or keeping a genuine shortlist — and these behave nothing alike.",
    takeaway: "A saved item is not automatically an intent to buy.",
  },
  {
    finding:
      "Reassurance-seeking runs through the saved-item conversations: shoppers ask each other what to pick, and change their saved list based on the answers.",
    takeaway: "Deciding is social before it is transactional.",
  },
];
