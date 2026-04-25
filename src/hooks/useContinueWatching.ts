"use client";
import { useCallback } from "react";
import {
  type ContinueWatchingItem,
  itemKey,
  STORAGE_KEYS,
} from "@/lib/storage";
import type { MediaSummary } from "@/lib/types";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

const MAX_ITEMS = 20;
const EMPTY: ContinueWatchingItem[] = [];

export function useContinueWatching() {
  const { value: items, hydrated } = useLocalStorageJSON<ContinueWatchingItem[]>(
    STORAGE_KEYS.continueWatching,
    EMPTY,
  );

  const upsert = useCallback(
    (media: MediaSummary, progress?: { season: number; episode: number }) => {
      const filtered = items.filter(
        (it) => itemKey(it.type, it.id) !== itemKey(media.type, media.id),
      );
      const entry: ContinueWatchingItem = {
        ...media,
        updatedAt: Date.now(),
        ...(progress
          ? { lastSeason: progress.season, lastEpisode: progress.episode }
          : {}),
      };
      writeLocalStorageJSON(
        STORAGE_KEYS.continueWatching,
        [entry, ...filtered].slice(0, MAX_ITEMS),
      );
    },
    [items],
  );

  const remove = useCallback(
    (type: MediaSummary["type"], id: number) => {
      writeLocalStorageJSON(
        STORAGE_KEYS.continueWatching,
        items.filter((it) => itemKey(it.type, it.id) !== itemKey(type, id)),
      );
    },
    [items],
  );

  return { items, upsert, remove, hydrated };
}
