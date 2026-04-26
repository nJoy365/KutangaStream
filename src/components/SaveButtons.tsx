"use client";
import { useToast } from "@/components/Toast";
import { useFavorites } from "@/hooks/useFavorites";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { MediaSummary } from "@/lib/types";

interface Props {
  media: MediaSummary;
}

export function SaveButtons({ media }: Props) {
  const watchlist = useWatchlist();
  const favorites = useFavorites();
  const { show } = useToast();

  const inWatchlist = watchlist.has(media.type, media.id);
  const inFavorites = favorites.has(media.type, media.id);

  function toggleWatchlist() {
    if (inWatchlist) {
      watchlist.remove(media.type, media.id);
      show("Removed from Watchlist");
    } else {
      watchlist.add(media);
      show("Added to Watchlist", "success");
    }
  }

  function toggleFavorites() {
    if (inFavorites) {
      favorites.remove(media.type, media.id);
      show("Removed from Favorites");
    } else {
      favorites.add(media);
      show("Added to Favorites", "success");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={toggleWatchlist}
        className={`flex items-center gap-2 px-4 h-10 rounded-md text-sm font-medium border transition-colors ${
          inWatchlist
            ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white"
            : "bg-[var(--color-surface)] border-[var(--color-border)] text-white hover:border-[var(--color-accent)]"
        }`}
      >
        <span aria-hidden>{inWatchlist ? "✓" : "+"}</span>
        {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
      </button>
      <button
        type="button"
        onClick={toggleFavorites}
        className={`flex items-center gap-2 px-4 h-10 rounded-md text-sm font-medium border transition-colors ${
          inFavorites
            ? "bg-rose-600 border-rose-600 text-white"
            : "bg-[var(--color-surface)] border-[var(--color-border)] text-white hover:border-rose-500"
        }`}
      >
        <span aria-hidden>{inFavorites ? "♥" : "♡"}</span>
        {inFavorites ? "Favorited" : "Favorite"}
      </button>
    </div>
  );
}
