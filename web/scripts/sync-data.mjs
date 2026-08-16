// Derives committed snapshots into web/src/data from the Python pipeline outputs
// (../ = repo root). Runs on predev/prebuild. Emits:
//   corpus_base.json  user-feedback text (untagged) -> input for retag-corpus.mjs
//   external.json     supporting-research items (never counted)
//   methodology.json  real corpus/rejected counts + gaps
// It also SEEDS classified.json once (bootstrap) if missing, so the site builds
// before you run `npm run retag`. It NEVER overwrites an existing classified.json
// (that is owned by the Gemini retag).
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

const primaryRaw = filtered.filter((it) => !it.is_external);
const externalRaw = filtered.filter((it) => it.is_external);

// user-feedback text to classify (untagged)
write(
  "corpus_base.json",
  primaryRaw.map((it) => ({
    id: it.id,
    source: it.source,
    text: it.text ?? it.raw_text ?? "",
    rating: it.rating ?? null,
  }))
);

// supporting research (context only, never counted)
write(
  "external.json",
  externalRaw.map((it) => ({
    id: it.id,
    source: it.source,
    text: it.text ?? it.raw_text ?? "",
  }))
);

// methodology counts
const rejectReasons = {};
for (const r of rejected) {
  const k = r.reject_reason || "unknown";
  rejectReasons[k] = (rejectReasons[k] || 0) + 1;
}
write("methodology.json", {
  collected: filtered.length + rejected.length,
  kept: filtered.length,
  primary: primaryRaw.length,
  external: externalRaw.length,
  rejected: rejected.length,
  reject_reasons: rejectReasons,
  gaps: [
    "App Store India returned 0 reviews via Apple's public RSS.",
    "Reddit and most forums were IP-blocked during collection.",
    "Public data is post-purchase and negative-skewed, under-observing pre-purchase decision friction.",
    "Non-buyers rarely leave reviews, so wishlist-deferral friction (context loss, choice overload) is under-sampled here.",
  ],
});

// bootstrap classified.json ONLY if it doesn't exist yet (do not clobber a retag)
const classifiedPath = join(OUTDIR, "classified.json");
if (!existsSync(classifiedPath)) {
  let seed = [];
  try {
    const heur = readJSON(join(ROOT, "data", "classified.json")).filter((it) => !it.is_external);
    seed = heur.map((it) => ({
      id: it.id,
      source: it.source,
      text: it.text,
      blocker_codes: it.blocker_codes || [],
      category_signal: it.category_signal || "unknown_general",
      supporting_quote: it.supporting_quote || "",
      rating: it.rating ?? null,
      tagging_method: it.tagging_method || "heuristic_v0",
    }));
  } catch {}
  writeFileSync(classifiedPath, JSON.stringify(seed, null, 0), "utf-8");
  console.log(`sync-data: seeded classified.json (${seed.length}, ${seed[0]?.tagging_method || "n/a"})`);
}

console.log(
  `sync-data: ${primaryRaw.length} user-feedback, ${externalRaw.length} external -> web/src/data/`
);
