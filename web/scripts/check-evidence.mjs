// Verifies the curated dashboard evidence: every quote id exists, belongs to the
// blocker it is shown under, and every pinned "exact" quote is verbatim text
// from that item. Run with `npm run check`.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = dirname(dirname(fileURLToPath(import.meta.url)));
const NL = String.fromCharCode(10);
const raw = readFileSync(join(WEB, "src/lib/evidence.ts"), "utf-8");
const lines = raw.split(NL).map((l) => l.replace(String.fromCharCode(13), ""));
const items = JSON.parse(readFileSync(join(WEB, "src/data/classified.json"), "utf-8"));
const byId = new Map(items.map((x) => [x.id, x]));
const norm = (s) => s.split(/\s+/).join(" ").trim().toLowerCase();
const quoted = (l) => {
  const a = l.indexOf('"');
  const b = l.lastIndexOf('"');
  return a !== -1 && b > a ? l.slice(a + 1, b) : null;
};

// Line-based parse: a two-space-indented `blocker_code: {` starts a block.
const blocks = [];
let cur = null;
let section = null;
for (const line of lines) {
  const t = line.trim();
  if (line.startsWith("  ") && !line.startsWith("   ") && t.endsWith(": {") && !t.startsWith("//")) {
    cur = { code: t.slice(0, t.length - 3).trim(), ids: [], exact: [] };
    blocks.push(cur);
    section = null;
    continue;
  }
  if (!cur) continue;
  if (line === "  }," || line === "  }") { cur = null; section = null; continue; }
  if (t.startsWith("quoteIds:")) { section = "ids"; continue; }
  if (t.startsWith("exact:")) { section = "exact"; continue; }
  if (t === "]," || t === "]" || t === "}," || t === "}") { section = null; continue; }

  if (section === "ids") {
    const q = quoted(t);
    if (q) cur.ids.push(q);
  } else if (section === "exact") {
    const colon = t.indexOf(":");
    const q = quoted(t);
    if (colon > 0 && q !== null) {
      cur.exact.push([t.slice(0, colon).trim(), q]);
    } else if (colon > 0 && t.endsWith(":")) {
      cur.exact.push([t.slice(0, colon).trim(), null]); // value on next line
    } else if (q !== null && cur.exact.length) {
      const last = cur.exact[cur.exact.length - 1];
      if (last[1] === null) last[1] = q;
    }
  }
}

let errors = 0;
for (const b of blocks) {
  if (b.ids.length < 3) {
    console.error("FAIL " + b.code + ": only " + b.ids.length + " quotes");
    errors++;
  }
  for (const id of b.ids) {
    const it = byId.get(id);
    if (!it) {
      console.error("FAIL " + b.code + ": unknown item " + id);
      errors++;
      continue;
    }
    if (!it.blocker_codes.includes(b.code)) {
      console.error("FAIL " + b.code + ": " + id + " is not tagged with this blocker");
      errors++;
    }
  }
  for (const pair of b.exact) {
    const it = byId.get(pair[0]);
    if (!it) {
      console.error("FAIL " + b.code + ": exact for unknown item " + pair[0]);
      errors++;
      continue;
    }
    if (!pair[1] || !norm(it.text).includes(norm(pair[1]))) {
      console.error("FAIL " + b.code + ": pinned quote for " + pair[0] + " is not verbatim");
      errors++;
    }
  }
}

console.log(
  errors === 0
    ? "check-evidence: OK - " + blocks.length + " blockers, all quotes real, correctly placed and verbatim"
    : "check-evidence: " + errors + " problem(s)"
);
process.exit(errors === 0 ? 0 : 1);
