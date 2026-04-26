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
// genre (history page). Kept separate so MediaSummary itself stays minimal
// and doesn't conflict with the {id,name}[] shape used inside MovieDetails
// /TvDetails.
export interface MediaSummaryWithGenres extends MediaSummary {
  genres: string[];
}

export interface MovieDetails extends MediaSummary {
  type: "movie";
  imdbId: string | null;
  runtime: number | null;
  genres: { id: number; name: string }[];
  tagline: string | null;
}

export interface TvDetails extends MediaSummary {
  type: "tv";
  imdbId: string | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  genres: { id: number; name: string }[];
  tagline: string | null;
  seasons: SeasonSummary[];
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
