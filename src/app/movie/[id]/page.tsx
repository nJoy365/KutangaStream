import Image from "next/image";
import { notFound } from "next/navigation";
import { Row } from "@/components/Row";
import { SaveButtons } from "@/components/SaveButtons";
import { TrackContinueWatching } from "@/components/TrackContinueWatching";
import { WatchPlayer } from "@/components/WatchPlayer";
import { backdropUrl } from "@/lib/images";
import { getMovieDetails, getSimilar } from "@/lib/tmdb";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MoviePage({ params }: Props) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) notFound();

  const [movie, similar] = await Promise.all([
    getMovieDetails(id).catch(() => null),
    getSimilar("movie", id).catch(() => []),
  ]);
  if (!movie) notFound();

  const backdrop = backdropUrl(movie.backdropPath, "w1280");

  return (
    <div>
      {/* Backdrop hero */}
      <div className="relative h-64 md:h-80 -mt-16 pt-16 overflow-hidden">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            className="object-cover opacity-40"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-bg)]/60 to-[var(--color-bg)]" />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-32 relative">
        <WatchPlayer
          type="movie"
          tmdbId={movie.id}
          imdbId={movie.imdbId}
          title={movie.title}
        />

        <div className="mt-6 grid md:grid-cols-[1fr_280px] gap-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)] mt-2">
              {movie.releaseYear && <span>{movie.releaseYear}</span>}
              {movie.runtime ? <span>{movie.runtime} min</span> : null}
              {movie.voteAverage > 0 && (
                <span className="text-[var(--color-accent)]">★ {movie.voteAverage.toFixed(1)}</span>
              )}
              {movie.genres.length > 0 && (
                <span>{movie.genres.map((g) => g.name).join(" · ")}</span>
              )}
            </div>
            {movie.tagline && (
              <p className="mt-4 italic text-[var(--color-text-muted)]">“{movie.tagline}”</p>
            )}
            <p className="mt-4 text-base leading-relaxed text-zinc-200">{movie.overview}</p>
          </div>

          <aside className="space-y-3">
            <SaveButtons media={movie} />
          </aside>
        </div>

        {similar.length > 0 && (
          <div className="mt-12 -mx-4 sm:-mx-6">
            <Row title="More Like This" items={similar} />
          </div>
        )}
      </div>

      <TrackContinueWatching
        media={movie}
        genres={movie.genres.map((g) => g.name)}
      />
    </div>
  );
}
