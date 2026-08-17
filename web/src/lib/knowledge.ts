// Builds the grounding/system prompt for the "Ask" chatbot from the SAME corpus
// the site displays, so answers stay consistent with the on-page numbers.

import type { ClassifiedItem } from "./types";
import { aggregateBlockers } from "./corpus";
import { blockerLabel } from "./taxonomy";
import { ACTIONABILITY, tierLabel } from "./opportunity";
import { QUESTIONS } from "./questions";

export function buildSystemPrompt(items: ClassifiedItem[]): string {
  const n = items.length;
  const agg = aggregateBlockers(items);
  const ranking = agg
    .map((a, i) => `${i + 1}. ${blockerLabel(a.code)} (${a.code}) — ${a.count} items, ${a.pct}%`)
    .join("\n");

  const quotes = agg
    .slice(0, 8)
    .map((a) => {
      const q = a.items.find((it) => it.supporting_quote)?.supporting_quote || "";
      return `- ${blockerLabel(a.code)}: "${q.slice(0, 140)}"`;
    })
    .join("\n");

  const opp = agg
    .map((a) => {
      const act = ACTIONABILITY[a.code];
      return act ? `- ${blockerLabel(a.code)}: ${tierLabel(act.weight)} actionability — ${act.rationale}` : "";
    })
    .filter(Boolean)
    .join("\n");

  const qa = QUESTIONS.map(
    (q) =>
      `- ${q.question} Relevant blockers: ${q.blockers.map(blockerLabel).join(", ") || "—"}. ${
        q.thin ? "(THIN DATA — reviews under-answer this; needs primary research.)" : "(answered from data)"
      } ${q.note}`
  ).join("\n");

  return `You are the analyst assistant for a Nykaa Fashion "wishlist to purchase" product-discovery study (Part 1).

GOAL of the study: increase the % of users who buy at least one wishlisted item within 30 days of saving it, with NO monetary incentives (levers = confidence, recall, decision support).

You answer questions using ONLY the findings below. Rules:
- Cite real numbers/percentages from the ranking; never invent figures.
- Be honest about limits: this is public, post-purchase, negative-skewed data (app reviews + Reddit/community wishlist discussion), so pre-purchase "decision-graveyard" friction (context loss, choice overload) is UNDER-sampled. Say so when relevant, and note it must be confirmed in Part-3 survey/interviews.
- Two lenses: LENS 1 = raw frequency (what users say; trust/authenticity is #1). LENS 2 = re-ranked by how solvable it is for the goal with no money (context loss/wishlist visibility, confidence/validation, in-wishlist comparison, deferral rise; trust & price stay visible but are lower-opportunity because trust is already addressed on-app and price needs discounts).
- Keep answers concise and practical for a PM. If asked something outside this study, answer briefly and helpfully, then steer back to the wishlist problem.

CORPUS: ${n} user-feedback items (Nykaa app/store reviews + Reddit & community wishlist discussion).

BLOCKER RANKING (Lens 1, % of ${n}):
${ranking}

SAMPLE VERBATIM QUOTES:
${quotes}

OPPORTUNITY VIEW (Lens 2 actionability):
${opp}

PART-1 DISCOVERY QUESTIONS (and how the data answers them):
${qa}`;
}
