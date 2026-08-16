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
        <Stat n={m.collected} label="items collected" />
        <Stat n={m.kept} label="kept after relevance filter" />
        <Stat n={m.rejected} label="rejected (reasons logged)" />
      </div>

      <div className="grid grid-2">
        <div className="card pad">
          <h3 style={{ marginTop: 0, fontSize: 18 }}>Two separate buckets</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            <strong>{m.primary}</strong> user-feedback items drive every blocker count and % on this
            site. <strong>{m.external}</strong> external research items appear only as labelled
            context and are <strong>never</strong> counted in a Nykaa %.
          </p>
          <p className="small muted" style={{ marginBottom: 0 }}>
            Classifier: <code>{taggingBadge}</code>
            {taggingBadge.startsWith("heuristic") &&
              " — provisional keyword tags; run the Gemini re-tag to finalise."}
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
