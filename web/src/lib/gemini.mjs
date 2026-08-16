// SERVER-ONLY. The single Gemini classifier used by BOTH /api/analyze (live)
// and scripts/retag-corpus.mjs (base corpus). Imported only server-side, so the
// key and endpoint never reach the browser. Plain fetch, defensive JSON parse.

import { BLOCKER_CODES, CATEGORY_CODES } from "./codes.mjs";

const DEFAULT_MODEL = "gemini-3.5-flash";

export class GeminiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function buildSystem() {
  return [
    "You classify e-commerce user feedback for a Nykaa Fashion wishlist->purchase study.",
    "For EACH input item decide which blocker(s) explain why a shopper would hesitate to",
    "buy a saved/wishlisted item. Use ONLY these blocker codes:",
    BLOCKER_CODES.join(", ") + ".",
    "Give category_signal from ONLY: " + CATEGORY_CODES.join(", ") + ".",
    "Give supporting_quote: a short VERBATIM substring of the item justifying the tags.",
    "Tag ALL blockers that genuinely apply (including fit_size_doubt and price_wait).",
    "Never invent codes. Return STRICT JSON only, shape:",
    '{"results":[{"index":<0-based int>,"blocker_codes":[...],',
    '"category_signal":"...","supporting_quote":"..."}]}',
  ].join("\n");
}

function buildUser(items) {
  return (
    "Classify these items:\n" +
    items
      .map((t, i) => `[${i}] ${String(t).replace(/\s+/g, " ").slice(0, 1500)}`)
      .join("\n")
  );
}

function extractJson(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function sanitize(items, parsed) {
  const blockerSet = new Set(BLOCKER_CODES);
  const catSet = new Set(CATEGORY_CODES);
  const arr = Array.isArray(parsed?.results)
    ? parsed.results
    : Array.isArray(parsed)
    ? parsed
    : [];
  const byIndex = new Map();
  arr.forEach((r, i) => byIndex.set(Number.isInteger(r?.index) ? r.index : i, r));

  return items.map((text, i) => {
    const r = byIndex.get(i) ?? {};
    const codes = Array.isArray(r.blocker_codes)
      ? r.blocker_codes.filter((c) => typeof c === "string" && blockerSet.has(c))
      : [];
    const cat =
      typeof r.category_signal === "string" && catSet.has(r.category_signal)
        ? r.category_signal
        : "unknown_general";
    const quote =
      typeof r.supporting_quote === "string" && r.supporting_quote.trim()
        ? r.supporting_quote.trim().slice(0, 240)
        : String(text).slice(0, 160);
    return { text, blocker_codes: codes, category_signal: cat, supporting_quote: quote };
  });
}

export function geminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

// Returns [{ text, blocker_codes, category_signal, supporting_quote }]
export async function classifyItems(items) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("Analyzer is not configured.", 503);
  const model = geminiModel();

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: buildSystem() }] },
          contents: [{ role: "user", parts: [{ text: buildUser(items) }] }],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
          // We are CLASSIFYING complaint text (which can contain profanity), not
          // generating harmful content — don't let safety filters blank the response.
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ],
        }),
      }
    );
  } catch {
    throw new GeminiError("Analyzer is temporarily unavailable.", 503);
  }

  if (!res.ok) {
    // Do not surface upstream body/status detail to callers.
    throw new GeminiError("Analyzer is temporarily unavailable.", 503);
  }

  const data = await res.json().catch(() => null);
  // Thinking models can split output across multiple parts — concatenate all text.
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p?.text || "").join("");
  const parsed = extractJson(text);
  if (!parsed) throw new GeminiError("Could not read the analysis. Please try again.", 502);
  return sanitize(items, parsed);
}
