"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { HistoryListItem } from "@/components/HistoryListItem";
import { useMediaBatch } from "@/hooks/useMediaBatch";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { itemKey } from "@/lib/storage";

type TypeFilter = "all" | "movie" | "tv";

function startOfDay(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export default function HistoryPage() {
  const { items, removeAt, clear, hydrated } = useWatchHistory();
  const { data: mediaMap } = useMediaBatch(items);

  const [titleQuery, setTitleQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [genreFilter, setGenreFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Derive genre options from the FETCHED metadata, deduped + sorted.
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    for (const m of mediaMap.values()) {
      for (const g of m.genres) set.add(g);
    }
    return Array.from(set).sort();
  }, [mediaMap]);

  const filtered = useMemo(() => {
    const q = titleQuery.trim().toLowerCase();
    const from = startOfDay(fromDate);
    const to = endOfDay(toDate);
    return items
      .map((entry, originalIndex) => ({
        entry,
        originalIndex,
        media: mediaMap.get(itemKey(entry.type, entry.id)),
      }))
      .filter(({ entry, media }) => {
        if (typeFilter !== "all" && entry.type !== typeFilter) return false;
        if (from && entry.watchedAt < from) return false;
        if (to && entry.watchedAt > to) return false;
        // Title and genre filters require fetched metadata. If metadata isn't
        // loaded yet for this entry, exclude it from filtered results when the
        // user has set those filters — but include it otherwise so it's still
        // visible while loading.
        if (q) {
          if (!media) return false;
          if (!media.title.toLowerCase().includes(q)) return false;
        }
        if (genreFilter) {
          if (!media) return false;
          if (!media.genres.includes(genreFilter)) return false;
        }
        return true;
      });
  }, [items, mediaMap, titleQuery, typeFilter, genreFilter, fromDate, toDate]);

  const hasFilters =
    Boolean(titleQuery) ||
    typeFilter !== "all" ||
    Boolean(genreFilter) ||
    Boolean(fromDate) ||
    Boolean(toDate);

  function clearFilters() {
    setTitleQuery("");
    setTypeFilter("all");
    setGenreFilter("");
    setFromDate("");
    setToDate("");
  }

  function handleClearAll() {
    if (window.confirm("Clear your entire watch history? This can't be undone.")) {
      clear();
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between mb-1 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Watch History</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {!hydrated
              ? "Loading…"
              : items.length === 0
                ? "Nothing watched yet."
                : hasFilters
                  ? `${filtered.length} of ${items.length} shown`
                  : `${items.length} ${items.length === 1 ? "entry" : "entries"}`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs px-3 h-8 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-rose-500 hover:text-rose-400 transition-colors"
          >
            Clear history
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-6 mb-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="search"
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            placeholder="Search title…"
            className="h-9 px-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] sm:col-span-2"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="h-9 px-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value="all">All types</option>
            <option value="movie">Movies</option>
            <option value="tv">TV</option>
          </select>
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value="">All genres</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 px-2 flex-1 min-w-0 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
              title="From date"
            />
            <span className="text-[var(--color-text-muted)] text-sm">→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 px-2 flex-1 min-w-0 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
              title="To date"
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-9 px-3 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-white transition-colors sm:col-span-2 lg:col-span-5 lg:w-fit"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {hydrated && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[var(--color-text-muted)] mb-4">
            Nothing here yet — open a movie or episode and it&apos;ll show up.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-5 h-10 rounded-md bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Browse now →
          </Link>
        </div>
      )}

      {hydrated && filtered.length === 0 && items.length > 0 && (
        <p className="text-[var(--color-text-muted)] mt-6">
          No entries match the current filters.
        </p>
      )}

      {filtered.length > 0 && (
        <ul className="space-y-2">
          {filtered.map(({ entry, originalIndex, media }) => (
            <HistoryListItem
              key={`${originalIndex}-${entry.watchedAt}`}
              entry={entry}
              media={media}
              onRemove={() => removeAt(originalIndex)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
