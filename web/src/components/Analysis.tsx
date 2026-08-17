"use client";

import { useState } from "react";
import type { ClassifiedItem, Methodology } from "@/lib/types";
import ChatBot from "./ChatBot";
import Dashboard from "./Dashboard";

type View = "ask" | "dashboard";

export default function Analysis({
  base,
  methodology,
  taggingBadge,
}: {
  base: ClassifiedItem[];
  methodology: Methodology;
  taggingBadge: string;
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
      </div>

      {view === "ask" && <ChatBot />}
      {view === "dashboard" && (
        <Dashboard items={base} methodology={methodology} taggingBadge={taggingBadge} />
      )}
    </div>
  );
}
