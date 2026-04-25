"use client";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { Row } from "./Row";

export function ContinueWatchingRow() {
  const { items, hydrated } = useContinueWatching();
  if (!hydrated || items.length === 0) return null;
  return <Row title="Continue Watching" items={items} />;
}
