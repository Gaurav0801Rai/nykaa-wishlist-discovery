import { blockerLabel } from "@/lib/taxonomy";

export interface BarDatum {
  code: string;
  count: number;
  pct: number;
}

export default function BlockerBarChart({
  data,
  showPct = true,
}: {
  data: BarDatum[];
  showPct?: boolean;
}) {
  if (data.length === 0) {
    return <p className="muted small">No items match — adjust the filters.</p>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="bar-row" key={d.code}>
          <div className="bar-label" title={d.code}>
            {blockerLabel(d.code)}
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(100 * d.count) / max}%` }} />
          </div>
          <div className="bar-num">
            {d.count}
            {showPct ? ` · ${d.pct}%` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
