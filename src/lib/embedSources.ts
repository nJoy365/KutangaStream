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

export interface EmbedSource {
  id: string;
  name: string;
  description?: string;
  buildMovieUrl(ref: MediaRef): string;
  buildTvUrl(ref: MediaRef, season: number, episode: number): string;
}

export const EMBED_SOURCES: EmbedSource[] = [
  {
    id: "vsembed",
    name: "VSEmbed",
    description: "Default — vidsrc-embed.ru",
    buildMovieUrl: ({ tmdb }) =>
      `https://vidsrc-embed.ru/embed/movie?tmdb=${tmdb}`,
    buildTvUrl: ({ tmdb }, s, e) =>
      `https://vidsrc-embed.ru/embed/tv?tmdb=${tmdb}&season=${s}&episode=${e}`,
  },
  {
    id: "vidsrc-xyz",
    name: "VidSrc",
    description: "vidsrc.xyz — sister of VSEmbed, often a useful fallback",
    buildMovieUrl: ({ tmdb }) => `https://vidsrc.xyz/embed/movie?tmdb=${tmdb}`,
    buildTvUrl: ({ tmdb }, s, e) =>
      `https://vidsrc.xyz/embed/tv?tmdb=${tmdb}&season=${s}&episode=${e}`,
  },
  {
    id: "vidsrc-to",
    name: "VidSrc.to",
    description: "Multi-server aggregator with selectable streams",
    buildMovieUrl: ({ tmdb }) => `https://vidsrc.to/embed/movie/${tmdb}`,
    buildTvUrl: ({ tmdb }, s, e) =>
      `https://vidsrc.to/embed/tv/${tmdb}/${s}/${e}`,
  },
  {
    id: "embed-su",
    name: "Embed.su",
    description: "embed.su — fast, fewer overlays",
    buildMovieUrl: ({ tmdb }) => `https://embed.su/embed/movie/${tmdb}`,
    buildTvUrl: ({ tmdb }, s, e) =>
      `https://embed.su/embed/tv/${tmdb}/${s}/${e}`,
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    description: "player.autoembed.cc",
    buildMovieUrl: ({ tmdb }) =>
      `https://player.autoembed.cc/embed/movie/${tmdb}`,
    buildTvUrl: ({ tmdb }, s, e) =>
      `https://player.autoembed.cc/embed/tv/${tmdb}/${s}/${e}`,
  },
  {
    id: "2embed",
    name: "2Embed",
    description: "2embed.cc",
    buildMovieUrl: ({ tmdb }) => `https://www.2embed.cc/embed/${tmdb}`,
    buildTvUrl: ({ tmdb }, s, e) =>
      `https://www.2embed.cc/embedtv/${tmdb}&s=${s}&e=${e}`,
  },
  {
    id: "moviesapi",
    name: "MoviesAPI",
    description: "moviesapi.club",
    buildMovieUrl: ({ tmdb }) => `https://moviesapi.club/movie/${tmdb}`,
    buildTvUrl: ({ tmdb }, s, e) =>
      `https://moviesapi.club/tv/${tmdb}-${s}-${e}`,
  },
];

export const DEFAULT_SOURCE_ID = EMBED_SOURCES[0].id;

export function getSource(id: string): EmbedSource {
  return EMBED_SOURCES.find((s) => s.id === id) ?? EMBED_SOURCES[0];
}
