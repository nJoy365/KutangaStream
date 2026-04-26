import { NextResponse } from "next/server";
import { getMovieDetails, getTvDetails } from "@/lib/tmdb";
import type { MediaSummary } from "@/lib/types";

// Hydration endpoint used by the backup-import flow to re-derive a
// MediaSummary from a (type, id) pair. Server-side TMDB call, returns the
// minimum fields the UI needs to render saved items.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const { type, id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  try {
    if (type === "movie") {
      const m = await getMovieDetails(id);
      const summary: MediaSummary = {
        id: m.id,
        type: "movie",
        title: m.title,
        posterPath: m.posterPath,
        backdropPath: m.backdropPath,
        releaseYear: m.releaseYear,
        releaseDate: m.releaseDate,
        voteAverage: m.voteAverage,
        overview: m.overview,
      };
      return NextResponse.json(summary);
    }
    if (type === "tv") {
      const t = await getTvDetails(id);
      const summary: MediaSummary = {
        id: t.id,
        type: "tv",
        title: t.title,
        posterPath: t.posterPath,
        backdropPath: t.backdropPath,
        releaseYear: t.releaseYear,
        releaseDate: t.releaseDate,
        voteAverage: t.voteAverage,
        overview: t.overview,
      };
      return NextResponse.json(summary);
    }
    return NextResponse.json({ error: "bad type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
