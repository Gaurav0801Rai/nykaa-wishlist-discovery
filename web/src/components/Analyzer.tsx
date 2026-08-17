"use client";

import { useMemo, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { blockerLabel, categoryLabel } from "@/lib/taxonomy";

const EXAMPLE = `I keep adding kurtas to my wishlist but there are so many I can never decide which to buy.
Ordered a watch that looked totally different from the photos — not sure I trust the listing now.
These heels are gorgeous but I'm waiting for the sale before I commit.
Saved this bag weeks ago and honestly forgot why — my wishlist is a mess of 40 random things.
Not sure about the size, the chart is confusing so I left it in my wishlist.`;

const MAX = 20;

export default function Analyzer() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, MAX);

  const ranked = useMemo(() => {
    if (!data) return [];
    const m = new Map<string, number>();
    for (const r of data.results) for (const c of r.blocker_codes) m.set(c, (m.get(c) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [data]);
  const max = Math.max(...ranked.map((r) => r[1]), 1);

  async function analyze() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed.");
      setData(json as AnalyzeResponse);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="h2">Live analyzer</h2>
      <p className="lead" style={{ marginBottom: 14 }}>
        Paste real reviews or posts — one per line — and the engine classifies each against the
        blocker taxonomy in real time.
      </p>

      <div className="banner" style={{ marginBottom: 18 }}>
        <strong>Temporary session.</strong> What you paste is analysed live and shown here only —
        <strong> nothing is saved, nothing is shared,</strong> and the base corpus and Dashboard are
        never changed. Refresh the page and it&apos;s gone, so visitors can&apos;t alter the real data.
      </div>

      <div className="card pad">
        <textarea
          className="feedback"
          placeholder="Paste feedback here — one review or post per line…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 14 }}>
          <button className="btn btn-primary" onClick={analyze} disabled={loading || lines.length === 0}>
            {loading ? <><span className="spinner" /> Analyzing {lines.length}…</> : `Analyze ${lines.length || ""}`}
          </button>
          <button className="btn btn-ghost" onClick={() => setText(EXAMPLE)} disabled={loading}>Load example</button>
          <button className="btn btn-ghost" onClick={() => { setText(""); setData(null); setError(null); }} disabled={loading}>Clear</button>
          <span className="muted small" style={{ marginLeft: "auto" }}>{lines.length}/{MAX} lines</span>
        </div>

        {error && (
          <div className="err" style={{ marginTop: 16 }}>
            {error}
            {/not configured|unavailable/i.test(error) && (
              <div className="small" style={{ marginTop: 6 }}>
                The live analyzer needs a server key (<code>GEMINI_API_KEY</code>). The Dashboard and
                chatbot are unaffected.
              </div>
            )}
          </div>
        )}

        {data && (
          <div style={{ marginTop: 20 }}>
            <div className="notice" style={{ marginBottom: 14 }}>
              Analyzed <strong>{data.count}</strong> item{data.count === 1 ? "" : "s"} (this session only).
            </div>
            {ranked.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div className="small" style={{ fontWeight: 700, marginBottom: 8 }}>Blockers in your pasted items</div>
                <div className="bars">
                  {ranked.map(([code, n]) => (
                    <div className="bar-row" key={code}>
                      <div className="bar-label">{blockerLabel(code)}</div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(100 * n) / max}%` }} /></div>
                      <div className="bar-num">{n}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid">
              {data.results.map((r, i) => (
                <div className="card pad" key={i} style={{ boxShadow: "none" }}>
                  <p style={{ margin: "0 0 10px" }}>{r.text}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {r.blocker_codes.length ? (
                      r.blocker_codes.map((c) => <span className="chip" key={c}>{blockerLabel(c)}</span>)
                    ) : (
                      <span className="chip" style={{ opacity: 0.6 }}>no blocker detected</span>
                    )}
                    <span className="chip cat">{categoryLabel(r.category_signal)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
