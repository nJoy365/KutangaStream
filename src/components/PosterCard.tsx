import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/images";
import { isNew } from "@/lib/time";
import type { MediaSummary } from "@/lib/types";
import { WatchProgress } from "./WatchProgress";

interface Props {
  media: MediaSummary;
  priority?: boolean;
}

export function PosterCard({ media, priority }: Props) {
  const href = `/${media.type}/${media.id}`;
  const img = posterUrl(media.posterPath, "w342");
  const subText = media.releaseYear ?? "";

  return (
    <Link
      href={href}
      className="group fade-up flex-shrink-0 w-40 sm:w-44 md:w-48 transition-transform duration-200 hover:scale-[1.04]"
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] group-hover:border-[var(--color-accent)] transition-colors">
        {img ? (
          <Image
            src={img}
            alt={media.title}
            fill
            sizes="(max-width: 640px) 160px, (max-width: 768px) 176px, 192px"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-muted)] p-3 text-center">
            {media.title}
          </div>
        )}
        {media.voteAverage > 0 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-black/70 text-white backdrop-blur">
            ★ {media.voteAverage.toFixed(1)}
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[var(--color-accent)]/90 text-white">
            {media.type === "movie" ? "Movie" : "TV"}
          </span>
          {isNew(media.releaseDate) && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500 text-white">
              New
            </span>
          )}
        </div>
        {media.type === "tv" && <WatchProgress tvId={media.id} />}
      </div>
      <div className="mt-2 px-1">
        <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
          {media.title}
        </h3>
        {subText && (
          <p className="text-xs text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
            {subText}
          </p>
        )}
      </div>
    </Link>
  );
}
