import { cookies } from "next/headers";
import { Suspense } from "react";
import { ContinueWatchingRow } from "@/components/ContinueWatchingRow";
import { HomeFilterTabs, type HomeFilter } from "@/components/HomeFilterTabs";
import { Row } from "@/components/Row";
import {
  getAiringTodayTv,
  getNowPlayingMovies,
  getOnTheAirTv,
  getPopularMovies,
  getPopularTv,
  getTopRatedMovies,
  getTopRatedTv,
  getTrending,
  getUpcomingMovies,
} from "@/lib/tmdb";

export const revalidate = 1800; // 30 minutes

interface Props {
  searchParams: Promise<{ type?: string }>;
}

function parseFilter(raw?: string): HomeFilter {
  if (raw === "all" || raw === "movie" || raw === "tv") return raw;
  return "all";
}

export default async function Home({ searchParams }: Props) {
  const { type } = await searchParams;

  // If the user hasn't picked a filter via URL, honor the cookie set by the
  // settings page. URL takes precedence (so clicking "All" with type=all
  // overrides the cookie default).
  let filter: HomeFilter;
  if (type) {
    filter = parseFilter(type);
  } else {
    const cookieStore = await cookies();
    filter = parseFilter(cookieStore.get("ms_home_filter")?.value);
  }

  // Fan out only the rows the active filter needs.
  let rows: { title: string; itemsPromise: Promise<unknown[]> }[] = [];

  if (filter === "all") {
    rows = [
      { title: "Trending This Week", itemsPromise: getTrending() },
      { title: "Now Playing in Theaters", itemsPromise: getNowPlayingMovies() },
      { title: "On the Air", itemsPromise: getOnTheAirTv() },
      { title: "Popular TV Shows", itemsPromise: getPopularTv() },
      { title: "Top Rated Movies", itemsPromise: getTopRatedMovies() },
    ];
  } else if (filter === "movie") {
    rows = [
      { title: "Now Playing in Theaters", itemsPromise: getNowPlayingMovies() },
      { title: "Popular Movies", itemsPromise: getPopularMovies() },
      { title: "Top Rated Movies", itemsPromise: getTopRatedMovies() },
      { title: "Upcoming Movies", itemsPromise: getUpcomingMovies() },
    ];
  } else {
    rows = [
      { title: "Airing Today", itemsPromise: getAiringTodayTv() },
      { title: "On the Air", itemsPromise: getOnTheAirTv() },
      { title: "Popular TV Shows", itemsPromise: getPopularTv() },
      { title: "Top Rated TV", itemsPromise: getTopRatedTv() },
    ];
  }

  const resolved = await Promise.all(
    rows.map((r) =>
      r.itemsPromise
        .then((items) => ({ title: r.title, items }))
        .catch(() => ({ title: r.title, items: [] as unknown[] })),
    ),
  );

  const hasAny = resolved.some((r) => r.items.length > 0);

  if (!hasAny) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">No content loaded</h1>
        <p className="text-[var(--color-text-muted)]">
          Make sure your <code className="text-[var(--color-accent)]">TMDB_API_KEY</code> is set in
          <code className="text-[var(--color-accent)] mx-1">.env.local</code>
          and that you can reach api.themoviedb.org from this machine.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-screen-2xl mx-auto">
      <HomeFilterTabs current={filter} />
      <Suspense fallback={null}>
        <ContinueWatchingRow />
      </Suspense>
      {resolved.map((r) => (
        <Row
          key={r.title}
          title={r.title}
          // Type assertion: each fetcher returns MediaSummary[]; the union loses
          // that, so we narrow at the boundary.
          items={r.items as Parameters<typeof Row>[0]["items"]}
        />
      ))}
    </div>
  );
}
