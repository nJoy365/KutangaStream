import { PosterCard } from "@/components/PosterCard";
import { searchMulti } from "@/lib/tmdb";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const results = query ? await searchMulti(query).catch(() => []) : [];

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-1">
        {query ? `Results for “${query}”` : "Search"}
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        {query
          ? `${results.length} ${results.length === 1 ? "result" : "results"}`
          : "Type a query in the search bar above."}
      </p>
      {query && results.length === 0 && (
        <p className="text-[var(--color-text-muted)]">No matches found.</p>
      )}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((m) => (
            <PosterCard key={`${m.type}-${m.id}`} media={m} />
          ))}
        </div>
      )}
    </div>
  );
}
