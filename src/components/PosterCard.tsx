import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/images";
import { isNew } from "@/lib/time";
import type { MediaSummary } from "@/lib/types";
import { isUpcoming } from "./ComingSoonBanner";
import { ProgressBar } from "./ProgressBar";
import { WatchProgress } from "./WatchProgress";

interface Props {
  media: MediaSummary;
  priority?: boolean;
  /** 0–1 watch progress for the current episode/movie; renders a bottom bar. */
  progress?: number;
}

export function PosterCard({ media, priority, progress }: Props) {
  const href = `/${media.type}/${media.id}`;
  const img = posterUrl(media.posterPath, "w342");
  const subText = media.releaseYear ?? "";
  const upcoming = isUpcoming(media.releaseDate);
  const releaseLabel =
    upcoming && media.releaseDate
      ? new Date(media.releaseDate).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

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
            className={`object-cover ${upcoming ? "grayscale opacity-60" : ""}`}
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
        {media.type === "tv" && !upcoming && <WatchProgress tvId={media.id} />}
        {progress !== undefined && !upcoming && <ProgressBar fraction={progress} />}
        {releaseLabel && (
          <div className="absolute inset-x-0 bottom-0 bg-black/85 px-2 py-1.5 text-center backdrop-blur-sm">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Coming Soon
            </span>
            <span className="block text-[11px] font-medium text-white">
              Releases {releaseLabel}
            </span>
          </div>
        )}
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
