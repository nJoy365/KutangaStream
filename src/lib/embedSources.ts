export interface MediaRef {
  tmdb: number;
  imdb?: string | null;
}

export interface EmbedOptions {
  /** ISO 639-1 subtitle language hint passed to providers that support it. */
  dsLang?: string;
}

export interface EmbedSource {
  id: string;
  name: string;
  description?: string;
  buildMovieUrl(ref: MediaRef, opts?: EmbedOptions): string;
  buildTvUrl(
    ref: MediaRef,
    season: number,
    episode: number,
    opts?: EmbedOptions,
  ): string;
}

/** Raw shape of each entry in embed-sources.yaml */
export interface EmbedSourceConfig {
  id: string;
  name: string;
  description?: string;
  /** URL template — supports {tmdb}, {imdb}, {season}, {episode} */
  movieUrl: string;
  /** URL template — supports {tmdb}, {imdb}, {season}, {episode} */
  tvUrl: string;
}

function interpolate(
  template: string,
  vars: Record<string, string | number | undefined | null>,
): string {
  return template.replace(
    /\{(\w+)\}/g,
    (_, key) => (vars[key] != null ? String(vars[key]) : ""),
  );
}

function withLang(url: string, opts?: EmbedOptions): string {
  if (!opts?.dsLang) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}ds_lang=${encodeURIComponent(opts.dsLang)}`;
}

export function buildEmbedSource(config: EmbedSourceConfig): EmbedSource {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    buildMovieUrl: ({ tmdb, imdb }, opts) =>
      withLang(interpolate(config.movieUrl, { tmdb, imdb }), opts),
    buildTvUrl: ({ tmdb, imdb }, season, episode, opts) =>
      withLang(
        interpolate(config.tvUrl, { tmdb, imdb, season, episode }),
        opts,
      ),
  };
}

/** Returns the source matching `id`, or the first source as fallback. */
export function pickSource(sources: EmbedSource[], id: string): EmbedSource {
  return sources.find((s) => s.id === id) ?? sources[0];
}
