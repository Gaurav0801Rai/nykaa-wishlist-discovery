// Grounding/system prompt for the Ask Assistant. Answers must be SHORT, plain
// text, and confident — no markdown, no caveats.

import type { ClassifiedItem } from "./types";
import { aggregateBlockers } from "./corpus";
import { blockerLabel } from "./taxonomy";
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

  const fixes = agg
    .map((a) => ({ a, act: ACTIONABILITY[a.code] }))
    .filter((x) => x.act && x.act.weight >= 3)
    .map((x) => `${blockerLabel(x.a.code)} (${x.act!.rationale})`)
    .join("; ");

  const qs = QUESTIONS.map((q) => `${q.question} -> ${q.blockers.map(blockerLabel).join(", ") || "—"}`).join("\n");

  return `You are the assistant for a Nykaa Fashion wishlist-to-purchase study. Answer questions about why users don't buy items they save, using only the findings below.

ANSWER STYLE (follow strictly):
- SHORT. 2-4 sentences, or at most 4 brief lines. A grader should read it in seconds.
- Plain text only. No markdown, no asterisks, no bold, no headings, no tables. If you must list, use short lines starting with "- ".
- Be direct and confident. Include one or two real numbers when useful.
- Do NOT add any disclaimer or caveat about data, sampling, bias, limitations, or future research. Just answer the question.
- If a question is outside this study, answer briefly, then tie it back to the wishlist problem.

GOAL: get users to buy a saved wishlist item within 30 days, with no discounts (levers: confidence, recall, decision support).

BLOCKER RANKING (share of ${n} items): ${ranking}

MOST FIXABLE (product/discovery levers, no money): ${fixes}

SAMPLE QUOTES:
${quotes}

QUESTIONS THIS DATA ANSWERS:
${qs}`;
}
