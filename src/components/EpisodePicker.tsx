"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useWatchedEpisodes } from "@/hooks/useWatchedEpisodes";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { stillUrl } from "@/lib/images";
import { progressFraction, progressKey } from "@/lib/storage";
import { isNew } from "@/lib/time";
import type { Episode, SeasonSummary } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";

interface Props {
  tvId: number;
  seasons: SeasonSummary[];
  currentSeason: number;
  currentEpisode: number;
  episodes: Episode[];
}

export function EpisodePicker({
  tvId,
  seasons,
  currentSeason,
  currentEpisode,
  episodes,
}: Props) {
  const router = useRouter();
  const { isWatched, toggle, setSeasonWatched, hydrated } =
    useWatchedEpisodes(tvId);
  const { progress } = useWatchProgress();
  const listRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLLIElement | null>(null);

  // Auto-scroll the picker so the current episode is visible. We compute the
  // offset manually and scroll only the list container — never the document —
  // because scrollIntoView({ block: "nearest" }) would otherwise scroll the
  // whole page when the picker isn't already in viewport (mobile, especially).
  useEffect(() => {
    const list = listRef.current;
    const el = activeRef.current;
    if (!list || !el) return;
    const offset = el.offsetTop - list.offsetTop - 8;
    list.scrollTop = Math.max(0, offset);
  }, [currentSeason, currentEpisode]);

  const watchedCount = useMemo(() => {
    if (!hydrated) return 0;
    return episodes.reduce(
      (acc, ep) =>
        acc + (isWatched(ep.seasonNumber, ep.episodeNumber) ? 1 : 0),
      0,
    );
  }, [episodes, isWatched, hydrated]);

  const allWatched = hydrated && watchedCount === episodes.length && episodes.length > 0;

  function bulkToggle() {
    const epNums = episodes.map((e) => e.episodeNumber);
    setSeasonWatched(currentSeason, epNums, !allWatched);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <label htmlFor="season" className="text-sm text-[var(--color-text-muted)]">
          Season
        </label>
        <select
          id="season"
          value={currentSeason}
          onChange={(e) => {
            const s = parseInt(e.target.value, 10);
            // Soft-navigate so the page doesn't reload from scratch and the
            // user's scroll position is preserved.
            router.push(`/tv/${tvId}?season=${s}&episode=1`, { scroll: false });
          }}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-3 h-9 text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
        >
          {seasons.map((s) => (
            <option key={s.seasonNumber} value={s.seasonNumber}>
              {s.name} ({s.episodeCount} ep)
            </option>
          ))}
        </select>
        {hydrated && episodes.length > 0 && (
          <span className="text-xs text-[var(--color-text-muted)] ml-auto">
            {watchedCount}/{episodes.length} watched
          </span>
        )}
      </div>

      {hydrated && episodes.length > 0 && (
        <button
          type="button"
          onClick={bulkToggle}
          className="mb-3 px-3 h-8 inline-flex items-center text-xs rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-white transition-colors"
        >
          {allWatched ? "Mark season unwatched" : "Mark season watched"}
        </button>
      )}

      <div
        ref={listRef}
        className="max-h-[70vh] overflow-y-auto pr-1 -mr-1"
      >
      <ul className="space-y-2">
        {episodes.map((ep) => {
          const active =
            ep.seasonNumber === currentSeason && ep.episodeNumber === currentEpisode;
          const watched = hydrated && isWatched(ep.seasonNumber, ep.episodeNumber);
          const still = stillUrl(ep.stillPath, "w300");
          // Resume bar — hidden once the episode is marked watched.
          const frac = progressFraction(
            progress[progressKey("tv", tvId, ep.seasonNumber, ep.episodeNumber)],
          );
          return (
            <li key={ep.id} ref={active ? activeRef : null}>
              <div
                className={`group flex gap-3 p-2 rounded-lg border transition-colors ${
                  active
                    ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/60"
                }`}
              >
                <Link
                  href={`/tv/${tvId}?season=${ep.seasonNumber}&episode=${ep.episodeNumber}`}
                  scroll={false}
                  className="flex gap-3 flex-1 min-w-0"
                >
                  <div className="relative flex-shrink-0 w-24 sm:w-32 aspect-video rounded overflow-hidden bg-black">
                    {still ? (
                      <Image
                        src={still}
                        alt={ep.name}
                        fill
                        sizes="128px"
                        className={`object-cover ${watched ? "opacity-50" : ""}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-muted)]">
                        E{ep.episodeNumber}
                      </div>
                    )}
                    <span className="absolute top-1 left-1 px-1 py-0.5 text-[10px] font-bold rounded bg-black/80 text-white">
                      {ep.episodeNumber}
                    </span>
                    {!watched && <ProgressBar fraction={frac} />}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <h3
                      className={`text-sm font-medium line-clamp-1 ${
                        watched ? "text-[var(--color-text-muted)]" : "text-white"
                      }`}
                    >
                      {ep.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      {ep.airDate && <span>{ep.airDate}</span>}
                      {ep.runtime ? <span>{ep.runtime}m</span> : null}
                      {isNew(ep.airDate) && (
                        <span className="px-1 py-0 text-[9px] font-bold uppercase rounded bg-emerald-500 text-white">
                          New
                        </span>
                      )}
                      {watched && <span className="text-[var(--color-accent)]">✓ Watched</span>}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mt-1">
                      {ep.overview}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(ep.seasonNumber, ep.episodeNumber)}
                  title={watched ? "Mark unwatched" : "Mark watched"}
                  className="flex-shrink-0 self-start px-2 h-7 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-white transition-colors"
                >
                  {watched ? "✓" : "○"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}
