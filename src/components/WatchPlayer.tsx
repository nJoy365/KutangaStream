"use client";
import { useEmbedSource } from "@/hooks/useEmbedSource";
import { useEmbedSources } from "@/hooks/useEmbedSources";
import { useSettings } from "@/hooks/useSettings";
import { buildEmbedSource, pickSource } from "@/lib/embedSources";
import { PlayerSurface } from "./PlayerSurface";

interface BaseProps {
  tmdbId: number;
  imdbId?: string | null;
  title?: string;
}

interface MovieProps extends BaseProps {
  type: "movie";
}

interface TvProps extends BaseProps {
  type: "tv";
  season: number;
  episode: number;
}

type Props = MovieProps | TvProps;

export function WatchPlayer(props: Props) {
  const { sourceId, setSourceId } = useEmbedSource();
  const { settings } = useSettings();
  const { sources: configs, ready } = useEmbedSources();

  if (!ready) {
    return (
      <div className="w-full aspect-video bg-[var(--color-surface)] rounded-lg animate-pulse" />
    );
  }

  if (configs.length === 0) {
    return (
      <div className="w-full aspect-video bg-[var(--color-surface)] rounded-lg flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-white font-medium">No embed sources configured</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Go to{" "}
          <a href="/settings" className="text-[var(--color-accent)] hover:underline">
            Settings → Embed sources
          </a>{" "}
          to add a provider.
        </p>
      </div>
    );
  }

  const sources = configs.map(buildEmbedSource);
  const source = pickSource(sources, sourceId);
  const ref = { tmdb: props.tmdbId, imdb: props.imdbId };
  const opts = settings.subtitleLanguage
    ? { dsLang: settings.subtitleLanguage }
    : undefined;
  const src =
    props.type === "movie"
      ? source.buildMovieUrl(ref, opts)
      : source.buildTvUrl(ref, props.season, props.episode, opts);

  return (
    <div>
      <PlayerSurface
        key={src}
        src={src}
        title={props.title}
        type={props.type}
        tmdbId={props.tmdbId}
        season={props.type === "tv" ? props.season : undefined}
        episode={props.type === "tv" ? props.episode : undefined}
      />
      <div className="mt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            Source
          </span>
          <span className="text-xs text-zinc-400">·</span>
          <span className="text-xs text-zinc-400">
            If a stream doesn&apos;t load, try another.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => {
            const active = s.id === source.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSourceId(s.id)}
                title={s.description}
                className={`px-3 h-8 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-zinc-300 hover:border-[var(--color-accent)] hover:text-white"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
