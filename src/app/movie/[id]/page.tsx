import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { CastScroller } from "@/components/CastScroller";
import { ComingSoonBanner, isUpcoming } from "@/components/ComingSoonBanner";
import { RatingBadge } from "@/components/RatingBadge";
import { Row } from "@/components/Row";
import { SaveButtons } from "@/components/SaveButtons";
import { TrackContinueWatching } from "@/components/TrackContinueWatching";
import { TrailerButton } from "@/components/TrailerButton";
import { WatchPlayer } from "@/components/WatchPlayer";
import { backdropUrl } from "@/lib/images";
import { loadEmbedSources } from "@/lib/embedSourcesServer";
import { getMovieDetails, getSimilar } from "@/lib/tmdb";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) return {};
  const movie = await getMovieDetails(id).catch(() => null);
  if (!movie) return {};
  const backdrop = backdropUrl(movie.backdropPath, "w1280");
  const titleWithYear = movie.releaseYear
    ? `${movie.title} (${movie.releaseYear})`
    : movie.title;
  return {
    title: titleWithYear,
    description: movie.overview,
    openGraph: {
      title: titleWithYear,
      description: movie.overview,
      type: "video.movie",
      images: backdrop ? [{ url: backdrop, alt: movie.title }] : [],
    },
  };
}

export default async function MoviePage({ params }: Props) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) notFound();

  const [movie, similar, embedSources] = await Promise.all([
    getMovieDetails(id).catch(() => null),
    getSimilar("movie", id).catch(() => []),
    Promise.resolve(loadEmbedSources()),
  ]);
  if (!movie) notFound();

  const backdrop = backdropUrl(movie.backdropPath, "w1280");
  const upcoming = isUpcoming(movie.releaseDate);

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
        {upcoming ? (
          <ComingSoonBanner
            type="movie"
            releaseDate={movie.releaseDate!}
            title={movie.title}
            posterPath={movie.posterPath}
            tagline={movie.tagline}
            overview={movie.overview}
            genres={movie.genres}
            certification={movie.certification}
            trailerKey={movie.trailerKey}
          />
        ) : (
          <WatchPlayer
            type="movie"
            tmdbId={movie.id}
            imdbId={movie.imdbId}
            title={movie.title}
            sources={embedSources}
          />
        )}

        {!upcoming && (
          <div className="mt-6 grid md:grid-cols-[1fr_280px] gap-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)] mt-2">
                {movie.releaseYear && <span>{movie.releaseYear}</span>}
                {movie.runtime ? <span>{movie.runtime} min</span> : null}
                {movie.voteAverage > 0 && (
                  <span className="text-[var(--color-accent)]">★ {movie.voteAverage.toFixed(1)}</span>
                )}
                {movie.certification && (
                  <RatingBadge code={movie.certification} type="movie" />
                )}
                {movie.genres.length > 0 && (
                  <span className="flex flex-wrap items-center gap-x-1.5">
                    {movie.genres.map((g, i) => (
                      <Fragment key={g.id}>
                        {i > 0 && <span className="text-zinc-600">·</span>}
                        <Link
                          href={`/genre/${g.id}?type=movie`}
                          className="hover:text-[var(--color-accent)] transition-colors"
                        >
                          {g.name}
                        </Link>
                      </Fragment>
                    ))}
                  </span>
                )}
              </div>
              {movie.tagline && (
                <p className="mt-4 italic text-[var(--color-text-muted)]">“{movie.tagline}”</p>
              )}
              <p className="mt-4 text-base leading-relaxed text-zinc-200">{movie.overview}</p>
              {movie.trailerKey && (
                <div className="mt-5">
                  <TrailerButton youtubeKey={movie.trailerKey} title={movie.title} />
                </div>
              )}
            </div>

            <aside className="space-y-3">
              <SaveButtons media={movie} />
            </aside>
          </div>
        )}

        {!upcoming && movie.cast.length > 0 && (
          <div className="mt-10">
            <CastScroller cast={movie.cast} />
          </div>
        )}

        {upcoming && (
          <div className="mt-6 flex justify-center md:justify-start">
            <SaveButtons media={movie} />
          </div>
        )}

        {similar.length > 0 && (
          <div className="mt-12 -mx-4 sm:-mx-6">
            <Row title="More Like This" items={similar} />
          </div>
        )}
      </div>

      {/* Don't track unreleased titles in continue watching / history. */}
      {!upcoming && <TrackContinueWatching media={movie} />}
    </div>
  );
}
