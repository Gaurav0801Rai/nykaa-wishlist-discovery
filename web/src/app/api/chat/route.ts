import { NextResponse } from "next/server";
import { groqChat, GroqError } from "@/lib/groq.mjs";
import { buildSystemPrompt } from "@/lib/knowledge";
import classifiedRaw from "@/data/classified.json";
import type { ClassifiedItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TURNS = 12;
const MAX_CHARS = 2000;

type Msg = { role: "user" | "assistant"; content: string };

// Built once per server instance — grounding is static for the base corpus.
const SYSTEM = buildSystemPrompt(classifiedRaw as ClassifiedItem[]);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "Send { messages: [...] }." }, { status: 400 });
  }

  const messages: Msg[] = raw
    .filter(
      (m): m is Msg =>
        !!m &&
        (((m as Msg).role === "user") || ((m as Msg).role === "assistant")) &&
        typeof (m as Msg).content === "string"
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Ask a question to start." }, { status: 400 });
  }

  try {
    const reply = await groqChat([{ role: "system", content: SYSTEM }, ...messages]);
    return NextResponse.json({ reply });
  } catch (err) {
    const status = err instanceof GroqError ? err.status : 500;
    const message =
      err instanceof GroqError ? err.message : "Unexpected error. Please try again.";
    return NextResponse.json({ error: message }, { status });
  }
}
