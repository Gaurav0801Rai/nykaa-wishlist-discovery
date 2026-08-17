export interface ClassifiedItem {
  id: string;
  source: string;
  text: string;
  blocker_codes: string[];
  category_signal: string;
  supporting_quote: string;
  rating: string | number | null;
  tagging_method?: string;
}

export interface ExternalItem {
  id: string;
  source: string;
  text: string;
}

export interface Methodology {
  user_feedback: number;
  nykaa_items: number;
  added_items: number;
  sources: Record<string, number>;
  nykaa_collected: number;
  nykaa_rejected: number;
  reject_reasons: Record<string, number>;
  tagging_method?: string;
  gaps: string[];
}

export interface AnalyzeResultItem {
  text: string;
  blocker_codes: string[];
  category_signal: string;
  supporting_quote: string;
}

export interface AnalyzeResponse {
  count: number;
  results: AnalyzeResultItem[];
}
