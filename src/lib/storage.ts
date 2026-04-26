// localStorage schema. The v2 entries store ONLY user actions — type, id,
// dates, season/episode for TV. Display metadata (titles, posters, genres,
// etc.) is fetched on demand from /api/media-batch and cached in sessionStorage.

import type { MediaType } from "./types";

export const STORAGE_KEYS = {
  // v2: minimal refs only
  watchlist: "ms.watchlist.v2",
  favorites: "ms.favorites.v2",
  continueWatching: "ms.continueWatching.v2",
  watchHistory: "ms.watchHistory.v2",
  // already minimal — unchanged
  watchedEpisodes: "ms.watchedEpisodes.v1",
  settings: "ms.settings.v1",
  embedSource: "ms.embedSource.v1",
} as const;

// Legacy v1 keys — only read once during migration, then deleted.
export const LEGACY_KEYS = {
  watchlist: "ms.watchlist.v1",
  favorites: "ms.favorites.v1",
  continueWatching: "ms.continueWatching.v1",
  watchHistory: "ms.watchHistory.v1",
} as const;

export interface MinimalRef {
  type: MediaType;
  id: number;
}

export interface SavedRef extends MinimalRef {
  savedAt: number;
}

export interface ContinueWatchingRef extends MinimalRef {
  updatedAt: number;
  lastSeason?: number;
  lastEpisode?: number;
}

export interface WatchHistoryRef extends MinimalRef {
  watchedAt: number;
  // For TV episodes
  season?: number;
  episode?: number;
}

export type WatchedEpisodeKey = `${number}-${number}-${number}`; // tvId-season-episode

export function watchedKey(
  tvId: number,
  season: number,
  episode: number,
): WatchedEpisodeKey {
  return `${tvId}-${season}-${episode}`;
}

// Compound key for movie/tv item identity in saved lists.
export function itemKey(type: MediaType, id: number): string {
  return `${type}:${id}`;
}
