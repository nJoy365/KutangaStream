"use client";
import { PosterCard } from "@/components/PosterCard";
import { useFavorites } from "@/hooks/useFavorites";

export default function FavoritesPage() {
  const { items, hydrated } = useFavorites();

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-1">Favorites</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        {hydrated ? `${items.length} favorited` : "Loading…"}
      </p>
      {hydrated && items.length === 0 && (
        <p className="text-[var(--color-text-muted)]">
          No favorites yet. Tap the heart on any title to favorite it.
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
