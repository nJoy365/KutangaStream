import { SkeletonRow } from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <div className="py-6 max-w-screen-2xl mx-auto">
      <div className="px-4 sm:px-6 mb-6 flex gap-2">
        <div className="w-20 h-9 bg-[var(--color-surface)] animate-pulse rounded-full" />
        <div className="w-24 h-9 bg-[var(--color-surface)] animate-pulse rounded-full" />
        <div className="w-28 h-9 bg-[var(--color-surface)] animate-pulse rounded-full" />
      </div>
      <SkeletonRow title="Trending This Week" />
      <SkeletonRow title="Now Playing" />
      <SkeletonRow title="Popular" />
      <SkeletonRow title="Top Rated" />
    </div>
  );
}
