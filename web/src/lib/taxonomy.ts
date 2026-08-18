// Display labels for the taxonomy. Codes are the single source of truth in
// codes.mjs (shared with the server classifier).
import { BLOCKER_CODES, CATEGORY_CODES } from "./codes.mjs";

export { BLOCKER_CODES, CATEGORY_CODES };

export interface BlockerMeta {
  label: string;
  blurb: string;
}

// choice_overload and endless_search_deferral are reported together as
// decision_paralysis: options stay open and no decision is reached. The live
// analyzer still receives the granular codes and folds them with MERGE below.
export const MERGE: Record<string, string> = {
  choice_overload: "decision_paralysis",
  endless_search_deferral: "decision_paralysis",
};

export function canonicalCode(code: string): string {
  return MERGE[code] ?? code;
}

export const BLOCKERS: Record<string, BlockerMeta> = {
  decision_paralysis: { label: "Decision paralysis", blurb: "Keeps weighing and saving options without arriving at a decision." },
  choice_overload: { label: "Choice overload", blurb: "Too many options to decide between." },
  context_loss: { label: "Context loss / wishlist visibility", blurb: "Forgot why an item was saved; can't sort or find it in the wishlist." },
  within_category_compare_gap: { label: "Comparison gap", blurb: "Hard to compare similar saved items side by side." },
  confidence_validation_gap: { label: "Confidence / validation gap", blurb: "Wants reassurance from others before committing." },
  endless_search_deferral: { label: "Endless search / deferral", blurb: "Keeps browsing and saving instead of deciding." },
  cross_sell_miss: { label: "Cross-sell miss", blurb: "Nothing shown alongside items already saved." },
  occasion_timing: { label: "Occasion / timing", blurb: "Save tied to an event; intent fades once it passes." },
  price_wait: { label: "Price wait", blurb: "Waiting for a sale / price drop; feels too expensive." },
  fit_size_doubt: { label: "Fit / size doubt", blurb: "Unsure about size or fit (clothing/footwear)." },
  styling_uncertainty: { label: "Styling uncertainty", blurb: "Unsure how to wear or style the item." },
  size_or_stock_gone: { label: "Size / stock gone", blurb: "Item sold out or size unavailable before deciding." },
  quality_doubt: { label: "Quality doubt", blurb: "Unsure the quality/material is worth it." },
  trust_authenticity: { label: "Trust / authenticity", blurb: "Worried the item is fake or not as described." },
  delivery_return_friction: { label: "Delivery / return friction", blurb: "Problems with shipping, pickups or refunds after ordering." },
  bookmarking_no_intent: { label: "Bookmarking, no intent", blurb: "Saved as a mood board, never meant to buy." },
};

export const CATEGORIES: Record<string, string> = {
  apparel_ethnic: "Apparel & ethnic",
  footwear: "Footwear",
  watches: "Watches",
  sunglasses: "Sunglasses",
  bags: "Bags",
  belts: "Belts",
  jewellery: "Jewellery",
  makeup_beauty: "Makeup & beauty",
  unknown_general: "Unspecified",
};

// Group raw item sources into user-facing filter buckets.
export function sourceGroup(source: string): string {
  if (source === "user_added") return "Your added data";
  switch (source) {
    case "play_store": return "Play Store";
    case "app_store": return "App Store";
    case "reddit": return "Reddit";
    case "community": return "Community & web";
    case "quora": return "Q&A sites";
    case "trustpilot":
    case "pissedconsumer":
    case "voxya": return "Review forums";
    default: return "Other";
  }
}

export const PRIMARY_SOURCE_GROUPS = [
  "Play Store", "App Store", "Reddit", "Review forums", "Q&A sites", "Community & web",
];

export function blockerLabel(code: string): string {
  return BLOCKERS[code]?.label ?? code;
}
export function categoryLabel(code: string): string {
  return CATEGORIES[code] ?? code;
}
