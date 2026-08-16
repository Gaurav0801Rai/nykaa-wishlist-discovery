"use client";

import { useMemo, useState } from "react";
import type { ClassifiedItem, ExternalItem, Methodology } from "@/lib/types";
import { CATEGORIES } from "@/lib/taxonomy";
import { filterItems } from "@/lib/corpus";
import Filters from "./Filters";
import AddDataBox from "./AddDataBox";
import Lens1UserVoice from "./Lens1UserVoice";
import Lens2Opportunity from "./Lens2Opportunity";
import DiscoveryQuestions from "./DiscoveryQuestions";
import HowItWorks from "./HowItWorks";

type Tab = "analyzer" | "lens1" | "lens2" | "questions" | "how";

const TABS: { id: Tab; label: string }[] = [
  { id: "analyzer", label: "Analyzer" },
  { id: "lens1", label: "Lens 1 · What users tell us" },
  { id: "lens2", label: "Lens 2 · Where the opportunity is" },
  { id: "questions", label: "Discovery Questions" },
  { id: "how", label: "How it works" },
];

export default function Analysis({
  base,
  external,
  methodology,
  taggingBadge,
}: {
  base: ClassifiedItem[];
  external: ExternalItem[];
  methodology: Methodology;
  taggingBadge: string;
}) {
  const [tab, setTab] = useState<Tab>("analyzer");
  const [added, setAdded] = useState<ClassifiedItem[]>([]);
  const [useAdded, setUseAdded] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);

  const corpusAll = useMemo(
    () => (useAdded && added.length ? [...base, ...added] : base),
    [base, added, useAdded]
  );
  const availableCats = useMemo(() => {
    const present = new Set(corpusAll.map((it) => it.category_signal));
    return Object.keys(CATEGORIES).filter((c) => present.has(c));
  }, [corpusAll]);
  const filtered = useMemo(
    () => filterItems(corpusAll, sources, cats),
    [corpusAll, sources, cats]
  );

  const showFilters = tab === "lens1" || tab === "lens2";

  return (
    <div>
      {/* tab bar */}
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* corpus toggle */}
      <div className="corpus-toggle">
        <span className="muted small">Corpus:</span>
        <button className="toggle" aria-pressed={!useAdded} onClick={() => setUseAdded(false)}>
          Base ({base.length})
        </button>
        <button
          className="toggle"
          aria-pressed={useAdded}
          onClick={() => setUseAdded(true)}
          disabled={added.length === 0}
          title={added.length === 0 ? "Add data in the Analyzer tab first" : ""}
        >
          Base + added ({base.length + added.length})
        </button>
        {added.length > 0 && <span className="muted small">· {added.length} added this session</span>}
      </div>

      {showFilters && (
        <Filters
          sources={sources}
          cats={cats}
          availableCats={availableCats}
          setSources={setSources}
          setCats={setCats}
          matched={filtered.length}
        />
      )}

      {tab === "analyzer" && (
        <AddDataBox
          onAdd={(items) => {
            setAdded((prev) => [...prev, ...items]);
            setUseAdded(true);
          }}
        />
      )}
      {tab === "lens1" && <Lens1UserVoice items={filtered} />}
      {tab === "lens2" && <Lens2Opportunity items={filtered} />}
      {tab === "questions" && <DiscoveryQuestions items={corpusAll} />}
      {tab === "how" && <HowItWorks m={methodology} taggingBadge={taggingBadge} />}
    </div>
  );
}
