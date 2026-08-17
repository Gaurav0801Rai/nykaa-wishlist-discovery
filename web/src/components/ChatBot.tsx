"use client";

import { useRef, useState } from "react";
import { QUESTIONS } from "@/lib/questions";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatBot() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setError(null);
    const next = [...messages, { role: "user", content: q } as Msg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed.");
      setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setTimeout(() => scroller.current?.scrollTo({ top: 1e9, behavior: "smooth" }), 50);
    }
  }

  return (
    <div>
      <p className="lead" style={{ marginBottom: 16 }}>
        Ask about the findings — the Part-1 discovery questions, or anything else. Answers are
        grounded in this study&apos;s data and honest about what needs primary research.
      </p>

      <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.length === 0 && (
          <div>
            <p className="small" style={{ fontWeight: 700, margin: "0 0 8px" }}>Try a discovery question:</p>
            <div className="filters">
              {QUESTIONS.map((q) => (
                <button key={q.id} className="toggle" onClick={() => send(q.question)} disabled={loading}>
                  {q.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div ref={scroller} style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "chat-user" : "chat-bot"}>
                {m.content}
              </div>
            ))}
            {loading && <div className="chat-bot"><span className="spinner" style={{ borderTopColor: "var(--brand)" }} /> thinking…</div>}
          </div>
        )}

        {error && (
          <div className="err">
            {error}
            {/not configured|unavailable/i.test(error) && (
              <div className="small" style={{ marginTop: 6 }}>
                The chatbot needs a server key (<code>GROQ_API_KEY</code>) set in the environment.
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          style={{ display: "flex", gap: 10 }}
        >
          <input
            className="chat-input"
            placeholder="Ask about wishlist blockers, segments, opportunities…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
      <p className="muted small" style={{ marginTop: 10 }}>
        The assistant answers from this study&apos;s corpus; it flags thin-data questions that need Part-3 research.
      </p>
    </div>
  );
}
