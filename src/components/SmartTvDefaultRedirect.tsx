"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useContinueWatching } from "@/hooks/useContinueWatching";

interface Props {
  tvId: number;
  /**
   * Whether the URL already contains an explicit ?season=&episode= choice.
   * When true, this component does nothing — we honor the user's selection.
   */
  hasExplicitParams: boolean;
}

/**
 * When the user opens /tv/[id] without specifying season/episode and they
 * have a "continue watching" entry for this show, redirect them to wherever
 * they left off. Side-effecting only; renders nothing.
 */
export function SmartTvDefaultRedirect({ tvId, hasExplicitParams }: Props) {
  const router = useRouter();
  const { items, hydrated } = useContinueWatching();

  useEffect(() => {
    if (hasExplicitParams || !hydrated) return;
    const entry = items.find((i) => i.type === "tv" && i.id === tvId);
    if (entry?.lastSeason && entry?.lastEpisode) {
      router.replace(
        `/tv/${tvId}?season=${entry.lastSeason}&episode=${entry.lastEpisode}`,
      );
    }
  }, [hydrated, hasExplicitParams, items, tvId, router]);

  return null;
}
