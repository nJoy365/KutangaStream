import { NextResponse } from "next/server";
import { itemKey } from "@/lib/storage";
import { getSimilar } from "@/lib/tmdb";
import type { MediaSummary, MediaType } from "@/lib/types";

interface InputItem {
  type: MediaType;
  id: number;
}

const MAX_INPUT = 20;
const MAX_OUTPUT = 24;

/**
 * Aggregates "similar" titles for a list of recently watched refs and ranks
 * them by frequency. Items in the input list are excluded from the output
 * (we don't recommend things you've already watched).
 *
 * Input is ~20 (type, id) pairs; we make one /similar call per pair, fan
 * out in parallel. TMDB caches the responses (default 30-min revalidate).
 */
export async function POST(req: Request) {
  let body: { items?: InputItem[] };
  try {
    body = (await req.json()) as { items?: InputItem[] };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  // Validate, dedupe, and cap.
  const seen = new Set<string>();
  const refs: InputItem[] = [];
  for (const it of body.items ?? []) {
    if (!it || (it.type !== "movie" && it.type !== "tv")) continue;
    if (!Number.isFinite(it.id)) continue;
    const k = itemKey(it.type, it.id);
    if (seen.has(k)) continue;
    seen.add(k);
    refs.push({ type: it.type, id: it.id });
    if (refs.length >= MAX_INPUT) break;
  }

  if (refs.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const similarLists = await Promise.all(
    refs.map((r) => getSimilar(r.type, r.id).catch(() => [] as MediaSummary[])),
  );

  // Score by appearance frequency across the union of /similar responses.
  const candidates = new Map<string, { item: MediaSummary; score: number }>();
  for (const list of similarLists) {
    for (const s of list) {
      const k = itemKey(s.type, s.id);
      if (seen.has(k)) continue; // already watched — exclude
      if (!s.posterPath) continue; // skip items with no poster (look broken)
      const existing = candidates.get(k);
      if (existing) existing.score += 1;
      else candidates.set(k, { item: s, score: 1 });
    }
  }

  const results = Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_OUTPUT)
    .map((c) => c.item);

  return NextResponse.json({ results });
}
