import classifiedRaw from "@/data/classified.json";
import methodologyRaw from "@/data/methodology.json";
import type { ClassifiedItem, Methodology } from "@/lib/types";
import Analysis from "@/components/Analysis";

const base = classifiedRaw as ClassifiedItem[];
const methodology = methodologyRaw as Methodology;

export default function Home() {
  const taggingBadge = base[0]?.tagging_method || methodology.tagging_method || "heuristic_v0";

  return (
    <main id="top">
      <section className="section">
        <div className="container">
          <span className="eyebrow">AI-Powered Discovery Engine</span>
          <h1 className="h1" style={{ margin: "10px 0 12px", maxWidth: "17ch" }}>
            Why do wishlisted items never get bought?
          </h1>
          <p className="lead" style={{ marginBottom: 24 }}>
            An AI engine that reads real shopper feedback and ranks the reasons people don&apos;t buy
            the items they save.
          </p>

          <Analysis
            base={base}
            methodology={methodology}
            taggingBadge={taggingBadge}
          />
        </div>
      </section>
    </main>
  );
}
