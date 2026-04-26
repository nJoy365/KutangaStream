"use client";
import { useEffect } from "react";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { useWatchedEpisodes } from "@/hooks/useWatchedEpisodes";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import type { MinimalRef } from "@/lib/storage";

interface Props {
  media: MinimalRef;
  season?: number;
  episode?: number;
  /**
   * For TV pages: whether the URL had an explicit ?season=&episode= choice.
   * When false and a prior Continue Watching entry exists for this show,
   * SmartTvDefaultRedirect is about to redirect us — so we skip updating
   * Continue Watching / history with the default S1E1 we briefly rendered.
   */
  hasExplicitParams?: boolean;
}

// Side-effecting client component: pings continue-watching + history whenever a
// watch page mounts, and (for TV) marks the loaded episode as watched.
export function TrackContinueWatching({
  media,
  season,
  episode,
  hasExplicitParams = true,
}: Props) {
  const { items, upsert, hydrated: cwHydrated } = useContinueWatching();
  const { markWatched } = useWatchedEpisodes(media.type === "tv" ? media.id : -1);
  const { add: addHistory } = useWatchHistory();

  useEffect(() => {
    if (!cwHydrated) return;

    // If the user landed without explicit params and we already have a CW
    // entry pointing to a different episode, a redirect is about to take us
    // there — don't overwrite the saved progress with the default S1E1.
    if (media.type === "tv" && !hasExplicitParams && season && episode) {
      const existing = items.find(
        (i) => i.type === "tv" && i.id === media.id,
      );
      if (
        existing?.lastSeason &&
        existing?.lastEpisode &&
        (existing.lastSeason !== season || existing.lastEpisode !== episode)
      ) {
        return;
      }
    }

    if (media.type === "tv" && season && episode) {
      upsert(media, { season, episode });
      markWatched(season, episode);
    } else {
      upsert(media);
    }
    addHistory({
      type: media.type,
      id: media.id,
      ...(season ? { season } : {}),
      ...(episode ? { episode } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.type, media.id, season, episode, cwHydrated, hasExplicitParams]);

  return null;
}
