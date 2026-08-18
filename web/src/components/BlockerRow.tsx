"use client";

import { useState } from "react";
import type { ClassifiedItem } from "@/lib/types";
import { blockerLabel, BLOCKERS, sourceGroup } from "@/lib/taxonomy";

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
  const quotes = items
    .filter((it) => (it.supporting_quote || it.text).trim().length > 0)
    .slice(0, 6);

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
          {quotes.length === 0 && <p className="muted small">No quotes available.</p>}
          {quotes.map((it) => {
            // Only app-store items carry a 1-5 star rating; other sources store
            // an upvote score, which must not be rendered as stars.
            const isStore = it.source === "play_store" || it.source === "app_store";
            const stars = isStore && it.rating ? ` · ${it.rating}★` : "";
            return (
              <div className="quote" key={it.id}>
                “{(it.supporting_quote || it.text).slice(0, 240)}”
                <span className="src">— {sourceGroup(it.source)}{stars}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
