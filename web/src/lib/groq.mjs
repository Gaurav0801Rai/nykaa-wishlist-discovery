// SERVER-ONLY. Groq chat client for the "Ask" chatbot. Reads GROQ_API_KEY only
// on the server; never exposed to the browser. OpenAI-compatible endpoint.

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export class GroqError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export function groqModel() {
  return process.env.GROQ_MODEL || DEFAULT_MODEL;
}

// messages: [{ role: "system"|"user"|"assistant", content: string }]
export async function groqChat(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new GroqError("Chatbot is not configured.", 503);
  const model = groqModel();

  let res;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 900 }),
    });
  } catch {
    throw new GroqError("Chatbot is temporarily unavailable.", 503);
  }
  if (!res.ok) {
    // Do not leak upstream detail (model names, quota, etc.) to the browser.
    throw new GroqError("Chatbot is temporarily unavailable.", 503);
  }
  const data = await res.json().catch(() => null);
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new GroqError("Chatbot returned no answer. Please try again.", 502);
  return reply.trim();
}
