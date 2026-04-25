"use client";
import { PosterCard } from "@/components/PosterCard";
import { useWatchlist } from "@/hooks/useWatchlist";

export default function WatchlistPage() {
  const { items, hydrated } = useWatchlist();

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-1">Your Watchlist</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        {hydrated ? `${items.length} saved` : "Loading…"}
      </p>
      {hydrated && items.length === 0 && (
        <p className="text-[var(--color-text-muted)]">
          Nothing saved yet. Click <span className="text-white">Add to Watchlist</span> on any title.
        </p>
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((m) => (
            <PosterCard key={`${m.type}-${m.id}`} media={m} />
          ))}
        </div>
      )}
    </div>
  );
}
