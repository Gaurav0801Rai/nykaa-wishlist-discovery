"use client";

import { useMemo } from "react";
import type { ClassifiedItem } from "@/lib/types";
import { aggregateBlockers } from "@/lib/corpus";
import { lens2Rank, tierLabel } from "@/lib/opportunity";
import BlockerRow from "./BlockerRow";

export default function Lens2Opportunity({ items }: { items: ClassifiedItem[] }) {
  const rows = useMemo(() => lens2Rank(aggregateBlockers(items)), [items]);
  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div>
      <div className="notice" style={{ marginBottom: 16 }}>
        <strong>Re-ranked for our goal</strong> — wishlist→purchase within 30 days, with{" "}
        <strong>no monetary levers</strong>. Nothing is hidden: every blocker keeps its real
        numbers. We simply order by <strong>how solvable it is through product & discovery</strong>,
        so the actionable wishlist blockers — <strong>context loss / wishlist visibility, confidence
        &amp; validation, in-wishlist comparison, and deferral</strong> — rise to the top.
        <strong> Trust</strong> and <strong>price</strong> stay visible below with a note: trust is
        largely already addressed on-app (verified reviews + real photos), and price would need a
        discount we can&apos;t use.
      </div>
      <div className="banner" style={{ marginBottom: 18 }}>
        Honest caveat: review data <strong>under-represents wishlist-deferral friction</strong> —
        people who defer a saved item rarely leave reviews. That under-sampling is exactly why this
        opportunity lens exists.
      </div>

      {rows.map((r) => (
        <BlockerRow
          key={r.code}
          code={r.code}
          count={r.count}
          pct={r.pct}
          maxCount={maxCount}
          items={r.items}
          badge={tierLabel(r.weight)}
          subtitle={r.rationale}
          note={r.note}
        />
      ))}
      {rows.length === 0 && <p className="muted">No items match these filters.</p>}
    </div>
  );
}
