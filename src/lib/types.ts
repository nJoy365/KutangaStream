export type MediaType = "movie" | "tv";

export interface MediaSummary {
  id: number;
  type: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  /** YYYY format. Convenience for display. */
  releaseYear: string | null;
  /** Full YYYY-MM-DD. Used for the "NEW" badge / recency checks. */
  releaseDate: string | null;
  voteAverage: number;
  overview: string;
}

// Returned by /api/media-batch — adds genre names for places that filter by
// genre (history page) and episodeCount for TV (so Continue Watching can
// hide shows you've finished). Kept separate so MediaSummary itself stays
// minimal and doesn't conflict with the {id,name}[] shape used inside
// MovieDetails / TvDetails.
export interface MediaSummaryWithGenres extends MediaSummary {
  genres: string[];
  /** TV only — total number of episodes across all seasons. */
  episodeCount?: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface MovieDetails extends MediaSummary {
  type: "movie";
  imdbId: string | null;
  runtime: number | null;
  genres: { id: number; name: string }[];
  tagline: string | null;
  /** US certification (G / PG / PG-13 / R / NC-17). Null if TMDB has none. */
  certification: string | null;
  /** YouTube video key for the best available trailer/teaser. */
  trailerKey: string | null;
  cast: CastMember[];
}

export interface TvDetails extends MediaSummary {
  type: "tv";
  imdbId: string | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  genres: { id: number; name: string }[];
  tagline: string | null;
  seasons: SeasonSummary[];
  /** US content rating (TV-Y / TV-Y7 / TV-G / TV-PG / TV-14 / TV-MA). */
  certification: string | null;
  trailerKey: string | null;
  cast: CastMember[];
}

export interface SeasonSummary {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  posterPath: string | null;
  overview: string;
}

export interface Episode {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string;
  airDate: string | null;
  runtime: number | null;
  stillPath: string | null;
  voteAverage: number;
}
