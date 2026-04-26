"use client";
import Image from "next/image";
import Link from "next/link";
import { useWatchedEpisodes } from "@/hooks/useWatchedEpisodes";
import { stillUrl } from "@/lib/images";
import type { Episode, SeasonSummary } from "@/lib/types";

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
  const { isWatched, toggle, hydrated } = useWatchedEpisodes(tvId);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label htmlFor="season" className="text-sm text-[var(--color-text-muted)]">
          Season
        </label>
        <select
          id="season"
          value={currentSeason}
          onChange={(e) => {
            const s = parseInt(e.target.value, 10);
            window.location.href = `/tv/${tvId}?season=${s}&episode=1`;
          }}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-3 h-9 text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
        >
          {seasons.map((s) => (
            <option key={s.seasonNumber} value={s.seasonNumber}>
              {s.name} ({s.episodeCount} ep)
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {episodes.map((ep) => {
          const active =
            ep.seasonNumber === currentSeason && ep.episodeNumber === currentEpisode;
          const watched = hydrated && isWatched(ep.seasonNumber, ep.episodeNumber);
          const still = stillUrl(ep.stillPath, "w300");
          return (
            <li key={ep.id}>
              <div
                className={`group flex gap-3 p-2 rounded-lg border transition-colors ${
                  active
                    ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/60"
                }`}
              >
                <Link
                  href={`/tv/${tvId}?season=${ep.seasonNumber}&episode=${ep.episodeNumber}`}
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
  );
}
