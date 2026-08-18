// SERVER-ONLY. Groq chat client for the "Ask" chatbot. Reads GROQ_API_KEY only
// on the server; never exposed to the browser. OpenAI-compatible endpoint.

// Groq's older Llama chat models were deprecated; current production
// general-purpose models are openai/gpt-oss-20b (fast) and openai/gpt-oss-120b
// (higher quality). Override with GROQ_MODEL.
const DEFAULT_MODEL = "openai/gpt-oss-20b";

export class GroqError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export function groqModel() {
  return process.env.GROQ_MODEL || DEFAULT_MODEL;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// messages: [{ role: "system"|"user"|"assistant", content: string }]
// All configured keys, in order. Supports GROQ_API_KEY, GROQ_API_KEY_2/3/4 and a
// comma-separated GROQ_API_KEYS. When one key is rate-limited we move to the next.
function groqKeys() {
  const raw = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    ...(process.env.GROQ_API_KEYS || "").split(","),
  ];
  return [...new Set(raw.map((k) => (k || "").trim()).filter(Boolean))];
}

export async function groqChat(messages) {
  const keys = groqKeys();
  if (keys.length === 0) throw new GroqError("Chatbot is not configured.", 503);
  const model = groqModel();
  const body = JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 900 });

  // Try every key first (rate limits are per key), then back off and retry.
  const backoff = [0, 1200, 3000, 6000];
  let lastStatus = 0;
  for (let round = 0; round < backoff.length; round++) {
    if (backoff[round]) await sleep(backoff[round]);
    for (let k = 0; k < keys.length; k++) {
      let res;
      try {
        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${keys[k]}` },
          body,
        });
      } catch {
        lastStatus = 0;
        continue;
      }

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const reply = data?.choices?.[0]?.message?.content;
        if (!reply) throw new GroqError("Chatbot returned no answer. Please try again.", 502);
        return reply.trim();
      }

      lastStatus = res.status;
      // 429/5xx: try the next key straight away; anything else is not retryable.
      if (!(res.status === 429 || res.status >= 500)) {
        throw new GroqError("Chatbot is temporarily unavailable.", 503);
      }
    }
  }

  throw new GroqError(
    lastStatus === 429
      ? "The assistant is busy right now. Please try that question again in a moment."
      : "Chatbot is temporarily unavailable.",
    503
  );
}
