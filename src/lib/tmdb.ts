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
    releaseDate: date,
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

/**
 * Shows premiering in the next ~90 days, sorted by popularity. TMDB has no
 * single "upcoming TV" endpoint — this synthesizes one via the discover
 * endpoint with a forward-looking first_air_date window.
 */
export async function getUpcomingTv(): Promise<MediaSummary[]> {
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const data = await tmdbFetch<{ results: RawMedia[] }>("/discover/tv", {
    "first_air_date.gte": today,
    "first_air_date.lte": horizon,
    sort_by: "popularity.desc",
    include_null_first_air_dates: "false",
  });
  return data.results.map((r) => mapToSummary(r, "tv"));
}

interface RawReleaseDates {
  results: {
    iso_3166_1: string;
    release_dates: { certification: string; type: number }[];
  }[];
}

interface RawContentRatings {
  results: { iso_3166_1: string; rating: string }[];
}

function pickUsCertification(rd: RawReleaseDates | undefined): string | null {
  if (!rd) return null;
  const us = rd.results.find((r) => r.iso_3166_1 === "US");
  if (!us) return null;
  for (const e of us.release_dates) {
    if (e.certification?.trim()) return e.certification.trim();
  }
  return null;
}

function pickUsContentRating(cr: RawContentRatings | undefined): string | null {
  if (!cr) return null;
  const us = cr.results.find((r) => r.iso_3166_1 === "US");
  return us?.rating?.trim() || null;
}

interface RawVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
  name: string;
}

function pickTrailerKey(
  videos: { results: RawVideo[] } | undefined,
): string | null {
  if (!videos?.results) return null;
  const yt = videos.results.filter((v) => v.site === "YouTube");
  // Prefer official trailer, then any trailer, then a teaser, then anything.
  return (
    yt.find((v) => v.type === "Trailer" && v.official)?.key ??
    yt.find((v) => v.type === "Trailer")?.key ??
    yt.find((v) => v.type === "Teaser")?.key ??
    yt[0]?.key ??
    null
  );
}

interface RawCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

function pickCast(
  credits: { cast: RawCastMember[] } | undefined,
  limit = 12,
): import("./types").CastMember[] {
  if (!credits?.cast) return [];
  return [...credits.cast]
    .sort((a, b) => a.order - b.order)
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
    }));
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  const data = await tmdbFetch<
    RawMedia & {
      imdb_id: string | null;
      runtime: number | null;
      genres: { id: number; name: string }[];
      tagline: string | null;
      release_dates?: RawReleaseDates;
      videos?: { results: RawVideo[] };
      credits?: { cast: RawCastMember[] };
    }
  >(`/movie/${id}`, {
    append_to_response: "release_dates,videos,credits",
  });
  const summary = mapToSummary(data, "movie");
  return {
    ...summary,
    type: "movie",
    imdbId: data.imdb_id,
    runtime: data.runtime,
    genres: data.genres,
    tagline: data.tagline,
    certification: pickUsCertification(data.release_dates),
    trailerKey: pickTrailerKey(data.videos),
    cast: pickCast(data.credits),
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
      content_ratings?: RawContentRatings;
      videos?: { results: RawVideo[] };
      credits?: { cast: RawCastMember[] };
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
  >(`/tv/${id}`, {
    append_to_response: "external_ids,content_ratings,videos,credits",
  });
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
    certification: pickUsContentRating(data.content_ratings),
    trailerKey: pickTrailerKey(data.videos),
    cast: pickCast(data.credits),
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

/**
 * Discover movies filtered by US certification (e.g. "PG-13", "R"). TMDB
 * supports this natively on /discover/movie via certification_country +
 * certification.
 */
export async function discoverByCertification(
  cert: string,
  sortBy: string,
  extra: Record<string, string | number> = {},
): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>("/discover/movie", {
    certification_country: "US",
    certification: cert,
    sort_by: sortBy,
    include_adult: "false",
    ...extra,
  });
  return data.results.map((r) => mapToSummary(r, "movie"));
}

type TvRatingSource = "popular" | "top_rated" | "latest";

/**
 * Internal helper. Fetches `pages` × ~20 candidate TV shows from a chosen
 * upstream list, then post-filters them by US content rating. Each show's
 * /content_ratings response is cached for 24h so subsequent rows for the
 * same show are free.
 *
 * TMDB doesn't expose content_rating as a /discover/tv filter — this
 * post-filter is the workaround. Results will be sparse for ratings that
 * don't appear often (TV-Y, TV-G) or in the less-popular tail (top_rated).
 */
async function tvByContentRatingFrom(
  rating: string,
  source: TvRatingSource,
  pages = 2,
): Promise<MediaSummary[]> {
  const today = new Date().toISOString().slice(0, 10);
  const path =
    source === "latest" ? "/discover/tv" : `/tv/${source}`;
  const baseParams: Record<string, string | number> =
    source === "latest"
      ? {
          sort_by: "first_air_date.desc",
          "first_air_date.lte": today,
          include_null_first_air_dates: "false",
        }
      : {};

  const responses = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      tmdbFetch<{ results: RawMedia[] }>(path, {
        ...baseParams,
        page: i + 1,
      }).catch(() => ({ results: [] as RawMedia[] })),
    ),
  );
  const candidates = responses.flatMap((r) => r.results);

  const ratings = await Promise.all(
    candidates.map(async (show) => {
      const cr = await tmdbFetch<RawContentRatings>(
        `/tv/${show.id}/content_ratings`,
        {},
        60 * 60 * 24,
      ).catch(() => ({ results: [] as RawContentRatings["results"] }));
      return { id: show.id, rating: pickUsContentRating(cr) };
    }),
  );

  const matched = new Set(
    ratings.filter((r) => r.rating === rating).map((r) => r.id),
  );
  // Preserve upstream order, dedupe (same show can appear across pages).
  const seen = new Set<number>();
  const result: MediaSummary[] = [];
  for (const c of candidates) {
    if (!matched.has(c.id) || seen.has(c.id)) continue;
    seen.add(c.id);
    result.push(mapToSummary(c, "tv"));
  }
  return result;
}

export function getPopularTvByContentRating(rating: string) {
  return tvByContentRatingFrom(rating, "popular");
}

export function getTopRatedTvByContentRating(rating: string) {
  return tvByContentRatingFrom(rating, "top_rated");
}

export function getLatestTvByContentRating(rating: string) {
  return tvByContentRatingFrom(rating, "latest");
}

export async function getGenres(
  type: "movie" | "tv",
): Promise<{ id: number; name: string }[]> {
  const data = await tmdbFetch<{ genres: { id: number; name: string }[] }>(
    `/genre/${type}/list`,
    {},
    60 * 60 * 24, // genre list is essentially static — cache for a day
  );
  return data.genres;
}

/**
 * Generic discover wrapper for genre-filtered browsing. `extra` lets callers
 * tack on `vote_count.gte` / date ranges / etc. without bloating the API.
 */
export async function discoverByGenre(
  type: "movie" | "tv",
  genreId: number,
  sortBy: string,
  extra: Record<string, string | number> = {},
): Promise<MediaSummary[]> {
  const data = await tmdbFetch<{ results: RawMedia[] }>(`/discover/${type}`, {
    with_genres: genreId,
    sort_by: sortBy,
    include_adult: "false",
    ...extra,
  });
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

