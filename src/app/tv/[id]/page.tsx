import Image from "next/image";
import { notFound } from "next/navigation";
import { EpisodePicker } from "@/components/EpisodePicker";
import { Row } from "@/components/Row";
import { SaveButtons } from "@/components/SaveButtons";
import { TrackContinueWatching } from "@/components/TrackContinueWatching";
import { WatchPlayer } from "@/components/WatchPlayer";
import { backdropUrl } from "@/lib/images";
import { getSeasonEpisodes, getSimilar, getTvDetails } from "@/lib/tmdb";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
}

export default async function TvPage({ params, searchParams }: Props) {
  const { id: idParam } = await params;
  const sp = await searchParams;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) notFound();

  const tv = await getTvDetails(id).catch(() => null);
  if (!tv) notFound();

  const seasonNum = (() => {
    const n = sp.season ? parseInt(sp.season, 10) : NaN;
    if (Number.isFinite(n) && tv.seasons.some((s) => s.seasonNumber === n)) return n;
    return tv.seasons[0]?.seasonNumber ?? 1;
  })();
  const episodeNum = (() => {
    const n = sp.episode ? parseInt(sp.episode, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  const [episodes, similar] = await Promise.all([
    getSeasonEpisodes(id, seasonNum).catch(() => []),
    getSimilar("tv", id).catch(() => []),
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
        <WatchPlayer
          type="tv"
          tmdbId={tv.id}
          imdbId={tv.imdbId}
          season={seasonNum}
          episode={episodeNum}
          title={`${tv.title} S${seasonNum}E${episodeNum}`}
        />

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
              {tv.genres.length > 0 && (
                <span>{tv.genres.map((g) => g.name).join(" · ")}</span>
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

            <div className="mt-6">
              <SaveButtons media={tv} />
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

        {similar.length > 0 && (
          <div className="mt-12 -mx-4 sm:-mx-6">
            <Row title="More Like This" items={similar} />
          </div>
        )}
      </div>

      <TrackContinueWatching
        media={tv}
        genres={tv.genres.map((g) => g.name)}
        season={seasonNum}
        episode={episodeNum}
        episodeName={currentEpisode?.name}
      />
    </div>
  );
}
