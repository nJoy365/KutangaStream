"use client";
import { useEffect, useMemo, useState } from "react";
import { itemKey, type MinimalRef } from "@/lib/storage";
import type { MediaSummaryWithGenres } from "@/lib/types";

const SESSION_PREFIX = "ks.cache.media.";

// Module-level mirror of the sessionStorage cache. Avoids hitting JSON.parse
// for every render and survives across hook instances within a tab.
const memCache = new Map<string, MediaSummaryWithGenres>();

function readCached(ref: MinimalRef): MediaSummaryWithGenres | null {
  const k = itemKey(ref.type, ref.id);
  const mem = memCache.get(k);
  if (mem) return mem;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_PREFIX + k);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MediaSummaryWithGenres;
    memCache.set(k, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeCached(summary: MediaSummaryWithGenres): void {
  const k = itemKey(summary.type, summary.id);
  memCache.set(k, summary);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_PREFIX + k, JSON.stringify(summary));
  } catch {
    // sessionStorage full or disabled — keep the in-memory mirror
  }
}

export interface MediaBatchResult {
  /** Map of `${type}:${id}` → MediaSummaryWithGenres for refs we resolved. */
  data: Map<string, MediaSummaryWithGenres>;
  /** True while any uncached refs are being fetched. */
  loading: boolean;
}

/**
 * Resolve metadata for a list of {type, id} refs. Cached refs render
 * synchronously (derived from sessionStorage / module cache via useMemo);
 * uncached refs trigger a single batched POST to /api/media-batch.
 */
export function useMediaBatch(refs: MinimalRef[]): MediaBatchResult {
  // Stable key so we re-derive only when the *set of refs* changes.
  const refsKey = refs.map((r) => itemKey(r.type, r.id)).sort().join(",");

  // What we already have from the cache. Recomputed when refs change OR when
  // a fetch completes (which writes new entries into the module cache).
  const [fetchTick, setFetchTick] = useState(0);
  const cached = useMemo(() => {
    const m = new Map<string, MediaSummaryWithGenres>();
    for (const r of refs) {
      const c = readCached(r);
      if (c) m.set(itemKey(r.type, r.id), c);
    }
    return m;
    // refs is captured via refsKey — fetchTick busts the memo after a fetch
    // resolves and writeCached updates the module cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsKey, fetchTick]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (refs.length === 0) return;
    // Compute missing here, not from `cached` (which lives in render scope and
    // we want this effect to depend only on refsKey).
    const missing: MinimalRef[] = [];
    for (const r of refs) {
      if (!readCached(r)) missing.push(r);
    }
    if (missing.length === 0) return;

    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch("/api/media-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: missing }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((j: { results: Record<string, MediaSummaryWithGenres> }) => {
        for (const v of Object.values(j.results || {})) writeCached(v);
        setFetchTick((t) => t + 1);
      })
      .catch(() => {
        // network error — keep whatever we had cached
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsKey]);

  return { data: cached, loading };
}
