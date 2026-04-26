"use client";
import { useEffect, useState } from "react";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { itemKey } from "@/lib/storage";
import type { MediaSummary } from "@/lib/types";
import { Row } from "./Row";

const MIN_HISTORY = 5;
const MAX_INPUT = 20;

/**
 * Personalized "For You" row driven by watch history. Sends the most-recent
 * 20 history refs to /api/recommendations, which aggregates TMDB /similar
 * lookups and ranks by frequency. Hidden until enough history exists.
 */
export function ForYouRow() {
  const { items, hydrated } = useWatchHistory();
  const [recs, setRecs] = useState<MediaSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Build a stable key so we re-fetch only when the *set* of recent refs
  // changes, not on every render.
  const recent = items.slice(0, MAX_INPUT);
  const inputsKey = recent.map((i) => itemKey(i.type, i.id)).join(",");

  useEffect(() => {
    if (!hydrated || recent.length < MIN_HISTORY) return;
    const controller = new AbortController();
    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: recent.map((i) => ({ type: i.type, id: i.id })),
      }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d: { results: MediaSummary[] }) => {
        setRecs(d.results || []);
        setLoaded(true);
      })
      .catch(() => {
        // network error / abort — leave row hidden
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, inputsKey]);

  if (!hydrated || recent.length < MIN_HISTORY) return null;
  if (!loaded || recs.length === 0) return null;
  return <Row title="For You" items={recs} />;
}
