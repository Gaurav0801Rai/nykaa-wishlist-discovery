"use client";

import { useMemo } from "react";
import type { ClassifiedItem, Methodology } from "@/lib/types";
import { aggregateBlockers } from "@/lib/corpus";
import { lens2Rank, tierLabel } from "@/lib/opportunity";
import { blockerType, INSIGHTS, NEEDS } from "@/lib/dashboard";
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
  const focus = useMemo(() => lens2Rank(agg).filter((r) => r.weight >= 2).slice(0, 5), [agg]);
  const sources = Object.entries(methodology.sources).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* overview */}
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

      {/* top blockers */}
      <section>
        <h2 className="h2">Top blockers — what users are telling us</h2>
        <p className="lead" style={{ marginBottom: 18 }}>
          Ranked by how often each appears across {methodology.user_feedback} items. Grouped by type;
          expand any for real quotes.
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

      {/* where to focus */}
      <section>
        <h2 className="h2">Where to focus — the fixable opportunities</h2>
        <p className="lead" style={{ marginBottom: 18 }}>
          Re-prioritised for the goal (buy a saved item within 30 days) with <strong>no discounts</strong>.
          Trust is already handled on-app and price needs deals we can&apos;t use, so the highest-leverage
          fixes are the wishlist-decision blockers below.
        </p>
        <div className="grid">
          {focus.map((r, i) => (
            <div className="card pad" key={r.code} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div className="serif" style={{ fontSize: 24, color: "var(--brand)", minWidth: 28 }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {blockerLabel(r.code)}{" "}
                  <span className="typechip">{tierLabel(r.weight)} opportunity</span>{" "}
                  <span className="muted small">· {r.count} items ({r.pct}%)</span>
                </div>
                <div className="muted small" style={{ marginTop: 4 }}>{r.rationale}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* key insights */}
      <section>
        <h2 className="h2">Key insights</h2>
        <p className="lead" style={{ marginBottom: 18 }}>What the data means when read together.</p>
        <div className="grid grid-2">
          {INSIGHTS.map((ins, i) => (
            <div className="card pad" key={i}>
              <p style={{ margin: "0 0 10px" }}>{ins.finding}</p>
              <p className="small" style={{ margin: 0, fontWeight: 700, color: "var(--brand-dark)" }}>→ {ins.takeaway}</p>
            </div>
          ))}
        </div>
      </section>

      {/* needs / opportunities */}
      <section>
        <h2 className="h2">Top user needs &amp; opportunities</h2>
        <p className="lead" style={{ marginBottom: 18 }}>Direct requests and openings mapped from the corpus.</p>
        <div className="grid grid-2">
          {NEEDS.map((g) => (
            <div className="card pad" key={g.title}>
              <h3 style={{ marginTop: 0, fontSize: 17 }}>{g.title}</h3>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                {g.items.map((it, i) => <li key={i} style={{ marginBottom: 6 }}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* about the data */}
      <section>
        <div className="card pad muted small">
          <strong>About the data.</strong> {methodology.user_feedback} pieces of real user feedback:
          {" "}{methodology.nykaa_items} Nykaa app-store reviews and forum posts, plus {methodology.added_items}{" "}
          Reddit and community discussions about wishlist shopping. Each one is read by AI and tagged
          against 15 possible blockers, across every product category.
        </div>
      </section>
    </div>
  );
}
