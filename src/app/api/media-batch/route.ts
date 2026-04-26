import { NextResponse } from "next/server";
import { getMovieDetails, getTvDetails } from "@/lib/tmdb";
import { itemKey } from "@/lib/storage";
import type { MediaSummaryWithGenres, MediaType } from "@/lib/types";

interface BatchItem {
  type: MediaType;
  id: number;
}

// Cap the batch size so a corrupted request can't fan out to thousands of
// upstream TMDB calls.
const MAX_BATCH = 100;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items must be an array" }, { status: 400 });
  }

  // Filter + dedupe.
  const seen = new Set<string>();
  const refs: BatchItem[] = [];
  for (const it of items.slice(0, MAX_BATCH)) {
    if (
      it &&
      typeof it === "object" &&
      ((it as BatchItem).type === "movie" || (it as BatchItem).type === "tv") &&
      Number.isFinite((it as BatchItem).id)
    ) {
      const r = it as BatchItem;
      const k = itemKey(r.type, r.id);
      if (seen.has(k)) continue;
      seen.add(k);
      refs.push(r);
    }
  }

  // Fan out in parallel. Failures yield no entry — caller treats missing
  // results as "show a placeholder for this id."
  const results: Record<string, MediaSummaryWithGenres> = {};
  await Promise.all(
    refs.map(async (r) => {
      try {
        const d =
          r.type === "movie"
            ? await getMovieDetails(r.id)
            : await getTvDetails(r.id);
        results[itemKey(r.type, r.id)] = {
          id: d.id,
          type: r.type,
          title: d.title,
          posterPath: d.posterPath,
          backdropPath: d.backdropPath,
          releaseYear: d.releaseYear,
          releaseDate: d.releaseDate,
          voteAverage: d.voteAverage,
          overview: d.overview,
          genres: d.genres.map((g) => g.name),
          ...(d.type === "tv"
            ? { episodeCount: d.numberOfEpisodes }
            : {}),
        };
      } catch {
        // omitted — caller renders placeholder
      }
    }),
  );

  return NextResponse.json({ results });
}
