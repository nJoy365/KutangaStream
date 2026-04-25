"use client";
import { useEffect } from "react";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { useWatchedEpisodes } from "@/hooks/useWatchedEpisodes";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import type { MediaSummary } from "@/lib/types";

interface Props {
  media: MediaSummary;
  genres?: string[];
  season?: number;
  episode?: number;
  episodeName?: string;
}

// Side-effecting client component: pings continue-watching + history whenever a
// watch page mounts, and (for TV) marks the loaded episode as watched.
export function TrackContinueWatching({
  media,
  genres,
  season,
  episode,
  episodeName,
}: Props) {
  const { upsert } = useContinueWatching();
  const { markWatched } = useWatchedEpisodes(media.type === "tv" ? media.id : -1);
  const { add: addHistory } = useWatchHistory();

  useEffect(() => {
    if (media.type === "tv" && season && episode) {
      upsert(media, { season, episode });
      markWatched(season, episode);
    } else {
      upsert(media);
    }
    addHistory({
      ...media,
      genres: genres ?? [],
      ...(season ? { season } : {}),
      ...(episode ? { episode } : {}),
      ...(episodeName ? { episodeName } : {}),
    });
    // intentionally only re-fire when the identifying tuple changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.type, media.id, season, episode]);

  return null;
}
