"use client";

import { PRIMARY_SOURCE_GROUPS, CATEGORIES, categoryLabel } from "@/lib/taxonomy";

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className="toggle" aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  );
}

export default function Filters({
  sources,
  cats,
  availableCats,
  setSources,
  setCats,
  matched,
}: {
  sources: string[];
  cats: string[];
  availableCats: string[];
  setSources: (v: string[]) => void;
  setCats: (v: string[]) => void;
  matched: number;
}) {
  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="card pad" style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "flex-start" }}>
        <div>
          <div className="small" style={{ fontWeight: 700, marginBottom: 8 }}>Source</div>
          <div className="filters">
            {PRIMARY_SOURCE_GROUPS.map((s) => (
              <Toggle key={s} label={s} active={sources.includes(s)} onClick={() => toggle(sources, s, setSources)} />
            ))}
          </div>
        </div>
        <div>
          <div className="small" style={{ fontWeight: 700, marginBottom: 8 }}>Category</div>
          <div className="filters">
            {availableCats.map((c) => (
              <Toggle key={c} label={categoryLabel(c)} active={cats.includes(c)} onClick={() => toggle(cats, c, setCats)} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <span className="muted small">{matched} user-feedback items match · percentages are of these.</span>
        {(sources.length > 0 || cats.length > 0) && (
          <button className="toggle" onClick={() => { setSources([]); setCats([]); }}>Reset</button>
        )}
      </div>
    </div>
  );
}
