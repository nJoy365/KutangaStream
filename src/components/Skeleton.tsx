// Pulsing placeholder block. Used by loading.tsx files and inline.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--color-surface)] animate-pulse rounded ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-40 sm:w-44 md:w-48">
      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4 mt-2" />
      <Skeleton className="h-3 w-1/2 mt-1.5" />
    </div>
  );
}

export function SkeletonRow({ title = "Loading…" }: { title?: string }) {
  return (
    <section className="mb-10">
      <div className="px-4 sm:px-6 mb-3">
        <h2 className="text-xl font-bold text-white/40">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-hidden px-4 sm:px-6 pb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}
