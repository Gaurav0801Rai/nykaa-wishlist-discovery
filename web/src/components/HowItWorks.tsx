"use client";

import type { Methodology } from "@/lib/types";

const STEPS = [
  ["Sources", "Play Store · App Store · Reddit · web forums · discussions"],
  ["Filter", "keep save→buy decision signal; drop pure logistics"],
  ["Classify", "Gemini tags each item against the blocker taxonomy"],
  ["Quantify", "rank blockers by frequency (Lens 1)"],
  ["Segment", "by source & product category; re-rank by opportunity (Lens 2)"],
];

const REASON_LABELS: Record<string, string> = {
  pure_delivery_logistics: "Pure delivery logistics",
  too_short_noise: "Too short / noise",
  customer_care_ops: "Customer-care operations",
  pure_refund_return_dispute: "Refund / return dispute",
  off_topic_no_decision_signal: "Off-topic (no decision signal)",
  boilerplate_nav: "Boilerplate / navigation",
  app_bug_only: "App bug only",
};

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="card pad" style={{ textAlign: "center" }}>
      <div className="serif" style={{ fontSize: 32, color: "var(--brand)" }}>{n}</div>
      <div className="muted small">{label}</div>
    </div>
  );
}

export default function HowItWorks({ m, taggingBadge }: { m: Methodology; taggingBadge: string }) {
  const reasons = Object.entries(m.reject_reasons).sort((a, b) => b[1] - a[1]);
  const maxR = reasons[0]?.[1] || 1;
  const sources = Object.entries(m.sources).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="pipeline">
        {STEPS.map(([t, d], i) => (
          <div className="pstep" key={t}>
            <div className="pstep-t">{t}</div>
            <div className="muted small">{d}</div>
            {i < STEPS.length - 1 && <span className="parrow" aria-hidden>→</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-3" style={{ margin: "22px 0" }}>
        <Stat n={m.user_feedback} label="user-feedback items (drive all %)" />
        <Stat n={m.nykaa_collected} label="items collected & screened" />
        <Stat n={m.nykaa_rejected} label="rejected (reasons logged)" />
      </div>

      <div className="grid grid-2">
        <div className="card pad">
          <h3 style={{ marginTop: 0, fontSize: 18 }}>Sources (all count toward the %)</h3>
          <div className="bars">
            {sources.map(([s, n]) => (
              <div className="bar-row" key={s} style={{ gridTemplateColumns: "150px 1fr 40px" }}>
                <div className="bar-label small">{s}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(100 * n) / m.user_feedback}%` }} /></div>
                <div className="bar-num">{n}</div>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginBottom: 0, marginTop: 12 }}>
            {m.nykaa_items} Nykaa items + {m.added_items} Reddit/community wishlist voice.
            Classifier: <code>{taggingBadge}</code>.
          </p>
        </div>
        <div className="card pad">
          <h3 style={{ marginTop: 0, fontSize: 18 }}>Why items were rejected</h3>
          <div className="bars">
            {reasons.map(([k, n]) => (
              <div className="bar-row" key={k} style={{ gridTemplateColumns: "170px 1fr 40px" }}>
                <div className="bar-label small">{REASON_LABELS[k] || k}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(100 * n) / maxR}%` }} /></div>
                <div className="bar-num">{n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card pad" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0, fontSize: 18 }}>Known gaps & sampling caveats</h3>
        <ul className="small muted" style={{ margin: 0, paddingLeft: 18 }}>
          {m.gaps.map((g, i) => <li key={i} style={{ marginBottom: 4 }}>{g}</li>)}
        </ul>
      </div>
    </div>
  );
}
