// Discovery Questions — the assignment's questions answered from the data.
// Each maps to relevant blockers; the component fills in %/quotes at runtime.
// `thin: true` marks questions reviews can't really answer -> needs primary research.

export interface DiscoveryQuestion {
  id: string;
  question: string;
  blockers: string[];
  thin: boolean;
  note: string;
}

export const QUESTIONS: DiscoveryQuestion[] = [
  {
    id: "why_save",
    question: "Why do users save items to their wishlist?",
    blockers: ["bookmarking_no_intent", "occasion_timing", "price_wait", "endless_search_deferral"],
    thin: true,
    note: "Reviews rarely state the reason for saving — this needs primary research (surveys/interviews).",
  },
  {
    id: "what_blocks",
    question: "What blocks the purchase of a saved item?",
    blockers: ["trust_authenticity", "quality_doubt", "confidence_validation_gap", "price_wait", "fit_size_doubt"],
    thin: false,
    note: "Well-covered by the data — these are the measured top blockers.",
  },
  {
    id: "uncertainties",
    question: "What uncertainties do shoppers express before buying?",
    blockers: ["confidence_validation_gap", "fit_size_doubt", "quality_doubt", "styling_uncertainty"],
    thin: false,
    note: "Confidence, fit and quality uncertainty appear directly in the feedback.",
  },
  {
    id: "postponement",
    question: "Why do purchases get postponed / deferred?",
    blockers: ["price_wait", "endless_search_deferral", "occasion_timing", "size_or_stock_gone"],
    thin: true,
    note: "Price-waiting is visible; genuine 'saved and forgot' deferral is under-sampled in reviews.",
  },
  {
    id: "comparison",
    question: "How do users compare options?",
    blockers: ["within_category_compare_gap"],
    thin: true,
    note: "Cross-platform comparison (Myntra/AJIO/Amazon) shows up, but in-app comparison behaviour needs primary research.",
  },
  {
    id: "bookmark_vs_intent",
    question: "Bookmarking vs. genuine buying intent?",
    blockers: ["bookmarking_no_intent", "endless_search_deferral"],
    thin: true,
    note: "Reviewers are buyers, not saver-deferrers — this split needs primary research.",
  },
  {
    id: "segments",
    question: "How do blockers differ by segment / category?",
    blockers: [],
    thin: true,
    note: "Most reviews don't name a category (mostly 'Unspecified'), so segment cuts are directional only — use the category filter, and confirm in primary research.",
  },
  {
    id: "unmet_needs",
    question: "What unmet needs / opportunities emerge?",
    blockers: ["context_loss", "cross_sell_miss", "choice_overload", "confidence_validation_gap"],
    thin: true,
    note: "The wishlist-visibility & decision-support needs are under-observed in reviews — exactly why the opportunity lens exists.",
  },
];
