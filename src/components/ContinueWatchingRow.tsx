"use client";
import { useMemo } from "react";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { useLocalStorageJSON } from "@/hooks/useLocalStorageJSON";
import { useMediaBatch } from "@/hooks/useMediaBatch";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import {
  itemKey,
  progressFraction,
  progressKey,
  STORAGE_KEYS,
  type WatchedEpisodeKey,
} from "@/lib/storage";
import type { MediaSummary } from "@/lib/types";
import { Row } from "./Row";

const EMPTY_KEYS: WatchedEpisodeKey[] = [];

/**
 * Continue Watching is TV-only: we have no way to tell whether a movie was
 * actually watched (the iframe doesn't expose playback position), so movies
 * are filtered out entirely. For TV shows, we hide entries where every
 * episode of the show has been marked watched.
 */
export function ContinueWatchingRow() {
  const { items, hydrated } = useContinueWatching();
  const { value: watchedKeys } = useLocalStorageJSON<WatchedEpisodeKey[]>(
    STORAGE_KEYS.watchedEpisodes,
    EMPTY_KEYS,
  );

  const { progress } = useWatchProgress();

  // Only TV (defensive — Migrate strips legacy movie entries on boot).
  const tvItems = useMemo(() => items.filter((i) => i.type === "tv"), [items]);
  const { data } = useMediaBatch(tvItems);

  // tvId → how far into its current (last-opened) episode the user is.
  const progressByShow = useMemo(() => {
    const m = new Map<number, number>();
    for (const it of tvItems) {
      if (it.lastSeason && it.lastEpisode) {
        const frac = progressFraction(
          progress[progressKey("tv", it.id, it.lastSeason, it.lastEpisode)],
        );
        if (frac > 0) m.set(it.id, frac);
      }
    }
    return m;
  }, [tvItems, progress]);

  // Build a map of tvId → watched-episode count for this show.
  const watchedByShow = useMemo(() => {
    const m = new Map<number, number>();
    for (const k of watchedKeys) {
      const dash = k.indexOf("-");
      if (dash <= 0) continue;
      const tvId = parseInt(k.slice(0, dash), 10);
      if (!Number.isFinite(tvId)) continue;
      m.set(tvId, (m.get(tvId) ?? 0) + 1);
    }
    return m;
  }, [watchedKeys]);

  if (!hydrated || tvItems.length === 0) return null;

  // Drop shows whose metadata says everything's been watched. If episode
  // count isn't loaded yet, keep the show — better to show than hide while
  // the batch fetch is in flight.
  const summaries = tvItems
    .map((item) => {
      const meta = data.get(itemKey(item.type, item.id));
      if (!meta) return null;
      const watched = watchedByShow.get(item.id) ?? 0;
      const total = meta.episodeCount;
      if (total !== undefined && total > 0 && watched >= total) return null;
      return meta;
    })
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  if (summaries.length === 0) return null;
  return (
    <Row
      title="Continue Watching"
      items={summaries}
      progressFor={(m: MediaSummary) => progressByShow.get(m.id)}
    />
  );
}
