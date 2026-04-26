"use client";
import { useCallback } from "react";
import {
  type MinimalRef,
  STORAGE_KEYS,
  type WatchHistoryRef,
} from "@/lib/storage";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

const MAX_ITEMS = 500;
const DEDUPE_WINDOW_MS = 60_000; // ignore re-mounts of the same page within 1 min
const EMPTY: WatchHistoryRef[] = [];

interface AddInput extends MinimalRef {
  watchedAt?: number;
  season?: number;
  episode?: number;
}

export function useWatchHistory() {
  const { value: items, hydrated } = useLocalStorageJSON<WatchHistoryRef[]>(
    STORAGE_KEYS.watchHistory,
    EMPTY,
  );

  const add = useCallback(
    (entry: AddInput) => {
      const now = entry.watchedAt ?? Date.now();
      const last = items[0];
      if (
        last &&
        last.type === entry.type &&
        last.id === entry.id &&
        last.season === entry.season &&
        last.episode === entry.episode &&
        now - last.watchedAt < DEDUPE_WINDOW_MS
      ) {
        return;
      }
      const next: WatchHistoryRef = {
        type: entry.type,
        id: entry.id,
        watchedAt: now,
        ...(entry.season ? { season: entry.season } : {}),
        ...(entry.episode ? { episode: entry.episode } : {}),
      };
      writeLocalStorageJSON(
        STORAGE_KEYS.watchHistory,
        [next, ...items].slice(0, MAX_ITEMS),
      );
    },
    [items],
  );

  const removeAt = useCallback(
    (index: number) => {
      writeLocalStorageJSON(
        STORAGE_KEYS.watchHistory,
        items.filter((_, i) => i !== index),
      );
    },
    [items],
  );

  const clear = useCallback(() => {
    writeLocalStorageJSON(STORAGE_KEYS.watchHistory, []);
  }, []);

  return { items, add, removeAt, clear, hydrated };
}
