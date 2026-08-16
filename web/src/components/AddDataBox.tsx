"use client";

import { useState } from "react";
import type { AnalyzeResponse, ClassifiedItem } from "@/lib/types";
import { blockerLabel, categoryLabel } from "@/lib/taxonomy";

const EXAMPLE = `I keep adding kurtas to my wishlist but there are so many I can never decide which to buy.
Ordered a watch that looked totally different from the photos — not sure I trust the listing now.
These heels are gorgeous but I'm waiting for the sale before I commit.
Saved this bag weeks ago and honestly forgot why — my wishlist is a mess of 40 random things.
Not sure about the size, the chart is confusing so I left it in my wishlist.`;

const MAX = 20;

export default function AddDataBox({ onAdd }: { onAdd: (items: ClassifiedItem[]) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<ClassifiedItem[] | null>(null);

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, MAX);

  async function analyze() {
    setLoading(true);
    setError(null);
    setJustAdded(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed.");
      const data = json as AnalyzeResponse;
      const stamp = Date.now();
      const added: ClassifiedItem[] = data.results.map((r, i) => ({
        id: `user_added_${stamp}_${i}`,
        source: "user_added",
        text: r.text,
        blocker_codes: r.blocker_codes,
        category_signal: r.category_signal,
        supporting_quote: r.supporting_quote,
        rating: null,
        tagging_method: "gemini (live)",
      }));
      onAdd(added);
      setJustAdded(added);
      setText("");
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card pad">
      <h3 style={{ marginTop: 0, fontSize: 18 }}>Add your own feedback</h3>
      <p className="muted small" style={{ marginTop: 0 }}>
        Paste real reviews or posts — one per line (max {MAX}). Each line is classified live by the
        engine and added <strong>for this session only</strong>; both lenses recompute. Nothing is
        saved — your additions live only in this browser tab and disappear on reload, so the base
        analysis can never be altered by visitors.
      </p>
      <textarea
        className="feedback"
        placeholder="Paste feedback, one item per line…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 14 }}>
        <button className="btn btn-primary" onClick={analyze} disabled={loading || lines.length === 0}>
          {loading ? <><span className="spinner" /> Classifying {lines.length}…</> : `Analyze & add ${lines.length || ""}`}
        </button>
        <button className="btn btn-ghost" onClick={() => setText(EXAMPLE)} disabled={loading}>Load example</button>
        <button className="btn btn-ghost" onClick={() => { setText(""); setError(null); setJustAdded(null); }} disabled={loading}>Clear</button>
        <span className="muted small" style={{ marginLeft: "auto" }}>{lines.length}/{MAX} lines</span>
      </div>

      {error && (
        <div className="err" style={{ marginTop: 16 }}>
          {error}
          {/not configured|unavailable/i.test(error) && (
            <div className="small" style={{ marginTop: 6 }}>
              The live analyzer needs a server key. The lenses below still work on the base corpus.
            </div>
          )}
        </div>
      )}

      {justAdded && (
        <div style={{ marginTop: 18 }}>
          <div className="notice" style={{ marginBottom: 12 }}>
            Added <strong>{justAdded.length}</strong> item{justAdded.length === 1 ? "" : "s"} to the
            corpus. Switch to a lens to see the ranking update (Base + added is now on).
          </div>
          <div className="grid">
            {justAdded.map((r) => (
              <div className="card pad" key={r.id} style={{ boxShadow: "none" }}>
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
  );
}
