import { SkeletonCard } from "@/components/Skeleton";

export default function SearchLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="h-8 w-64 bg-[var(--color-surface)] animate-pulse rounded mb-2" />
      <div className="h-4 w-32 bg-[var(--color-surface)] animate-pulse rounded mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
