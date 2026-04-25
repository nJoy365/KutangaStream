// localStorage schema + safe helpers. All client-side; SSR returns empty defaults.

import type { MediaSummary, MediaType } from "./types";

export const STORAGE_KEYS = {
  watchlist: "ms.watchlist.v1",
  favorites: "ms.favorites.v1",
  continueWatching: "ms.continueWatching.v1",
  recentlyViewed: "ms.recentlyViewed.v1",
  watchedEpisodes: "ms.watchedEpisodes.v1",
  watchHistory: "ms.watchHistory.v1",
} as const;

export interface SavedItem extends MediaSummary {
  savedAt: number;
}

export interface ContinueWatchingItem extends MediaSummary {
  updatedAt: number;
  // For TV shows: where they left off
  lastSeason?: number;
  lastEpisode?: number;
}

export interface WatchHistoryItem extends MediaSummary {
  watchedAt: number;
  genres: string[];
  // For TV episodes
  season?: number;
  episode?: number;
  episodeName?: string;
}

export type WatchedEpisodeKey = `${number}-${number}-${number}`; // tvId-season-episode

export function watchedKey(
  tvId: number,
  season: number,
  episode: number,
): WatchedEpisodeKey {
  return `${tvId}-${season}-${episode}`;
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or storage disabled — silently ignore
  }
}

// Compound key for movie/tv item identity in saved lists.
export function itemKey(type: MediaType, id: number): string {
  return `${type}:${id}`;
}
