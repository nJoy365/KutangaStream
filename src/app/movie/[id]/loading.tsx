import { Skeleton, SkeletonRow } from "@/components/Skeleton";

export default function MovieLoading() {
  return (
    <div>
      <div className="relative h-64 md:h-80 -mt-16 pt-16 overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-bg)]/60 to-[var(--color-bg)]" />
      </div>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-32 relative">
        <Skeleton className="w-full aspect-video rounded-lg" />
        <div className="mt-6 grid md:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-3">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="mt-12 -mx-4 sm:-mx-6">
          <SkeletonRow title="More Like This" />
        </div>
      </div>
    </div>
  );
}
