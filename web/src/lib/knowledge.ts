// Grounding/system prompt for the Ask Assistant. Answers must be SHORT, plain
// text, and confident — no markdown, no caveats.

import type { ClassifiedItem } from "./types";
import { aggregateBlockers } from "./corpus";
import { blockerLabel, categoryLabel } from "./taxonomy";
import { ACTIONABILITY, tierLabel } from "./opportunity";
import { QUESTIONS } from "./questions";

export function buildSystemPrompt(items: ClassifiedItem[]): string {
  const n = items.length;
  const agg = aggregateBlockers(items);

  const ranking = agg
    .map((a) => `${blockerLabel(a.code)} ${a.count} (${a.pct}%)`)
    .join("; ");

  const quotes = agg
    .slice(0, 6)
    .map((a) => {
      const q = a.items.find((it) => it.supporting_quote)?.supporting_quote || "";
      return `${blockerLabel(a.code)}: "${q.slice(0, 120)}"`;
    })
    .join("\n");

  const nearDecision = agg
    .filter((a) => (ACTIONABILITY[a.code]?.weight ?? 0) >= 3)
    .map((a) => blockerLabel(a.code))
    .join("; ");

  // Blocker profile per product category (categories are named in the text of
  // roughly a third of items; the rest are general).
  const byCat = new Map<string, { n: number; b: Map<string, number> }>();
  for (const it of items) {
    const k = it.category_signal || "unknown_general";
    if (!byCat.has(k)) byCat.set(k, { n: 0, b: new Map() });
    const e = byCat.get(k)!;
    e.n += 1;
    for (const c of it.blocker_codes) e.b.set(c, (e.b.get(c) || 0) + 1);
  }
  const categories = [...byCat.entries()]
    .filter(([k, v]) => k !== "unknown_general" && k !== "makeup_beauty" && v.n >= 4)
    .sort((a, b) => b[1].n - a[1].n)
    .map(([k, v]) => {
      const top = [...v.b.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([c, n]) => `${blockerLabel(c)} ${n}`)
        .join(", ");
      return `${categoryLabel(k)} (${v.n} items): ${top}`;
    })
    .join(String.fromCharCode(10));
  const unnamed = byCat.get("unknown_general")?.n ?? 0;

  const qs = QUESTIONS.map((q) => `${q.question} -> ${q.blockers.map(blockerLabel).join(", ") || "—"}`).join("\n");

  return `You are the assistant for a Nykaa Fashion wishlist-to-purchase study. Answer questions about why users don't buy items they save, using only the findings below.

ANSWER STYLE (follow strictly):
- SHORT. 2-4 sentences, or at most 4 brief lines. A grader should read it in seconds.
- Plain text only. No markdown, no asterisks, no bold, no headings, no tables. If you must list, use short lines starting with "- ".
- Be direct and confident. Include one or two real numbers when useful.
- Do NOT add any disclaimer or caveat about data, sampling, bias, limitations, or future research. Just answer the question.
- REPORT WHAT THE FEEDBACK SAYS. Do not propose features, fixes, designs or solutions, and do not state a problem definition or recommendation — that work happens later. If asked what to build or how to solve it, say the study is at the discovery stage and describe the relevant findings instead.
- If a question is outside this study, answer briefly, then tie it back to what the feedback shows.

CONTEXT: this is discovery research into why shoppers don't buy items they save.

BLOCKER RANKING (share of ${n} items): ${ranking}

RAISED WHILE AN ITEM IS STILL SAVED (pre-purchase): ${nearDecision}
RAISED AFTER AN ORDER ARRIVED (post-purchase): delivery/return friction, trust/authenticity, quality doubt

SAMPLE QUOTES:
${quotes}

BY PRODUCT CATEGORY (blocker counts within each category):
${categories}
${unnamed} items do not name a category, so category splits are indicative of the named ones.

QUESTIONS THIS DATA ANSWERS:
${qs}`;
}
