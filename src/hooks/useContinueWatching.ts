"use client";
import { useCallback } from "react";
import {
  type ContinueWatchingRef,
  itemKey,
  type MinimalRef,
  STORAGE_KEYS,
} from "@/lib/storage";
import type { MediaType } from "@/lib/types";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

const MAX_ITEMS = 20;
const EMPTY: ContinueWatchingRef[] = [];

export function useContinueWatching() {
  const { value: items, hydrated } = useLocalStorageJSON<ContinueWatchingRef[]>(
    STORAGE_KEYS.continueWatching,
    EMPTY,
  );

  const upsert = useCallback(
    (ref: MinimalRef, progress?: { season: number; episode: number }) => {
      const filtered = items.filter(
        (it) => itemKey(it.type, it.id) !== itemKey(ref.type, ref.id),
      );
      const entry: ContinueWatchingRef = {
        type: ref.type,
        id: ref.id,
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
    (type: MediaType, id: number) => {
      writeLocalStorageJSON(
        STORAGE_KEYS.continueWatching,
        items.filter((it) => itemKey(it.type, it.id) !== itemKey(type, id)),
      );
    },
    [items],
  );

  return { items, upsert, remove, hydrated };
}
