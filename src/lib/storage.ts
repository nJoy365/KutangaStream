// localStorage schema. The v2 entries store ONLY user actions — type, id,
// dates, season/episode for TV. Display metadata (titles, posters, genres,
// etc.) is fetched on demand from /api/media-batch and cached in sessionStorage.

import type { MediaType } from "./types";

// Active keys. Namespaced `ks.` (KutangaStream). Earlier builds used the `ms.`
// (MovieStreamer) prefix — those are renamed forward on first mount, see
// MS_PREFIX_KEYS + the prefix migration in <Migrate />.
export const STORAGE_KEYS = {
  // v2: minimal refs only
  watchlist: "ks.watchlist.v2",
  favorites: "ks.favorites.v2",
  continueWatching: "ks.continueWatching.v2",
  watchHistory: "ks.watchHistory.v2",
  // already minimal — unchanged
  watchedEpisodes: "ks.watchedEpisodes.v1",
  settings: "ks.settings.v1",
  embedSource: "ks.embedSource.v1",
  embedSources: "ks.embedSources.v1",
} as const;

// Previous `ms.`-prefixed names for the SAME logical keys above. Read once
// during the prefix migration and renamed to their `ks.` counterpart, then
// deleted. Order/keys must mirror STORAGE_KEYS.
export const MS_PREFIX_KEYS: Record<keyof typeof STORAGE_KEYS, string> = {
  watchlist: "ms.watchlist.v2",
  favorites: "ms.favorites.v2",
  continueWatching: "ms.continueWatching.v2",
  watchHistory: "ms.watchHistory.v2",
  watchedEpisodes: "ms.watchedEpisodes.v1",
  settings: "ms.settings.v1",
  embedSource: "ms.embedSource.v1",
  embedSources: "ms.embedSources.v1",
} as const;

// Both namespaces — used when scanning for "all app keys" (backup detection,
// clear-all) so residual `ms.` keys are still found.
export const STORAGE_PREFIXES = ["ks.", "ms."] as const;

// Legacy v1 keys (pre-refactor rich data) — only read once during migration,
// then deleted. These predate the prefix rename, so they stay `ms.`.
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
