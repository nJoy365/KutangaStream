import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Row } from "@/components/Row";
import { discoverByGenre, getGenres } from "@/lib/tmdb";

export const revalidate = 1800;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

function parseType(raw?: string): "movie" | "tv" {
  return raw === "tv" ? "tv" : "movie";
}

async function loadGenreName(
  type: "movie" | "tv",
  id: number,
): Promise<string | null> {
  const genres = await getGenres(type).catch(() => []);
  return genres.find((g) => g.id === id)?.name ?? null;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { id: idStr } = await params;
  const { type: typeParam } = await searchParams;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) return {};
  const type = parseType(typeParam);
  const name = await loadGenreName(type, id);
  if (!name) return {};
  return { title: `${name} ${type === "movie" ? "Movies" : "TV"}` };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const { id: idStr } = await params;
  const { type: typeParam } = await searchParams;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();
  const type = parseType(typeParam);
  const dateField =
    type === "movie" ? "primary_release_date" : "first_air_date";

  const today = new Date().toISOString().slice(0, 10);

  // Fan out the four discover calls plus the genre-name lookup in parallel.
  const [name, popular, topRated, latest] = await Promise.all([
    loadGenreName(type, id),
    discoverByGenre(type, id, "popularity.desc"),
    // vote_count.gte filters out obscure 10/10s with 2 ratings
    discoverByGenre(type, id, "vote_average.desc", { "vote_count.gte": 200 }),
    // Latest *released* — exclude future-dated entries
    discoverByGenre(type, id, `${dateField}.desc`, {
      [`${dateField}.lte`]: today,
    }),
  ]);

  if (!name) notFound();

  const heading = `${name} ${type === "movie" ? "Movies" : "TV Shows"}`;
  const otherType = type === "movie" ? "tv" : "movie";

  return (
    <div className="max-w-screen-2xl mx-auto py-6">
      <div className="px-4 sm:px-6 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{heading}</h1>
        <a
          href={`/genre/${id}?type=${otherType}`}
          className="text-xs px-3 h-8 inline-flex items-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-white transition-colors"
        >
          See {otherType === "tv" ? "TV shows" : "movies"}
        </a>
      </div>
      <Row title="Most Popular" items={popular} />
      <Row title="Top Rated" items={topRated} />
      <Row title="Latest Releases" items={latest} />
    </div>
  );
}
