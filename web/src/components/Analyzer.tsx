"use client";

import { useMemo, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { blockerLabel, categoryLabel } from "@/lib/taxonomy";

// A varied pool of realistic shopper feedback. Each "Load example" run samples a
// different mix — delivery, quality, fit, price, comparison, browsing — so the
// demo reads like genuine mixed feedback rather than a fixed script.
const EXAMPLE_POOL: string[] = [
  "Ordered a kurta for my cousin's wedding and it arrived three days after the function was over.",
  "The fabric feels much cheaper than it looked in the pictures, honestly not worth what I paid.",
  "Received a completely different shade from what I ordered and support keeps closing my ticket.",
  "Return pickup has been rescheduled four times now, nobody calls before cancelling it.",
  "Bought these sneakers after checking three other apps, Nykaa was the only one with my size.",
  "The size chart says medium but it fits like a small, had to raise an exchange immediately.",
  "Delivery was quick and the packaging was neat, genuinely happy with this order.",
  "I have been eyeing this bag for two months, just waiting for a proper sale before I order.",
  "Kitne saare options hain ki decide hi nahi kar paa rahi kaunsa lena hai.",
  "Added around thirty things while browsing at night, next morning I could not remember why I saved half of them.",
  "Same jacket is cheaper on Myntra, I keep switching between both apps before buying anything.",
  "Product quality is decent but the price feels inflated compared to what you get in a store.",
  "Wanted a watch as a birthday gift but the delivery date kept moving so I bought elsewhere.",
  "Not sure if this brand is authentic, the stitching looks different from the brand's own site.",
  "There are barely any customer photos on this listing so I cannot tell how it actually looks.",
  "My saved list has become so long that I just scroll past everything and close the app.",
  "Ordered two dresses, one fit perfectly and the other was way too tight around the shoulders.",
  "Keep adding things to the bag and then abandoning it, I never actually check out.",
  "Wishlist items dikhte hi nahi hain jab tak app na kholo, koi reminder bhi nahi aata.",
  "The heels are beautiful and exactly like the photos, will definitely order again.",
  "I asked in a group which foundation shade to pick before ordering, could not decide alone.",
  "Item went out of stock in my size while I was still thinking about whether to buy it.",
  "Refund has been pending for two weeks even though the courier collected the parcel.",
  "Honestly I use the wishlist to track price drops, not because I plan to buy all of it.",
  "Too many similar looking sarees, I gave up comparing them and did not order anything.",
  "Good collection of accessories but I wish there were more reviews on each product.",
];

function sampleExample(n = 5): string {
  const pool = [...EXAMPLE_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).join(String.fromCharCode(10));
}

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
          <button className="btn btn-ghost" onClick={() => setText(sampleExample())} disabled={loading}>Load example</button>
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
