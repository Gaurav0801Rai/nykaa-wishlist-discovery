import type { ExternalItem } from "@/lib/types";

// External benchmarks / research — labelled context only, NEVER counted in the
// Nykaa blocker percentages, and never presented as Nykaa user data.
const CURATED = [
  {
    title: "Iyengar & Lepper — the “jam study”",
    body: "24 jams drew more interest but only ~3% purchased, vs ~30% with just 6 options. Fewer choices, ~10× conversion.",
    tag: "Choice overload",
  },
  {
    title: "Baymard Institute — cart abandonment",
    body: "The documented average online cart-abandonment rate is ~70%, with fashion/apparel typically higher.",
    tag: "Deferral",
  },
  {
    title: "Boldmetrics — sizing",
    body: "A large share of apparel shoppers report sizing uncertainty and ~a third of clothing returns are size-related.",
    tag: "Fit / size",
  },
];

export default function SupportingResearch({ external }: { external: ExternalItem[] }) {
  const voices = external
    .filter((e) => e.source.startsWith("web_") && !e.source.includes("benchmark"))
    .slice(0, 3);

  return (
    <div>
      <div className="banner" style={{ marginBottom: 16 }}>
        Supporting research is <strong>external context only</strong> — <strong>not counted</strong>{" "}
        in the Nykaa blocker percentages, and not Nykaa user data.
      </div>
      <div className="grid grid-3">
        {CURATED.map((c) => (
          <div className="card pad" key={c.title}>
            <span className="chip ext">{c.tag} · external</span>
            <h3 style={{ fontSize: 16, margin: "12px 0 6px" }}>{c.title}</h3>
            <p className="muted small" style={{ margin: 0 }}>{c.body}</p>
          </div>
        ))}
      </div>
      {voices.length > 0 && (
        <>
          <p className="muted small" style={{ margin: "20px 0 8px", fontWeight: 700 }}>
            Open-web shopper voice (external — decision-friction hypothesis, not counted)
          </p>
          <div className="grid grid-3">
            {voices.map((v) => (
              <div className="card pad" key={v.id}>
                <span className="chip ext">external</span>
                <p className="small" style={{ margin: "10px 0 0", fontStyle: "italic" }}>
                  “{v.text.slice(0, 180)}”
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
