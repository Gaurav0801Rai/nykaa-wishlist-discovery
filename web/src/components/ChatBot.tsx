"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS } from "@/lib/questions";

type Msg = { role: "user" | "assistant"; content: string };

// Strip any markdown the model still emits so answers read as clean plain text.
function clean(s: string): string {
  return s
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^\s*[-*\u2022]\s+/gm, "\u2022 ")
    .replace(/\|/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Questions the user has not asked yet, so the list stays available.
  const asked = useMemo(
    () => new Set(messages.filter((m) => m.role === "user").map((m) => m.content)),
    [messages]
  );
  const remaining = QUESTIONS.filter((q) => !asked.has(q.question));

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
      setMessages((m) => [...m, { role: "assistant", content: clean(json.reply) }]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    setInput("");
  }

  return (
    <div>
      <p className="lead" style={{ marginBottom: 14 }}>
        Ask anything about the findings, or pick a question to get started.
      </p>

      <div className="chat-card">
        {messages.length > 0 && (
          <div className="chat-head">
            <span className="muted small">
              {asked.size} question{asked.size === 1 ? "" : "s"} asked
            </span>
            <button className="toggle" onClick={clearChat} disabled={loading}>
              Clear chat
            </button>
          </div>
        )}

        <div className="chat-scroll" ref={scroller}>
          {messages.length === 0 ? (
            <div>
              <p className="small" style={{ fontWeight: 700, margin: "0 0 10px" }}>Try a question:</p>
              <div className="filters">
                {QUESTIONS.map((q) => (
                  <button key={q.id} className="toggle" onClick={() => send(q.question)} disabled={loading}>
                    {q.question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "chat-user" : "chat-bot"}>{m.content}</div>
              ))}
              {loading && (
                <div className="chat-bot">
                  <span className="spinner" style={{ borderTopColor: "var(--brand)" }} /> thinking…
                </div>
              )}
            </div>
          )}
        </div>

        {messages.length > 0 && remaining.length > 0 && (
          <div className="chat-suggest">
            <span className="muted small" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>More questions:</span>
            <div className="chat-suggest-row">
              {remaining.map((q) => (
                <button key={q.id} className="toggle" onClick={() => send(q.question)} disabled={loading}>
                  {q.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="err" style={{ margin: "10px 14px 0" }}>
            {error}
            {/not configured|unavailable/i.test(error) && (
              <div className="small" style={{ marginTop: 6 }}>
                The assistant needs a server key (<code>GROQ_API_KEY</code>).
              </div>
            )}
          </div>
        )}

        <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input
            className="chat-input"
            placeholder="Ask about wishlist blockers, opportunities, segments…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>Send</button>
        </form>
      </div>
    </div>
  );
}
