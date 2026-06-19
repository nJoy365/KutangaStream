"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { useWatchedEpisodes } from "@/hooks/useWatchedEpisodes";
import type { SeasonSummary } from "@/lib/types";

interface Props {
  tvId: number;
  seasons: SeasonSummary[];
  /**
   * Whether the URL already contains an explicit ?season=&episode= choice.
   * When true, this component does nothing — we honor the user's selection.
   */
  hasExplicitParams: boolean;
}

/**
 * When the user opens /tv/[id] without season/episode, send them to the right
 * place based on their history:
 *  - last-opened episode NOT finished  → resume it (PlayerSurface seeks to the
 *    stored timestamp)
 *  - last-opened episode finished       → advance to the next unwatched episode
 *    in release order; if everything's watched, just reopen the last one.
 * Side-effecting only; renders nothing.
 */
export function SmartTvDefaultRedirect({ tvId, seasons, hasExplicitParams }: Props) {
  const router = useRouter();
  const { items, hydrated: cwHydrated } = useContinueWatching();
  const { isWatched, hydrated: weHydrated } = useWatchedEpisodes(tvId);

  useEffect(() => {
    if (hasExplicitParams || !cwHydrated || !weHydrated) return;
    const entry = items.find((i) => i.type === "tv" && i.id === tvId);
    if (!entry?.lastSeason || !entry?.lastEpisode) return;

    const { lastSeason, lastEpisode } = entry;
    let targetSeason = lastSeason;
    let targetEpisode = lastEpisode;

    // If the last-opened episode is finished, advance to the next unwatched one.
    if (isWatched(lastSeason, lastEpisode)) {
      const ordered = seasons
        .filter((s) => s.seasonNumber >= 1)
        .sort((a, b) => a.seasonNumber - b.seasonNumber)
        .flatMap((s) =>
          Array.from({ length: s.episodeCount }, (_, i) => ({
            season: s.seasonNumber,
            episode: i + 1,
          })),
        );
      const startIdx = ordered.findIndex(
        (e) => e.season === lastSeason && e.episode === lastEpisode,
      );
      const next = ordered
        .slice(startIdx + 1)
        .find((e) => !isWatched(e.season, e.episode));
      if (next) {
        targetSeason = next.season;
        targetEpisode = next.episode;
      }
    }

    router.replace(`/tv/${tvId}?season=${targetSeason}&episode=${targetEpisode}`);
  }, [cwHydrated, weHydrated, hasExplicitParams, items, isWatched, seasons, tvId, router]);

  return null;
}
