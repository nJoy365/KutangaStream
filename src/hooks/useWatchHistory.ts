"use client";
import { useCallback } from "react";
import { STORAGE_KEYS, type WatchHistoryItem } from "@/lib/storage";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

const MAX_ITEMS = 500;
const DEDUPE_WINDOW_MS = 60_000; // ignore re-mounts of the same page within 1 min
const EMPTY: WatchHistoryItem[] = [];

export function useWatchHistory() {
  const { value: items, hydrated } = useLocalStorageJSON<WatchHistoryItem[]>(
    STORAGE_KEYS.watchHistory,
    EMPTY,
  );

  const add = useCallback(
    (entry: Omit<WatchHistoryItem, "watchedAt"> & { watchedAt?: number }) => {
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
        return; // refresh / re-mount, don't double-log
      }
      const next: WatchHistoryItem = { ...entry, watchedAt: now };
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
