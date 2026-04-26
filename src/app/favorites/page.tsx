"use client";
import Link from "next/link";
import { PosterCard } from "@/components/PosterCard";
import { SkeletonCard } from "@/components/Skeleton";
import { useFavorites } from "@/hooks/useFavorites";
import { useMediaBatch } from "@/hooks/useMediaBatch";
import { itemKey } from "@/lib/storage";

export default function FavoritesPage() {
  const { items, hydrated } = useFavorites();
  const { data } = useMediaBatch(items);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-1">Favorites</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        {hydrated ? `${items.length} favorited` : "Loading…"}
      </p>
      {hydrated && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[var(--color-text-muted)] mb-4">
            No favorites yet. Tap the heart on any title to favorite it.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-5 h-10 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Browse now →
          </Link>
        </div>
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => {
            const meta = data.get(itemKey(item.type, item.id));
            const k = `${item.type}-${item.id}`;
            return meta ? (
              <PosterCard key={k} media={meta} />
            ) : (
              <SkeletonCard key={k} />
            );
          })}
        </div>
      )}
    </div>
  );
}
