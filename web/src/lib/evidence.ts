// Curated evidence per blocker: a short plain-language summary of what the
// feedback contains, plus the specific verbatims that best demonstrate it.
//
// Quotes are referenced by item id so they always render real collected text,
// and each was checked by hand to make sure it actually shows that blocker
// (auto-picking the longest quote put fulfilment rants under "comparison gap").
// Summaries describe what shoppers said — they do not propose fixes.

export interface Evidence {
  summary: string;
  quoteIds: string[];
  // Pin the exact sentence to show for an item when its auto-picked quote is
  // not the part that demonstrates this blocker. Each value must be verbatim
  // text from that item (checked by scripts/check-evidence.mjs).
  exact?: Record<string, string>;
}

export const EVIDENCE: Record<string, Evidence> = {
  context_loss: {
    summary:
      "Shoppers describe saved lists that grow past the point of being useful. They talk about items piling up over months, lists that cannot be sorted or filtered, and returning to a save without recalling why they made it.",
    quoteIds: [
      "verified_0",
      "reddit_a56794ecff9f",
      "community_e33ea208fb5f",
      "reddit_b8ff1ffe50f3",
    ],
  },
  choice_overload: {
    summary:
      "When several saved options look equally plausible, shoppers stall. They describe holding many near-identical products, asking others to break the tie, and abandoning the session rather than choosing.",
    quoteIds: [
      "reddit_cb56e65643ab",
      "community_ae7373efd632",
      "community_2fafb28cc195",
      "reddit_9d364b508f17",
    ],
  },
  endless_search_deferral: {
    summary:
      "Browsing and saving becomes the activity in itself. Shoppers describe filling a bag or list they never check out, and items sitting saved for months while the search continues.",
    quoteIds: [
      "community_e69b4f702248",
      "reddit_ed4aac2e1447",
      "community_4c4df5cf3287",
      "reddit_7d9cd9bac73d",
    ],
  },
  bookmarking_no_intent: {
    summary:
      "Not every save is a plan to buy. Shoppers use the list to track a price, park an impulse, or remember a product name — so part of any saved list was never headed for checkout.",
    quoteIds: [
      "reddit_aadfbf14a860",
      "reddit_4525f29386ad",
      "community_2583d80567a3",
      "reddit_2ac1dd0ca0eb",
    ],
  },
  within_category_compare_gap: {
    summary:
      "Comparison happens across apps rather than inside one. Shoppers describe checking the same item on other platforms, and finding no way to filter or line up their saved options side by side.",
    quoteIds: [
      "reddit_e84e220c174a",
      "play_store_22e3521a83ce",
      "community_c1e0351bad61",
      "play_store_fe83717d4b5c",
    ],
    exact: {
      reddit_e84e220c174a:
        "i kept comparing prices through nykaa and myntra all the while, and it was so so tiring and time consuming",
      play_store_22e3521a83ce:
        "Compared to Nykaa, Myntra offers much faster delivery, quicker resolution of return issues, and even same-day refunds in many cases.",
    },
  },
  confidence_validation_gap: {
    summary:
      "Before committing, shoppers look for proof from other people. They ask groups what to pick, check ingredients or details themselves, and drop saved items when the answers do not reassure them.",
    quoteIds: [
      "reddit_44cf2f7950fc",
      "reddit_db6b2b928bff",
      "reddit_6c9f49670c09",
      "play_store_e2e6ab918c82",
    ],
  },
  price_wait: {
    summary:
      "Saved items are parked until the price moves. Shoppers describe holding a specific item for a sale, skipping a purchase when the discount does not appear, and waiting long stretches for the right offer.",
    quoteIds: [
      "reddit_22e96e25cfb9",
      "reddit_dfa09773d68b",
      "reddit_357f23986a8b",
      "play_store_35674303cc9d",
    ],
    exact: {
      reddit_dfa09773d68b: "I didnt see any discount on the ones that I wanted.",
      reddit_357f23986a8b:
        "some of these people are people who wait an entire year for good offers to buy stuff unlike me.",
    },
  },
  trust_authenticity: {
    summary:
      "Doubt about whether an item is genuine, raised mostly after an order arrived. Shoppers report receiving copies of branded products, or items that do not match the listing.",
    quoteIds: [
      "quora_d23c1c26a343",
      "play_store_353df902bb7c",
      "play_store_933719489167",
      "play_store_e5a38f9094a0",
    ],
  },
  quality_doubt: {
    summary:
      "Material and finish falling short of what the listing suggested. Most of this is reported after delivery, when the item is compared with what the photos implied.",
    quoteIds: [
      "play_store_f6a26c93f8cb",
      "play_store_ba3044afcdc6",
      "play_store_4b9d9f4f1e5a",
      "play_store_265596a0e195",
    ],
  },
  fit_size_doubt: {
    summary:
      "Uncertainty about how clothing and footwear will fit. Shoppers describe sizing that differs from the chart or from other brands, and exchanges that repeat the same problem.",
    quoteIds: [
      "play_store_45c6430951df",
      "play_store_7dc233468bd2",
      "play_store_ee33349eac34",
      "play_store_621fa0cebd08",
    ],
  },
  occasion_timing: {
    summary:
      "Buying tied to a date. Shoppers describe shopping for a wedding, birthday or function, where the purchase only matters if it lands before the event.",
    quoteIds: [
      "play_store_d986342d5c62",
      "trustpilot_2d65878c3181",
      "reddit_65f290a6cbe8",
      "play_store_772da0b31cc3",
    ],
  },
  size_or_stock_gone: {
    summary:
      "The decision is overtaken by availability. Shoppers describe their size disappearing, or saved items going out of stock while they were still deciding.",
    quoteIds: [
      "play_store_c209b8f4256a",
      "reddit_6be966c4cf98",
      "community_79b798beea89",
      "play_store_c89ff5712c04",
    ],
  },
  delivery_return_friction: {
    summary:
      "What happens after checkout: delayed shipments, pickups that never arrive, and slow refunds. This is the bulk of public review writing, and it sits after the buying decision rather than before it.",
    quoteIds: [
      "play_store_a8b9b4284626",
      "play_store_05306106403f",
      "play_store_385cf1307a83",
      "play_store_e1be7b41c34b",
    ],
  },
};
