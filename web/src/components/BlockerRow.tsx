"use client";

import { useState } from "react";
import type { ClassifiedItem } from "@/lib/types";
import { blockerLabel, BLOCKERS } from "@/lib/taxonomy";
import { EVIDENCE } from "@/lib/evidence";

export default function BlockerRow({
  code,
  count,
  pct,
  maxCount,
  items,
  badge,
  subtitle,
  note,
}: {
  code: string;
  count: number;
  pct: number;
  maxCount: number;
  items: ClassifiedItem[];
  badge?: string;
  subtitle?: string;
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  const evidence = EVIDENCE[code];

  // Prefer the hand-checked verbatims for this blocker; fall back to the
  // longest distinct quotes if none are curated.
  const quotes = (() => {
    if (evidence) {
      const byId = new Map(items.map((it) => [it.id, it]));
      const picked = evidence.quoteIds
        .map((id) => byId.get(id))
        .filter((it): it is ClassifiedItem => !!it)
        .map((it) => ({
          it,
          q: (evidence.exact?.[it.id] || it.supporting_quote || it.text).trim(),
        }));
      if (picked.length >= 3) return picked.slice(0, 4);
    }
    const seen = new Set<string>();
    return items
      .map((it) => ({ it, q: (it.supporting_quote || it.text).trim() }))
      .filter(({ q }) => q.length >= 25)
      .sort((a, b) => b.q.length - a.q.length)
      .filter(({ q }) => {
        const key = q.toLowerCase().slice(0, 45);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  })();

  return (
    <div className="blk">
      <button className="blk-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span aria-hidden style={{ color: "var(--brand)", fontWeight: 700 }}>{open ? "−" : "+"}</span>
        <span>
          <span style={{ fontWeight: 600 }}>
            {blockerLabel(code)}
            {badge && <span className="typechip" style={{ marginLeft: 8 }}>{badge}</span>}
          </span>
          <span className="muted small" style={{ display: "block" }}>
            {subtitle || BLOCKERS[code]?.blurb}
          </span>
        </span>
        <span className="muted" style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {count} · {pct}%
        </span>
      </button>
      <div className="bar-track" style={{ margin: "0 16px", height: 6 }}>
        <div className="bar-fill" style={{ width: `${(100 * count) / maxCount}%`, height: "100%" }} />
      </div>
      {note && (
        <p className="small" style={{ margin: "8px 16px 0", color: "#8a6d1f" }}>
          {note}
        </p>
      )}
      {open && (
        <div className="blk-quotes">
          {evidence && <p className="blk-summary">{evidence.summary}</p>}
          {quotes.length === 0 && <p className="muted small">No quotes available.</p>}
          {quotes.map(({ it, q }) => (
            <div className="quote" key={it.id}>“{q.slice(0, 240)}”</div>
          ))}
        </div>
      )}
    </div>
  );
}
