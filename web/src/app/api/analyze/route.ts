import { NextResponse } from "next/server";
import { classifyItems, GeminiError } from "@/lib/gemini.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ITEMS = 20;
const MAX_CHARS = 1500;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rawItems = (body as { items?: unknown })?.items;
  if (!Array.isArray(rawItems)) {
    return NextResponse.json({ error: "Paste 1–20 lines of feedback." }, { status: 400 });
  }

  const items = rawItems
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, MAX_ITEMS)
    .map((s) => s.slice(0, MAX_CHARS));

  if (items.length === 0) {
    return NextResponse.json({ error: "Paste at least one line of feedback." }, { status: 400 });
  }

  try {
    const results = await classifyItems(items);
    // Only results + count leave the server — no provider, model, or backend detail.
    return NextResponse.json({ count: results.length, results });
  } catch (err) {
    const status = err instanceof GeminiError ? err.status : 500;
    const message =
      err instanceof GeminiError ? err.message : "Unexpected error. Please try again.";
    return NextResponse.json({ error: message }, { status });
  }
}
