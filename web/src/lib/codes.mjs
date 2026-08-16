// Canonical taxonomy codes (from CLAUDE.md). Pure data — safe to import from
// BOTH client (taxonomy.ts) and server (gemini.mjs). No side effects.

export const BLOCKER_CODES = [
  "choice_overload",
  "context_loss",
  "within_category_compare_gap",
  "confidence_validation_gap",
  "endless_search_deferral",
  "cross_sell_miss",
  "occasion_timing",
  "price_wait",
  "fit_size_doubt",
  "styling_uncertainty",
  "size_or_stock_gone",
  "quality_doubt",
  "trust_authenticity",
  "delivery_return_friction",
  "bookmarking_no_intent",
];

export const CATEGORY_CODES = [
  "apparel_ethnic",
  "footwear",
  "watches",
  "sunglasses",
  "bags",
  "belts",
  "jewellery",
  "makeup_beauty",
  "unknown_general",
];
