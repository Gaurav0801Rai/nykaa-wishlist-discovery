// Re-tags the ENTIRE base user-feedback corpus with the same Gemini classifier
// the live Analyzer uses, so every number on the site comes from one classifier.
// Overwrites web/src/data/classified.json.
//
// Usage:  npm run retag        (reads GEMINI_API_KEY from .env.local or the env)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyItems, geminiModel } from "../src/lib/gemini.mjs";

const WEB = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA = join(WEB, "src", "data");

// Load .env.local so `npm run retag` works without exporting the var manually.
function loadEnvLocal() {
  const p = join(WEB, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const BATCH = 12;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnvLocal();
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not set. Add it to web/.env.local, then re-run `npm run retag`.");
    process.exit(1);
  }
  const base = JSON.parse(readFileSync(join(DATA, "corpus_base.json"), "utf-8"));
  const model = geminiModel();
  const out = [];

  // Try with retries; on repeated failure return null (caller falls back per-item).
  async function tryClassify(texts, attempts = 3) {
    const backoffs = [1500, 4000, 9000];
    for (let a = 0; a <= attempts; a++) {
      try {
        return await classifyItems(texts);
      } catch (e) {
        if (a >= attempts) return null;
        process.stdout.write(`retry ${a + 1}… `);
        await sleep(backoffs[Math.min(a, backoffs.length - 1)]);
      }
    }
    return null;
  }

  let failures = 0;
  for (let i = 0; i < base.length; i += BATCH) {
    const chunk = base.slice(i, i + BATCH);
    process.stdout.write(`  tagging ${i + 1}-${i + chunk.length} / ${base.length}... `);
    let tagged = await tryClassify(chunk.map((c) => c.text));
    if (!tagged) {
      // Isolate the offending item(s): tag one at a time; empty tags if it still fails.
      process.stdout.write("per-item fallback… ");
      tagged = [];
      for (const c of chunk) {
        const one = await tryClassify([c.text], 2);
        if (one && one[0]) {
          tagged.push(one[0]);
        } else {
          failures++;
          tagged.push({ blocker_codes: [], category_signal: "unknown_general", supporting_quote: c.text.slice(0, 160) });
        }
        await sleep(400);
      }
    }
    chunk.forEach((item, j) => {
      const t = tagged[j] || {};
      out.push({
        id: item.id,
        source: item.source,
        text: item.text,
        blocker_codes: t.blocker_codes || [],
        category_signal: t.category_signal || "unknown_general",
        supporting_quote: t.supporting_quote || item.text.slice(0, 160),
        rating: item.rating ?? null,
        tagging_method: `gemini:${model}`,
      });
    });
    console.log("ok");
    await sleep(1200); // polite pacing
  }

  writeFileSync(join(DATA, "classified.json"), JSON.stringify(out, null, 0), "utf-8");
  // stamp methodology tagging_method
  const mp = join(DATA, "methodology.json");
  const meth = JSON.parse(readFileSync(mp, "utf-8"));
  meth.tagging_method = `gemini:${model}`;
  writeFileSync(mp, JSON.stringify(meth, null, 0), "utf-8");

  console.log(`\nRe-tagged ${out.length} items with gemini:${model} -> classified.json` +
    (failures ? ` (${failures} item(s) could not be tagged -> empty)` : ""));
}

main();
