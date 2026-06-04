"use client";
import { useEffect } from "react";
import type { EmbedSourceConfig } from "@/lib/embedSources";
import { STORAGE_KEYS } from "@/lib/storage";
import { useLocalStorageJSON, writeLocalStorageJSON } from "./useLocalStorageJSON";

function persist(sources: EmbedSourceConfig[]) {
  writeLocalStorageJSON(STORAGE_KEYS.embedSources, sources);
}

/**
 * Manages the user's embed source list from localStorage.
 * On first use (nothing stored yet) it seeds from /api/embed-sources which
 * reads the YAML config file. After that the user's list is authoritative.
 */
export function useEmbedSources() {
  // null = never initialized; [] = initialized but empty; [...] = configured
  const { value, hydrated } = useLocalStorageJSON<EmbedSourceConfig[] | null>(
    STORAGE_KEYS.embedSources,
    null,
  );

  useEffect(() => {
    if (!hydrated || value !== null) return;
    fetch("/api/embed-sources")
      .then((r) => r.json() as Promise<EmbedSourceConfig[]>)
      .then((data) => persist(data))
      .catch(() => persist([]));
  }, [hydrated, value]);

  const sources: EmbedSourceConfig[] = value ?? [];
  // "ready" only after hydration AND the seed fetch has resolved
  const ready = hydrated && value !== null;

  return {
    sources,
    ready,
    add(s: EmbedSourceConfig) {
      persist([...sources, s]);
    },
    update(id: string, s: EmbedSourceConfig) {
      persist(sources.map((x) => (x.id === id ? s : x)));
    },
    remove(id: string) {
      persist(sources.filter((x) => x.id !== id));
    },
    moveUp(id: string) {
      const i = sources.findIndex((x) => x.id === id);
      if (i <= 0) return;
      const next = [...sources];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      persist(next);
    },
    moveDown(id: string) {
      const i = sources.findIndex((x) => x.id === id);
      if (i < 0 || i >= sources.length - 1) return;
      const next = [...sources];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      persist(next);
    },
  };
}
