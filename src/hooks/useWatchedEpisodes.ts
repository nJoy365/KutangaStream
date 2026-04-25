"use client";
import { useCallback, useMemo } from "react";
import {
  STORAGE_KEYS,
  watchedKey,
  type WatchedEpisodeKey,
} from "@/lib/storage";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

const EMPTY: WatchedEpisodeKey[] = [];

export function useWatchedEpisodes(tvId: number) {
  const { value: arr, hydrated } = useLocalStorageJSON<WatchedEpisodeKey[]>(
    STORAGE_KEYS.watchedEpisodes,
    EMPTY,
  );
  const set = useMemo(() => new Set(arr), [arr]);

  const isWatched = useCallback(
    (season: number, episode: number) =>
      set.has(watchedKey(tvId, season, episode)),
    [set, tvId],
  );

  const toggle = useCallback(
    (season: number, episode: number) => {
      const k = watchedKey(tvId, season, episode);
      const next = new Set(set);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      writeLocalStorageJSON(STORAGE_KEYS.watchedEpisodes, Array.from(next));
    },
    [set, tvId],
  );

  const markWatched = useCallback(
    (season: number, episode: number) => {
      const k = watchedKey(tvId, season, episode);
      if (set.has(k)) return;
      const next = new Set(set);
      next.add(k);
      writeLocalStorageJSON(STORAGE_KEYS.watchedEpisodes, Array.from(next));
    },
    [set, tvId],
  );

  return { isWatched, toggle, markWatched, hydrated };
}
