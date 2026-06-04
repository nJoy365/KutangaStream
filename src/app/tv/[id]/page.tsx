import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { CastScroller } from "@/components/CastScroller";
import { ComingSoonBanner, isUpcoming } from "@/components/ComingSoonBanner";
import { EpisodePicker } from "@/components/EpisodePicker";
import { RatingBadge } from "@/components/RatingBadge";
import { Row } from "@/components/Row";
import { SaveButtons } from "@/components/SaveButtons";
import { SmartTvDefaultRedirect } from "@/components/SmartTvDefaultRedirect";
import { TrackContinueWatching } from "@/components/TrackContinueWatching";
import { TrailerButton } from "@/components/TrailerButton";
import { WatchPlayer } from "@/components/WatchPlayer";
import { backdropUrl } from "@/lib/images";
import { loadEmbedSources } from "@/lib/embedSourcesServer";
import { getSeasonEpisodes, getSimilar, getTvDetails } from "@/lib/tmdb";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) return {};
  const tv = await getTvDetails(id).catch(() => null);
  if (!tv) return {};
  const backdrop = backdropUrl(tv.backdropPath, "w1280");
  const titleWithYear = tv.releaseYear
    ? `${tv.title} (${tv.releaseYear})`
    : tv.title;
  return {
    title: titleWithYear,
    description: tv.overview,
    openGraph: {
      title: titleWithYear,
      description: tv.overview,
      type: "video.tv_show",
      images: backdrop ? [{ url: backdrop, alt: tv.title }] : [],
    },
  };
}

export default async function TvPage({ params, searchParams }: Props) {
  const { id: idParam } = await params;
  const sp = await searchParams;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) notFound();

  const tv = await getTvDetails(id).catch(() => null);
  if (!tv) notFound();

  const upcoming = isUpcoming(tv.releaseDate);
  const hasExplicitParams = Boolean(sp.season && sp.episode);

  const seasonNum = (() => {
    const n = sp.season ? parseInt(sp.season, 10) : NaN;
    if (Number.isFinite(n) && tv.seasons.some((s) => s.seasonNumber === n)) return n;
    return tv.seasons[0]?.seasonNumber ?? 1;
  })();
  const episodeNum = (() => {
    const n = sp.episode ? parseInt(sp.episode, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  // For unreleased shows we don't fetch episodes (none exist yet).
  const [episodes, similar, embedSources] = await Promise.all([
    upcoming ? Promise.resolve([]) : getSeasonEpisodes(id, seasonNum).catch(() => []),
    getSimilar("tv", id).catch(() => []),
    Promise.resolve(loadEmbedSources()),
  ]);

  const currentEpisode = episodes.find((e) => e.episodeNumber === episodeNum);
  const backdrop = backdropUrl(tv.backdropPath, "w1280");

  return (
    <div>
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
            type="tv"
            releaseDate={tv.releaseDate!}
            title={tv.title}
            posterPath={tv.posterPath}
            tagline={tv.tagline}
            overview={tv.overview}
            genres={tv.genres}
            certification={tv.certification}
            trailerKey={tv.trailerKey}
          />
        ) : (
          <WatchPlayer
            type="tv"
            tmdbId={tv.id}
            imdbId={tv.imdbId}
            season={seasonNum}
            episode={episodeNum}
            title={`${tv.title} S${seasonNum}E${episodeNum}`}
            sources={embedSources}
          />
        )}

        {!upcoming && (
          <div className="mt-6 grid lg:grid-cols-[1fr_400px] gap-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{tv.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)] mt-2">
                {tv.releaseYear && <span>{tv.releaseYear}</span>}
                <span>
                  {tv.numberOfSeasons} season{tv.numberOfSeasons === 1 ? "" : "s"} · {tv.numberOfEpisodes} episodes
                </span>
                {tv.voteAverage > 0 && (
                  <span className="text-[var(--color-accent)]">★ {tv.voteAverage.toFixed(1)}</span>
                )}
                {tv.certification && (
                  <RatingBadge code={tv.certification} type="tv" />
                )}
                {tv.genres.length > 0 && (
                  <span className="flex flex-wrap items-center gap-x-1.5">
                    {tv.genres.map((g, i) => (
                      <Fragment key={g.id}>
                        {i > 0 && <span className="text-zinc-600">·</span>}
                        <Link
                          href={`/genre/${g.id}?type=tv`}
                          className="hover:text-[var(--color-accent)] transition-colors"
                        >
                          {g.name}
                        </Link>
                      </Fragment>
                    ))}
                  </span>
                )}
              </div>

              {currentEpisode && (
                <div className="mt-4 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                    Now Playing · S{seasonNum} · E{episodeNum}
                  </p>
                  <h2 className="text-lg font-semibold text-white">{currentEpisode.name}</h2>
                  <p className="text-sm text-zinc-300 mt-1">{currentEpisode.overview}</p>
                </div>
              )}

              {tv.tagline && (
                <p className="mt-4 italic text-[var(--color-text-muted)]">“{tv.tagline}”</p>
              )}
              <p className="mt-4 text-base leading-relaxed text-zinc-200">{tv.overview}</p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <SaveButtons media={tv} />
                {tv.trailerKey && (
                  <TrailerButton youtubeKey={tv.trailerKey} title={tv.title} />
                )}
              </div>
            </div>

            <aside>
              <h2 className="text-lg font-semibold text-white mb-3">Episodes</h2>
              <EpisodePicker
                tvId={tv.id}
                seasons={tv.seasons}
                currentSeason={seasonNum}
                currentEpisode={episodeNum}
                episodes={episodes}
              />
            </aside>
          </div>
        )}

        {upcoming && (
          <div className="mt-6 flex justify-center md:justify-start">
            <SaveButtons media={tv} />
          </div>
        )}

        {!upcoming && tv.cast.length > 0 && (
          <div className="mt-10">
            <CastScroller cast={tv.cast} />
          </div>
        )}

        {similar.length > 0 && (
          <div className="mt-12 -mx-4 sm:-mx-6">
            <Row title="More Like This" items={similar} />
          </div>
        )}
      </div>

      {/* Skip the smart redirect + tracker for unreleased shows. */}
      {!upcoming && (
        <>
          <SmartTvDefaultRedirect tvId={tv.id} hasExplicitParams={hasExplicitParams} />
          <TrackContinueWatching
            media={tv}
            season={seasonNum}
            episode={episodeNum}
            hasExplicitParams={hasExplicitParams}
          />
        </>
      )}
    </div>
  );
}
