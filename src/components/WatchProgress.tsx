"use client";
import { useMemo } from "react";
import { useLocalStorageJSON } from "@/hooks/useLocalStorageJSON";
import { STORAGE_KEYS, type WatchedEpisodeKey } from "@/lib/storage";

const EMPTY: WatchedEpisodeKey[] = [];

interface Props {
  tvId: number;
}

/**
 * Small overlay showing how many episodes of a TV show have been marked
 * watched. Renders nothing when the show has no watched episodes (or before
 * client hydration).
 */
export function WatchProgress({ tvId }: Props) {
  const { value: keys, hydrated } = useLocalStorageJSON<WatchedEpisodeKey[]>(
    STORAGE_KEYS.watchedEpisodes,
    EMPTY,
  );
  const prefix = `${tvId}-`;
  const count = useMemo(
    () => keys.reduce((acc, k) => acc + (k.startsWith(prefix) ? 1 : 0), 0),
    [keys, prefix],
  );
  if (!hydrated || count === 0) return null;
  return (
    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] font-semibold text-white bg-gradient-to-t from-black/85 to-transparent pointer-events-none">
      ✓ {count} watched
    </div>
  );
}
