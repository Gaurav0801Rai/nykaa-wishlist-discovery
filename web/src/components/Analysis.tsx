"use client";

import { useState } from "react";
import type { ClassifiedItem, Methodology } from "@/lib/types";
import ChatBot from "./ChatBot";
import Dashboard from "./Dashboard";
import Analyzer from "./Analyzer";

type View = "ask" | "dashboard" | "analyzer";

export default function Analysis({
  base,
  methodology,
}: {
  base: ClassifiedItem[];
  methodology: Methodology;
}) {
  const [view, setView] = useState<View>("ask");

  return (
    <div>
      <div className="tabs">
        <button className="tab" aria-selected={view === "ask"} onClick={() => setView("ask")}>
          Ask Assistant
        </button>
        <button className="tab" aria-selected={view === "dashboard"} onClick={() => setView("dashboard")}>
          Dashboard
        </button>
        <button className="tab" aria-selected={view === "analyzer"} onClick={() => setView("analyzer")}>
          Live Analyzer
        </button>
      </div>

      {view === "ask" && <ChatBot />}
      {view === "dashboard" && <Dashboard items={base} methodology={methodology} />}
      {view === "analyzer" && <Analyzer />}
    </div>
  );
}
