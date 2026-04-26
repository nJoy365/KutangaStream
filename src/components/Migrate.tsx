"use client";
import { useEffect } from "react";
import {
  type ContinueWatchingRef,
  LEGACY_KEYS,
  type SavedRef,
  STORAGE_KEYS,
  type WatchHistoryRef,
} from "@/lib/storage";

// One-time migration from v1 (rich-data) localStorage to v2 (minimal refs).
// Reads each legacy key, strips down to the fields v2 needs, writes the v2
// key, then deletes the legacy key. Idempotent — if v2 already exists for a
// list, that list is skipped.
//
// This component renders nothing; it only runs the migration once on first
// client mount.

interface LegacyV1Item {
  type: "movie" | "tv";
  id: number;
  savedAt?: number;
  updatedAt?: number;
  watchedAt?: number;
  lastSeason?: number;
  lastEpisode?: number;
  season?: number;
  episode?: number;
}

function readLegacy<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function migrate(): void {
  // Watchlist
  if (!window.localStorage.getItem(STORAGE_KEYS.watchlist)) {
    const old = readLegacy<LegacyV1Item[]>(LEGACY_KEYS.watchlist);
    if (old && Array.isArray(old)) {
      const v2: SavedRef[] = old.map((i) => ({
        type: i.type,
        id: i.id,
        savedAt: i.savedAt ?? Date.now(),
      }));
      window.localStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify(v2));
    }
  }
  // Favorites
  if (!window.localStorage.getItem(STORAGE_KEYS.favorites)) {
    const old = readLegacy<LegacyV1Item[]>(LEGACY_KEYS.favorites);
    if (old && Array.isArray(old)) {
      const v2: SavedRef[] = old.map((i) => ({
        type: i.type,
        id: i.id,
        savedAt: i.savedAt ?? Date.now(),
      }));
      window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(v2));
    }
  }
  // Continue watching
  if (!window.localStorage.getItem(STORAGE_KEYS.continueWatching)) {
    const old = readLegacy<LegacyV1Item[]>(LEGACY_KEYS.continueWatching);
    if (old && Array.isArray(old)) {
      const v2: ContinueWatchingRef[] = old.map((i) => ({
        type: i.type,
        id: i.id,
        updatedAt: i.updatedAt ?? Date.now(),
        ...(i.lastSeason ? { lastSeason: i.lastSeason } : {}),
        ...(i.lastEpisode ? { lastEpisode: i.lastEpisode } : {}),
      }));
      window.localStorage.setItem(
        STORAGE_KEYS.continueWatching,
        JSON.stringify(v2),
      );
    }
  }
  // Watch history
  if (!window.localStorage.getItem(STORAGE_KEYS.watchHistory)) {
    const old = readLegacy<LegacyV1Item[]>(LEGACY_KEYS.watchHistory);
    if (old && Array.isArray(old)) {
      const v2: WatchHistoryRef[] = old.map((i) => ({
        type: i.type,
        id: i.id,
        watchedAt: i.watchedAt ?? Date.now(),
        ...(i.season ? { season: i.season } : {}),
        ...(i.episode ? { episode: i.episode } : {}),
      }));
      window.localStorage.setItem(
        STORAGE_KEYS.watchHistory,
        JSON.stringify(v2),
      );
    }
  }

  // Delete legacy keys now that v2 is populated.
  for (const k of Object.values(LEGACY_KEYS)) {
    window.localStorage.removeItem(k);
  }

  // Notify any mounted hooks so they re-read from v2 keys.
  window.dispatchEvent(new Event("ms-storage-change"));
}

export function Migrate() {
  useEffect(() => {
    try {
      migrate();
    } catch {
      // best-effort — bad localStorage shouldn't break the app
    }
  }, []);
  return null;
}

/**
 * Same migration logic, callable manually (e.g. after importing a legacy v1
 * backup file directly into the v1 keys). Safe to call any time.
 */
export function runMigration() {
  try {
    migrate();
  } catch {
    // ignore
  }
}
