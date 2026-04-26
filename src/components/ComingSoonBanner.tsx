import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/images";
import { relativeTime } from "@/lib/time";
import type { MediaType } from "@/lib/types";
import { RatingBadge } from "./RatingBadge";
import { TrailerButton } from "./TrailerButton";

interface Props {
  type: MediaType;
  releaseDate: string; // YYYY-MM-DD
  title: string;
  posterPath: string | null;
  tagline?: string | null;
  overview: string;
  genres: { id: number; name: string }[];
  certification?: string | null;
  trailerKey?: string | null;
}

export function ComingSoonBanner({
  type,
  releaseDate,
  title,
  posterPath,
  tagline,
  overview,
  genres,
  certification,
  trailerKey,
}: Props) {
  const date = new Date(releaseDate);
  const longDate = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const relative = relativeTime(date.getTime());
  const poster = posterUrl(posterPath, "w342");

  return (
    <div className="rounded-lg border border-[var(--color-accent)]/40 bg-gradient-to-br from-[var(--color-accent)]/15 via-[var(--color-surface)] to-[var(--color-surface)] p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
      {poster && (
        <div className="flex-shrink-0">
          <Image
            src={poster}
            alt={title}
            width={220}
            height={330}
            className="rounded-lg shadow-2xl"
          />
        </div>
      )}
      <div className="flex-1 min-w-0 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          Coming Soon
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 leading-tight">
          {title}
        </h2>
        <p className="text-lg md:text-xl text-zinc-200 mt-4">
          Premieres{" "}
          <span className="font-semibold text-white">{longDate}</span>{" "}
          <span className="text-[var(--color-text-muted)]">· {relative}</span>
        </p>
        {certification && (
          <div className="mt-3 flex justify-center md:justify-start">
            <RatingBadge code={certification} type={type} />
          </div>
        )}
        {tagline && (
          <p className="mt-5 italic text-[var(--color-text-muted)]">
            “{tagline}”
          </p>
        )}
        {overview && (
          <p className="mt-4 text-base leading-relaxed text-zinc-200">
            {overview}
          </p>
        )}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5 justify-center md:justify-start">
            {genres.map((g) => (
              <Link
                key={g.id}
                href={`/genre/${g.id}?type=${type}`}
                className="px-2 py-0.5 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-white transition-colors"
              >
                {g.name}
              </Link>
            ))}
          </div>
        )}
        {trailerKey && (
          <div className="mt-6 flex justify-center md:justify-start">
            <TrailerButton youtubeKey={trailerKey} title={title} />
          </div>
        )}
        <p className="text-xs text-[var(--color-text-muted)] mt-6 max-w-md mx-auto md:mx-0">
          Streaming may not be available on premiere day — check back if it
          doesn&apos;t play yet.
        </p>
      </div>
    </div>
  );
}

/** True if the date string represents a moment strictly in the future. */
export function isUpcoming(releaseDate: string | null | undefined): boolean {
  if (!releaseDate) return false;
  const t = Date.parse(releaseDate);
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}
