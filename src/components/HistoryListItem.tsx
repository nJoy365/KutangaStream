"use client";
import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/images";
import type { WatchHistoryRef } from "@/lib/storage";
import { absoluteTime, relativeTime } from "@/lib/time";
import type { MediaSummaryWithGenres } from "@/lib/types";

interface Props {
  entry: WatchHistoryRef;
  media?: MediaSummaryWithGenres;
  onRemove: () => void;
}

export function HistoryListItem({ entry, media, onRemove }: Props) {
  const href =
    entry.type === "tv" && entry.season && entry.episode
      ? `/tv/${entry.id}?season=${entry.season}&episode=${entry.episode}`
      : `/${entry.type}/${entry.id}`;
  const img = media ? posterUrl(media.posterPath, "w185") : null;
  const title = media?.title ?? `${entry.type === "movie" ? "Movie" : "Show"} #${entry.id}`;
  const isEpisode = entry.type === "tv" && entry.season && entry.episode;

  return (
    <li className="flex gap-4 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/60 transition-colors group">
      <Link href={href} className="flex gap-4 flex-1 min-w-0">
        <div className="relative w-16 sm:w-20 aspect-[2/3] flex-shrink-0 rounded overflow-hidden bg-black">
          {img ? (
            <Image
              src={img}
              alt={title}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--color-text-muted)] p-1 text-center">
              {media ? title : "…"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="text-sm sm:text-base font-medium text-white line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
              {title}
            </h3>
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
              {entry.type === "movie" ? "Movie" : "TV"}
            </span>
          </div>
          {isEpisode && (
            <p className="text-xs text-zinc-300 mt-0.5 line-clamp-1">
              S{entry.season} · E{entry.episode}
            </p>
          )}
          <p
            className="text-xs text-[var(--color-text-muted)] mt-1"
            title={absoluteTime(entry.watchedAt)}
          >
            {relativeTime(entry.watchedAt)}
          </p>
          {media && media.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {media.genres.slice(0, 4).map((g) => (
                <span
                  key={g}
                  className="px-1.5 py-0.5 text-[10px] rounded border border-[var(--color-border)] text-[var(--color-text-muted)]"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
      <button
        type="button"
        onClick={onRemove}
        title="Remove from history"
        className="self-start flex-shrink-0 px-2 h-7 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-rose-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
      >
        ✕
      </button>
    </li>
  );
}
