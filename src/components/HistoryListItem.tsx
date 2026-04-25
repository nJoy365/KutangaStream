"use client";
import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/images";
import type { WatchHistoryItem } from "@/lib/storage";
import { absoluteTime, relativeTime } from "@/lib/time";

interface Props {
  item: WatchHistoryItem;
  onRemove: () => void;
}

export function HistoryListItem({ item, onRemove }: Props) {
  const href =
    item.type === "tv" && item.season && item.episode
      ? `/tv/${item.id}?season=${item.season}&episode=${item.episode}`
      : `/${item.type}/${item.id}`;
  const img = posterUrl(item.posterPath, "w185");
  const isEpisode = item.type === "tv" && item.season && item.episode;

  return (
    <li className="flex gap-4 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/60 transition-colors group">
      <Link href={href} className="flex gap-4 flex-1 min-w-0">
        <div className="relative w-16 sm:w-20 aspect-[2/3] flex-shrink-0 rounded overflow-hidden bg-black">
          {img ? (
            <Image
              src={img}
              alt={item.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--color-text-muted)] p-1 text-center">
              {item.title}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="text-sm sm:text-base font-medium text-white line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
              {item.title}
            </h3>
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
              {item.type === "movie" ? "Movie" : "TV"}
            </span>
          </div>
          {isEpisode && (
            <p className="text-xs text-zinc-300 mt-0.5 line-clamp-1">
              S{item.season} · E{item.episode}
              {item.episodeName ? ` · ${item.episodeName}` : ""}
            </p>
          )}
          <p
            className="text-xs text-[var(--color-text-muted)] mt-1"
            title={absoluteTime(item.watchedAt)}
          >
            {relativeTime(item.watchedAt)}
          </p>
          {item.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.genres.slice(0, 4).map((g) => (
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
