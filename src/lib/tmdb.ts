import "server-only";
import type {
  Episode,
  MediaSummary,
  MovieDetails,
  SeasonSummary,
  TvDetails,
} from "./types";

const TMDB_BASE = "https://api.themoviedb.org/3";

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error("TMDB_API_KEY is not set in environment");
  }
  return key;
}

// Detect whether the user provided a v4 read-access token (a long JWT) or a v3
// API key (a 32-char hex string). v4 tokens go in an Authorization header,
// v3 keys go in the api_key query param.
function isV4Token(key: string): boolean {
  return key.length > 50 && key.includes(".");
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  revalidate = 60 * 30, // 30 minutes
): Promise<T> {
  const key = getApiKey();
  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = { accept: "application/json" };
  if (isV4Token(key)) {
    headers.authorization = `Bearer ${key}`;
  } else {
    url.searchParams.set("api_key", key);
  }
  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate },
  });
  if (!res.ok) {
    throw new Error(`TMDB ${res.status} for ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ---------- Mappers ----------

interface RawMedia {
  id: number;
  media_type?: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  overview: string;
}

function mapToSummary(raw: RawMedia, fallbackType?: "movie" | "tv"): MediaSummary {
  const type = raw.media_type ?? fallbackType ?? (raw.title ? "movie" : "tv");
  const date = raw.release_date || raw.first_air_date || null;
  return {
    id: raw.id,
    type,
    title: raw.title || raw.name || "Untitled",
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    releaseYear: date ? date.slice(0, 4) : null,
    voteAverage: raw.vote_average,
    overview: raw.overview,
  };
}

// ---------- Public API ----------

export async function getTrending(): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>("/trending/all/week");
  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => mapToSummary(r));
}

export async function getPopularMovies(): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>("/movie/popular");
  return data.results.map((r) => mapToSummary(r, "movie"));
}

export async function getTopRatedMovies(): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>("/movie/top_rated");
  return data.results.map((r) => mapToSummary(r, "movie"));
}

export async function getNowPlayingMovies(): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>("/movie/now_playing");
  return data.results.map((r) => mapToSummary(r, "movie"));
}

export async function getUpcomingMovies(): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>("/movie/upcoming");
  return data.results.map((r) => mapToSummary(r, "movie"));
}

export async function getPopularTv(): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>("/tv/popular");
  return data.results.map((r) => mapToSummary(r, "tv"));
}

export async function getTopRatedTv(): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>("/tv/top_rated");
  return data.results.map((r) => mapToSummary(r, "tv"));
}

export async function getOnTheAirTv(): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>("/tv/on_the_air");
  return data.results.map((r) => mapToSummary(r, "tv"));
}

export async function getAiringTodayTv(): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>("/tv/airing_today");
  return data.results.map((r) => mapToSummary(r, "tv"));
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  const data = await tmdbFetch<
    RawMedia & {
      imdb_id: string | null;
      runtime: number | null;
      genres: { id: number; name: string }[];
      tagline: string | null;
    }
  >(`/movie/${id}`);
  const summary = mapToSummary(data, "movie");
  return {
    ...summary,
    type: "movie",
    imdbId: data.imdb_id,
    runtime: data.runtime,
    genres: data.genres,
    tagline: data.tagline,
  };
}

export async function getTvDetails(id: number): Promise<TvDetails> {
  const data = await tmdbFetch<
    RawMedia & {
      number_of_seasons: number;
      number_of_episodes: number;
      genres: { id: number; name: string }[];
      tagline: string | null;
      external_ids?: { imdb_id: string | null };
      seasons: {
        id: number;
        season_number: number;
        name: string;
        episode_count: number;
        air_date: string | null;
        poster_path: string | null;
        overview: string;
      }[];
    }
  >(`/tv/${id}`, { append_to_response: "external_ids" });
  const summary = mapToSummary(data, "tv");
  const seasons: SeasonSummary[] = data.seasons
    .filter((s) => s.season_number >= 1) // skip "Specials" (season 0) for cleaner UI
    .map((s) => ({
      id: s.id,
      seasonNumber: s.season_number,
      name: s.name,
      episodeCount: s.episode_count,
      airDate: s.air_date,
      posterPath: s.poster_path,
      overview: s.overview,
    }));
  return {
    ...summary,
    type: "tv",
    imdbId: data.external_ids?.imdb_id ?? null,
    numberOfSeasons: data.number_of_seasons,
    numberOfEpisodes: data.number_of_episodes,
    genres: data.genres,
    tagline: data.tagline,
    seasons,
  };
}

export async function getSeasonEpisodes(
  tvId: number,
  seasonNumber: number,
): Promise<Episode[]> {
  const data = await tmdbFetch<{
    episodes: {
      id: number;
      season_number: number;
      episode_number: number;
      name: string;
      overview: string;
      air_date: string | null;
      runtime: number | null;
      still_path: string | null;
      vote_average: number;
    }[];
  }>(`/tv/${tvId}/season/${seasonNumber}`);
  return data.episodes.map((e) => ({
    id: e.id,
    seasonNumber: e.season_number,
    episodeNumber: e.episode_number,
    name: e.name,
    overview: e.overview,
    airDate: e.air_date,
    runtime: e.runtime,
    stillPath: e.still_path,
    voteAverage: e.vote_average,
  }));
}

export async function getSimilar(
  type: "movie" | "tv",
  id: number,
): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>(`/${type}/${id}/similar`);
  return data.results.map((r) => mapToSummary(r, type));
}

export async function searchMulti(query: string): Promise<MediaSummary[]> {
  if (!query.trim()) return [];
  const data = await tmdbFetch<{ results: RawMedia[] }>(
    "/search/multi",
    { query, include_adult: "false" },
    60, // shorter cache for search
  );
  return data.results
    .filter(
      (r) =>
        (r.media_type === "movie" || r.media_type === "tv") && r.poster_path,
    )
    .map((r) => mapToSummary(r));
}

