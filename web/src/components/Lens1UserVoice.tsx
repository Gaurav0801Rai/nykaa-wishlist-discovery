"use client";

import { useMemo } from "react";
import type { ClassifiedItem } from "@/lib/types";
import { aggregateBlockers } from "@/lib/corpus";
import BlockerBarChart from "./BlockerBarChart";
import BlockerRow from "./BlockerRow";

export default function Lens1UserVoice({ items }: { items: ClassifiedItem[] }) {
  const agg = useMemo(() => aggregateBlockers(items), [items]);
  const maxCount = Math.max(...agg.map((a) => a.count), 1);
  const bars = agg.map((a) => ({ code: a.code, count: a.count, pct: a.pct }));

  return (
    <div>
      <p className="lead" style={{ marginBottom: 18 }}>
        Ranked purely by how often each blocker appears in real user feedback — no reweighting.
        This is what the data says, trust/authenticity included.
      </p>
      <div className="card pad" style={{ marginBottom: 18 }}>
        <BlockerBarChart data={bars} />
      </div>
      {agg.map((a) => (
        <BlockerRow key={a.code} code={a.code} count={a.count} pct={a.pct} maxCount={maxCount} items={a.items} />
      ))}
      {agg.length === 0 && <p className="muted">No items match these filters.</p>}
    </div>
  );
}
