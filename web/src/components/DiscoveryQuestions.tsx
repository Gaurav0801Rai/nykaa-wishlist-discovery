"use client";

import { useMemo } from "react";
import type { ClassifiedItem } from "@/lib/types";
import { aggregateBlockers } from "@/lib/corpus";
import { QUESTIONS } from "@/lib/questions";
import { blockerLabel, sourceGroup } from "@/lib/taxonomy";

export default function DiscoveryQuestions({ items }: { items: ClassifiedItem[] }) {
  const aggMap = useMemo(() => {
    const map = new Map<string, { count: number; pct: number; items: ClassifiedItem[] }>();
    for (const a of aggregateBlockers(items)) map.set(a.code, a);
    return map;
  }, [items]);

  return (
    <div>
      <p className="lead" style={{ marginBottom: 18 }}>
        The assignment&apos;s discovery questions, answered from the data — with an honest flag where
        reviews can&apos;t answer and primary research is needed.
      </p>
      <div className="grid">
        {QUESTIONS.map((q) => {
          const rows = q.blockers
            .map((code) => ({ code, ...(aggMap.get(code) || { count: 0, pct: 0, items: [] }) }))
            .sort((a, b) => b.count - a.count);
          const quotes = rows
            .flatMap((r) => r.items)
            .filter((it) => (it.supporting_quote || it.text).trim().length > 0)
            .slice(0, 2);
          return (
            <div className="card pad" key={q.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{q.question}</h3>
                {q.thin ? (
                  <span className="chip ext">thin data → needs primary research</span>
                ) : (
                  <span className="chip src">answered from data</span>
                )}
              </div>
              {rows.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "12px 0" }}>
                  {rows.map((r) => (
                    <span className="chip" key={r.code}>
                      {blockerLabel(r.code)} · {r.count} ({r.pct}%)
                    </span>
                  ))}
                </div>
              )}
              <p className="muted small" style={{ margin: "6px 0 0" }}>{q.note}</p>
              {quotes.map((it) => (
                <div className="quote" key={it.id} style={{ marginTop: 10 }}>
                  “{(it.supporting_quote || it.text).slice(0, 220)}”
                  <span className="src">— {sourceGroup(it.source)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
