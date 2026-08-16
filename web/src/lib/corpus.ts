// Aggregation over the user-feedback corpus. Pure functions on ClassifiedItem[].
// Every item here is user feedback (external research lives separately and is
// never counted). Percentages are over the current (filtered) item set.

import type { ClassifiedItem } from "./types";
import { sourceGroup } from "./taxonomy";

export interface BlockerAgg {
  code: string;
  count: number;
  pct: number;
  items: ClassifiedItem[];
}

export function filterItems(
  items: ClassifiedItem[],
  sources: string[],
  categories: string[]
): ClassifiedItem[] {
  return items.filter((it) => {
    const okSource = sources.length === 0 || sources.includes(sourceGroup(it.source));
    const okCat = categories.length === 0 || categories.includes(it.category_signal);
    return okSource && okCat;
  });
}

export function aggregateBlockers(items: ClassifiedItem[]): BlockerAgg[] {
  const n = items.length;
  const map = new Map<string, ClassifiedItem[]>();
  for (const it of items) {
    for (const code of it.blocker_codes) {
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(it);
    }
  }
  return Array.from(map.entries())
    .map(([code, its]) => ({
      code,
      count: its.length,
      pct: n ? Math.round((1000 * its.length) / n) / 10 : 0,
      items: its,
    }))
    .sort((a, b) => b.count - a.count);
}

export function presentCategories(items: ClassifiedItem[]): string[] {
  return Array.from(new Set(items.map((it) => it.category_signal)));
}
