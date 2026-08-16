import classifiedRaw from "@/data/classified.json";
import externalRaw from "@/data/external.json";
import methodologyRaw from "@/data/methodology.json";
import type { ClassifiedItem, ExternalItem, Methodology } from "@/lib/types";
import Analysis from "@/components/Analysis";
import SupportingResearch from "@/components/SupportingResearch";

const base = classifiedRaw as ClassifiedItem[];
const external = externalRaw as ExternalItem[];
const methodology = methodologyRaw as Methodology;

export default function Home() {
  const taggingBadge = base[0]?.tagging_method || methodology.tagging_method || "heuristic_v0";

  return (
    <main id="top">
      <section className="section">
        <div className="container">
          <span className="eyebrow">AI-Powered Discovery Engine · Nykaa Fashion</span>
          <h1 className="h1" style={{ margin: "10px 0 12px", maxWidth: "17ch" }}>
            Why do wishlisted items never get bought?
          </h1>
          <p className="lead">
            A live discovery engine for Nykaa Fashion&apos;s wishlist→purchase problem — across every
            category, with no monetary levers. Two lenses: <strong>what users are telling us</strong>{" "}
            (raw, honest) and <strong>where the opportunity is</strong> (re-ranked for the goal). Paste
            your own feedback and watch the ranking recompute live.
          </p>
          <p className="muted small" style={{ margin: "8px 0 24px" }}>
            Goal: raise the share of users who buy ≥1 wishlisted item within 30 days of saving it.
          </p>

          <Analysis
            base={base}
            external={external}
            methodology={methodology}
            taggingBadge={taggingBadge}
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="eyebrow">Supporting research</span>
          <h2 className="h2">External benchmarks (context, not counted)</h2>
          <p className="lead" style={{ marginBottom: 20 }}>
            Widely-cited research that motivates the decision-graveyard hypothesis — kept strictly
            separate from Nykaa&apos;s measured percentages.
          </p>
          <SupportingResearch external={external} />
        </div>
      </section>
    </main>
  );
}
