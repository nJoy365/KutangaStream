import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RatingBadge } from "@/components/RatingBadge";
import { Row } from "@/components/Row";
import {
  discoverByCertification,
  getLatestTvByContentRating,
  getPopularTvByContentRating,
  getTopRatedTvByContentRating,
} from "@/lib/tmdb";

export const revalidate = 1800;

interface Props {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ type?: string }>;
}

const MOVIE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17"] as const;
const TV_RATINGS = ["TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA"] as const;

function parseType(raw?: string): "movie" | "tv" {
  return raw === "tv" ? "tv" : "movie";
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { code } = await params;
  const { type: typeParam } = await searchParams;
  const type = parseType(typeParam);
  return {
    title: `${decodeURIComponent(code)} ${type === "movie" ? "Movies" : "TV"}`,
  };
}

export default async function RatingPage({ params, searchParams }: Props) {
  const { code: codeRaw } = await params;
  const { type: typeParam } = await searchParams;
  const code = decodeURIComponent(codeRaw);
  const type = parseType(typeParam);

  // Validate the code matches the type. Reject unknown combos so we don't
  // burn TMDB calls on garbage.
  const valid =
    type === "movie"
      ? MOVIE_RATINGS.includes(code as (typeof MOVIE_RATINGS)[number])
      : TV_RATINGS.includes(code as (typeof TV_RATINGS)[number]);
  if (!valid) notFound();

  const heading = `${code} ${type === "movie" ? "Movies" : "TV Shows"}`;
  const otherType = type === "movie" ? "tv" : "movie";

  let rows: { title: string; items: Awaited<ReturnType<typeof discoverByCertification>> }[];
  let note: string | null = null;

  if (type === "movie") {
    const today = new Date().toISOString().slice(0, 10);
    const [popular, topRated, latest] = await Promise.all([
      discoverByCertification(code, "popularity.desc"),
      discoverByCertification(code, "vote_average.desc", {
        "vote_count.gte": 200,
      }),
      discoverByCertification(code, "primary_release_date.desc", {
        "primary_release_date.lte": today,
      }),
    ]);
    rows = [
      { title: "Most Popular", items: popular },
      { title: "Top Rated", items: topRated },
      { title: "Latest Releases", items: latest },
    ];
  } else {
    // TV: TMDB has no native content-rating discover, so each row is a
    // post-filtered subset of a different upstream list (popular, top
    // rated, latest). The /content_ratings calls are cached for a day so
    // overlap between rows is mostly free after the first render.
    const [popular, topRated, latest] = await Promise.all([
      getPopularTvByContentRating(code),
      getTopRatedTvByContentRating(code),
      getLatestTvByContentRating(code),
    ]);
    rows = [
      { title: "Most Popular", items: popular },
      { title: "Top Rated", items: topRated },
      { title: "Latest Releases", items: latest },
    ];
    note =
      "TMDB doesn't expose a content-rating filter for TV, so each row is a post-filtered subset of an upstream list. Results may be incomplete for less common ratings.";
  }

  return (
    <div className="max-w-screen-2xl mx-auto py-6">
      <div className="px-4 sm:px-6 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <RatingBadge code={code} type={type} asLink={false} />
          {heading}
        </h1>
        <a
          href={`/rating/${encodeURIComponent(code)}?type=${otherType}`}
          className="text-xs px-3 h-8 inline-flex items-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-white transition-colors"
        >
          See {otherType === "tv" ? "TV shows" : "movies"}
        </a>
      </div>
      {note && (
        <p className="px-4 sm:px-6 -mt-2 mb-6 text-xs text-[var(--color-text-muted)]">
          {note}
        </p>
      )}
      {rows.map((r) => (
        <Row
          key={r.title}
          title={r.title}
          items={r.items}
          emptyMessage={
            type === "tv"
              ? `No ${code} shows found in the current popular set.`
              : undefined
          }
        />
      ))}
    </div>
  );
}
