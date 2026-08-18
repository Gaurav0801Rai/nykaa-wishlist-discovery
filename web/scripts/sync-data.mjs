// Builds committed snapshots into web/src/data from the pipeline outputs
// (../ = repo root). Runs on predev/prebuild. Emits:
//   corpus_base.json  ALL user-feedback text (untagged): Nykaa (179) + added
//                     Reddit/community wishlist voice -> input for retag-corpus.mjs
//   methodology.json  real counts + source breakdown + gaps
// Seeds classified.json once (bootstrap, base only) if missing; never clobbers a
// completed Gemini retag.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT = dirname(WEB);
const OUTDIR = join(WEB, "src", "data");
if (!existsSync(OUTDIR)) mkdirSync(OUTDIR, { recursive: true });

const readJSON = (p) => JSON.parse(readFileSync(p, "utf-8"));
const write = (name, obj) =>
  writeFileSync(join(OUTDIR, name), JSON.stringify(obj, null, 0), "utf-8");

const filtered = readJSON(join(ROOT, "data", "filtered.json"));
const rejected = readJSON(join(ROOT, "data", "rejected.json"));
const nykaa = filtered
  .filter((it) => !it.is_external)
  .map((it) => ({ id: it.id, source: it.source, text: it.text ?? it.raw_text ?? "", rating: it.rating ?? null }));

let extra = [];
const extraPath = join(ROOT, "data", "extra_raw.json");
if (existsSync(extraPath)) extra = readJSON(extraPath);

const corpusBase = [...nykaa, ...extra];
write("corpus_base.json", corpusBase);

// source grouping (mirrors web/src/lib/taxonomy.ts sourceGroup)
function group(s) {
  if (s === "community") return "Community & web";
  if (s === "reddit") return "Reddit";
  if (s === "play_store") return "Play Store";
  if (s === "app_store") return "App Store";
  if (s === "quora") return "Q&A sites";
  if (["trustpilot", "pissedconsumer", "voxya"].includes(s)) return "Review forums";
  return "Other";
}
const sources = {};
for (const it of corpusBase) sources[group(it.source)] = (sources[group(it.source)] || 0) + 1;

const rejectReasons = {};
for (const r of rejected) {
  const k = r.reject_reason || "unknown";
  rejectReasons[k] = (rejectReasons[k] || 0) + 1;
}

write("methodology.json", {
  user_feedback: corpusBase.length,
  nykaa_items: nykaa.length,
  added_items: extra.length,
  sources,
  nykaa_collected: filtered.length + rejected.length,
  nykaa_rejected: rejected.length,
  reject_reasons: rejectReasons,
  gaps: [
    "App Store India returned 0 reviews via Apple's public RSS.",
    "Reddit/community items are broad wishlist discussion (often beauty or general shopping), added to widen coverage of the save-and-defer moment reviews miss.",
    "Product category is unspecified in most items, so category cuts are directional.",
    "Directional discovery signal — to be confirmed in Part-3 survey & interviews.",
  ],
});

// bootstrap classified.json only if missing (base heuristic; retag replaces it)
const classifiedPath = join(OUTDIR, "classified.json");
if (!existsSync(classifiedPath)) {
  let seed = [];
  try {
    seed = readJSON(join(ROOT, "data", "classified.json"))
      .filter((it) => !it.is_external)
      .map((it) => ({
        id: it.id, source: it.source, text: it.text,
        blocker_codes: it.blocker_codes || [], category_signal: it.category_signal || "unknown_general",
        supporting_quote: it.supporting_quote || "", rating: it.rating ?? null,
        tagging_method: it.tagging_method || "heuristic_v0",
      }));
  } catch {}
  writeFileSync(classifiedPath, JSON.stringify(seed, null, 0), "utf-8");
  console.log(`sync-data: seeded classified.json (${seed.length}, base only)`);
}

console.log(`sync-data: corpus_base ${corpusBase.length} (nykaa ${nykaa.length} + added ${extra.length}) -> web/src/data/`);
