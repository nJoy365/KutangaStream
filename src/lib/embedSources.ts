// Registry of third-party embed providers. None of these are hosted by us;
// they're just iframe URL builders. Quality + ad behavior varies — the picker
// lets users try alternatives when one source doesn't have a title or behaves
// poorly.
//
// All sources accept TMDB IDs as the primary key; some also accept IMDB IDs
// as a fallback (the `acceptsImdb` flag).

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

function withLang(url: string, opts?: EmbedOptions): string {
  if (!opts?.dsLang) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}ds_lang=${encodeURIComponent(opts.dsLang)}`;
}

export const EMBED_SOURCES: EmbedSource[] = [
  {
    id: "vsembed",
    name: "VSEmbed",
    description: "Default — vidsrc-embed.ru",
    buildMovieUrl: ({ tmdb }, opts) =>
      withLang(`https://vidsrc-embed.ru/embed/movie?tmdb=${tmdb}`, opts),
    buildTvUrl: ({ tmdb }, s, e, opts) =>
      withLang(
        `https://vidsrc-embed.ru/embed/tv?tmdb=${tmdb}&season=${s}&episode=${e}`,
        opts,
      ),
  },
  {
    id: "vidsrc-xyz",
    name: "VidSrc",
    description: "vidsrc.xyz — sister of VSEmbed, often a useful fallback",
    buildMovieUrl: ({ tmdb }, opts) =>
      withLang(`https://vidsrc.xyz/embed/movie?tmdb=${tmdb}`, opts),
    buildTvUrl: ({ tmdb }, s, e, opts) =>
      withLang(
        `https://vidsrc.xyz/embed/tv?tmdb=${tmdb}&season=${s}&episode=${e}`,
        opts,
      ),
  },
  {
    id: "vidsrc-to",
    name: "VidSrc.to",
    description: "Multi-server aggregator with selectable streams",
    buildMovieUrl: ({ tmdb }, opts) =>
      withLang(`https://vidsrc.to/embed/movie/${tmdb}`, opts),
    buildTvUrl: ({ tmdb }, s, e, opts) =>
      withLang(`https://vidsrc.to/embed/tv/${tmdb}/${s}/${e}`, opts),
  },
  {
    id: "embed-su",
    name: "Embed.su",
    description: "embed.su — fast, fewer overlays",
    buildMovieUrl: ({ tmdb }, opts) =>
      withLang(`https://embed.su/embed/movie/${tmdb}`, opts),
    buildTvUrl: ({ tmdb }, s, e, opts) =>
      withLang(`https://embed.su/embed/tv/${tmdb}/${s}/${e}`, opts),
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    description: "player.autoembed.cc",
    buildMovieUrl: ({ tmdb }, opts) =>
      withLang(`https://player.autoembed.cc/embed/movie/${tmdb}`, opts),
    buildTvUrl: ({ tmdb }, s, e, opts) =>
      withLang(`https://player.autoembed.cc/embed/tv/${tmdb}/${s}/${e}`, opts),
  },
  {
    id: "2embed",
    name: "2Embed",
    description: "2embed.cc",
    buildMovieUrl: ({ tmdb }, opts) =>
      withLang(`https://www.2embed.cc/embed/${tmdb}`, opts),
    buildTvUrl: ({ tmdb }, s, e, opts) =>
      withLang(`https://www.2embed.cc/embedtv/${tmdb}&s=${s}&e=${e}`, opts),
  },
  {
    id: "moviesapi",
    name: "MoviesAPI",
    description: "moviesapi.club",
    buildMovieUrl: ({ tmdb }, opts) =>
      withLang(`https://moviesapi.club/movie/${tmdb}`, opts),
    buildTvUrl: ({ tmdb }, s, e, opts) =>
      withLang(`https://moviesapi.club/tv/${tmdb}-${s}-${e}`, opts),
  },
];

export const DEFAULT_SOURCE_ID = EMBED_SOURCES[0].id;

export function getSource(id: string): EmbedSource {
  return EMBED_SOURCES.find((s) => s.id === id) ?? EMBED_SOURCES[0];
}
