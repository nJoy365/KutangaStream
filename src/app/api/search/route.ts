import { NextResponse } from "next/server";
import { searchMulti } from "@/lib/tmdb";

// Typeahead search endpoint. Server-side TMDB call so the API key stays
// out of the client bundle.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  try {
    const results = await searchMulti(q);
    return NextResponse.json({ results: results.slice(0, 8) });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
