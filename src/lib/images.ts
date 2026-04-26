// TMDB image URL builder. See https://developers.themoviedb.org/3/configuration/get-api-configuration
// Common sizes: poster w92|w154|w185|w342|w500|w780|original
//               backdrop w300|w780|w1280|original
//               still w92|w185|w300|original

const IMG_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(
  path: string | null,
  size: "w185" | "w342" | "w500" | "w780" | "original" = "w342",
): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

export function backdropUrl(
  path: string | null,
  size: "w780" | "w1280" | "original" = "w1280",
): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

export function stillUrl(
  path: string | null,
  size: "w185" | "w300" | "original" = "w300",
): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

export function profileUrl(
  path: string | null,
  size: "w45" | "w185" | "h632" | "original" = "w185",
): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}
