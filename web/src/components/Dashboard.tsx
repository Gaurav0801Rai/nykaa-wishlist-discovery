"use client";

import { useMemo } from "react";
import type { ClassifiedItem, Methodology } from "@/lib/types";
import { aggregateBlockers } from "@/lib/corpus";
import { lens2Rank, tierLabel } from "@/lib/opportunity";
import { blockerType, INSIGHTS } from "@/lib/dashboard";
import { blockerLabel } from "@/lib/taxonomy";
import BlockerRow from "./BlockerRow";

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="card pad" style={{ textAlign: "center" }}>
      <div className="serif" style={{ fontSize: 30, color: "var(--brand)" }}>{n}</div>
      <div className="muted small">{label}</div>
    </div>
  );
}

export default function Dashboard({
  items,
  methodology,
}: {
  items: ClassifiedItem[];
  methodology: Methodology;
}) {
  const agg = useMemo(() => aggregateBlockers(items), [items]);
  const maxCount = Math.max(...agg.map((a) => a.count), 1);
  const ranked = useMemo(() => lens2Rank(agg), [agg]);
  const sources = Object.entries(methodology.sources).sort((a, b) => b[1] - a[1]);
  // "A, B, C and D" — source names only, no per-source counts.
  const PROSE: Record<string, string> = {
    "Play Store": "the Play Store",
    "App Store": "the App Store",
    Reddit: "Reddit",
    "Web forums": "review forums",
    Discussions: "Q&A sites",
    "Community & web": "community discussions",
  };
  const sourceSentence = useMemo(() => {
    const names = sources.map(([s]) => PROSE[s] ?? s.toLowerCase());
    if (names.length <= 1) return names[0] ?? "";
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  }, [sources]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <section>
        <h2 className="h2">Discovery analytics</h2>
        <div className="grid grid-3" style={{ marginTop: 14 }}>
          <Stat n={methodology.user_feedback} label="user-feedback items analysed" />
          <Stat n={agg.length} label="distinct blockers detected" />
          <Stat n={sources.length} label="sources" />
        </div>
        <div className="card pad" style={{ marginTop: 16 }}>
          <div className="small" style={{ fontWeight: 700, marginBottom: 10 }}>Where the feedback came from</div>
          <div className="bars">
            {sources.map(([s, n]) => (
              <div className="bar-row" key={s} style={{ gridTemplateColumns: "150px 1fr 44px" }}>
                <div className="bar-label small">{s}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(100 * n) / methodology.user_feedback}%` }} /></div>
                <div className="bar-num">{n}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="h2">What users are telling us</h2>
        <p className="lead" style={{ marginBottom: 18 }}>
          Every blocker found across {methodology.user_feedback} items, ranked by how often it appears.
          Expand any row to read the feedback behind it.
        </p>
        {agg.map((a) => (
          <BlockerRow
            key={a.code}
            code={a.code}
            count={a.count}
            pct={a.pct}
            maxCount={maxCount}
            items={a.items}
            badge={blockerType(a.code)}
          />
        ))}
      </section>

      <section>
        <h2 className="h2">Reading the same data by where it happens</h2>
        <p className="lead" style={{ marginBottom: 8 }}>
          Raw frequency reflects who writes reviews: people who already ordered. Re-reading the same
          blockers by <strong>when in the journey they occur</strong> separates what shoppers say while an
          item is still saved from what they report after an order arrived.
        </p>
        <p className="muted small" style={{ marginBottom: 18, maxWidth: "72ch" }}>
          Nothing is removed — all {agg.length} blockers stay listed with their real counts.
        </p>
        <div className="grid">
          {ranked.map((r, i) => (
            <div className="card pad" key={r.code} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div className="serif" style={{ fontSize: 22, color: "var(--brand)", minWidth: 26 }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {blockerLabel(r.code)}{" "}
                  <span className="typechip">{tierLabel(r.weight)}</span>{" "}
                  <span className="muted small">· {r.count} items ({r.pct}%)</span>
                </div>
                <div className="muted small" style={{ marginTop: 4 }}>{r.rationale}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h2">Observations</h2>
        <p className="lead" style={{ marginBottom: 18 }}>Patterns that emerge when the feedback is read together.</p>
        <div className="grid grid-2">
          {INSIGHTS.map((ins, i) => (
            <div className="card pad" key={i}>
              <p style={{ margin: "0 0 10px" }}>{ins.finding}</p>
              <p className="small" style={{ margin: 0, fontWeight: 700, color: "var(--brand-dark)" }}>→ {ins.takeaway}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="card pad muted small">
          <strong>About the data.</strong> {methodology.user_feedback} pieces of real user feedback
          from {sourceSentence}. Each one was read and tagged against 15 possible blockers, across
          every product category.
        </div>
      </section>
    </div>
  );
}
