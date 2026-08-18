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
export async function groqChat(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new GroqError("Chatbot is not configured.", 503);
  const model = groqModel();
  const body = JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 900 });

  // Free tiers rate-limit bursts; retry a few times before giving up.
  const backoff = [1200, 3000, 6000];
  let lastStatus = 0;
  for (let attempt = 0; attempt <= backoff.length; attempt++) {
    let res;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body,
      });
    } catch {
      if (attempt === backoff.length) throw new GroqError("Chatbot is temporarily unavailable.", 503);
      await sleep(backoff[attempt]);
      continue;
    }

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const reply = data?.choices?.[0]?.message?.content;
      if (!reply) throw new GroqError("Chatbot returned no answer. Please try again.", 502);
      return reply.trim();
    }

    lastStatus = res.status;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === backoff.length) break;
    await sleep(backoff[attempt]);
  }

  throw new GroqError(
    lastStatus === 429
      ? "The assistant is busy right now. Please try that question again in a moment."
      : "Chatbot is temporarily unavailable.",
    503
  );
}
