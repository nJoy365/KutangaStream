"use client";
import { useEmbedSource } from "@/hooks/useEmbedSource";
import { EMBED_SOURCES, getSource } from "@/lib/embedSources";
import { Player } from "./Player";

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
  const source = getSource(sourceId);

  const ref = { tmdb: props.tmdbId, imdb: props.imdbId };
  const src =
    props.type === "movie"
      ? source.buildMovieUrl(ref)
      : source.buildTvUrl(ref, props.season, props.episode);

  return (
    <div>
      <Player src={src} title={props.title} />
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
          {EMBED_SOURCES.map((s) => {
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
