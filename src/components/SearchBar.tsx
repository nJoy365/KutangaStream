"use client";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { posterUrl } from "@/lib/images";
import type { MediaSummary } from "@/lib/types";

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [results, setResults] = useState<MediaSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedValue = useDebounce(value, 250);

  // Fetch suggestions when the debounced query changes. Skipping the fetch
  // entirely for empty queries — the input's onChange handler is what clears
  // stale results on its own (see below), so this effect only ever runs for
  // real queries and never has a no-op early-return setState path.
  useEffect(() => {
    const q = debouncedValue.trim();
    if (!q) return;
    const controller = new AbortController();
    // Legitimate effect-driven loading state for an async network call —
    // the lint rule's escape hatch is appropriate here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: { results: MediaSummary[] }) => {
        setResults(data.results || []);
        setHighlight(-1);
      })
      .catch(() => {
        // Either an abort or network error — nothing to do.
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedValue]);

  // Close dropdown when clicking/tapping outside.
  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, []);

  function navigateTo(media: MediaSummary) {
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/${media.type}/${media.id}`);
  }

  function submitSearch() {
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setHighlight((h) => (h + 1) % results.length);
      setOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setHighlight((h) => (h <= 0 ? results.length - 1 : h - 1));
      setOpen(true);
    } else if (e.key === "Enter") {
      // If a suggestion is highlighted, jump to it. Otherwise submit search.
      if (open && highlight >= 0 && results[highlight]) {
        e.preventDefault();
        navigateTo(results[highlight]);
      } else {
        e.preventDefault();
        submitSearch();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  const showDropdown =
    open &&
    value.trim().length > 0 &&
    (loading || results.length > 0 || debouncedValue.trim().length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch();
        }}
        className="relative w-full"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            setOpen(true);
            // Empty input → clear stale results immediately so the dropdown
            // doesn't show last query's suggestions during the debounce window.
            if (!v.trim()) {
              setResults([]);
              setLoading(false);
            }
          }}
          onFocus={() => {
            if (value.trim()) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search movies & TV shows…"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
      </form>

      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute top-full mt-2 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-md bg-[var(--color-bg)]/95 backdrop-blur border border-[var(--color-border)] shadow-2xl z-50"
        >
          {loading && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-[var(--color-text-muted)]">
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-[var(--color-text-muted)]">
              No matches.
            </div>
          )}
          {results.map((r, i) => {
            const img = posterUrl(r.posterPath, "w185");
            const isHighlighted = i === highlight;
            return (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  // mousedown beats input blur — prevents the dropdown closing
                  // before the click registers
                  e.preventDefault();
                  navigateTo(r);
                }}
                className={`w-full flex items-center gap-3 px-2 py-2 text-left transition-colors ${
                  isHighlighted
                    ? "bg-[var(--color-surface)]"
                    : "hover:bg-[var(--color-surface)]"
                }`}
              >
                <div className="relative flex-shrink-0 w-8 h-12 rounded overflow-hidden bg-[var(--color-surface)]">
                  {img ? (
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white line-clamp-1">{r.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                    {[
                      r.type === "movie" ? "Movie" : "TV",
                      r.releaseYear,
                      r.voteAverage > 0 ? `★ ${r.voteAverage.toFixed(1)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </button>
            );
          })}
          {results.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                submitSearch();
              }}
              className="w-full px-3 py-2 text-xs text-[var(--color-accent)] border-t border-[var(--color-border)] hover:bg-[var(--color-surface)] text-left transition-colors"
            >
              See all results for &ldquo;{value.trim()}&rdquo; →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
