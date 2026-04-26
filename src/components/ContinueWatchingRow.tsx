"use client";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { useMediaBatch } from "@/hooks/useMediaBatch";
import { itemKey } from "@/lib/storage";
import { Row } from "./Row";

export function ContinueWatchingRow() {
  const { items, hydrated } = useContinueWatching();
  const { data } = useMediaBatch(items);
  if (!hydrated || items.length === 0) return null;

  // Preserve the order of CW entries (most recent first); drop any whose
  // metadata hasn't fetched yet rather than show placeholders in a row.
  const summaries = items
    .map((i) => data.get(itemKey(i.type, i.id)))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  if (summaries.length === 0) return null;

  return <Row title="Continue Watching" items={summaries} />;
}
