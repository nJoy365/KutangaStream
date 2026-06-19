"use client";
import {
  type ProgressMap,
  STORAGE_KEYS,
  type WatchProgress,
} from "@/lib/storage";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

const EMPTY: ProgressMap = {};

/** Reactive read of the whole progress map. */
export function useWatchProgress() {
  const { value, hydrated } = useLocalStorageJSON<ProgressMap>(
    STORAGE_KEYS.progress,
    EMPTY,
  );
  return { progress: value, hydrated };
}

/**
 * Merge a single entry into the progress map. Reads fresh from localStorage so
 * it's safe to call from outside React (e.g. a postMessage listener) without
 * worrying about stale closures.
 */
export function recordProgress(key: string, entry: WatchProgress): void {
  if (typeof window === "undefined") return;
  let map: ProgressMap = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.progress);
    if (raw) map = JSON.parse(raw) as ProgressMap;
  } catch {
    map = {};
  }
  map[key] = entry;
  writeLocalStorageJSON(STORAGE_KEYS.progress, map);
}

/** One-shot, non-reactive read of a single entry (for resume-on-load). */
export function readProgressEntry(key: string): WatchProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.progress);
    if (!raw) return null;
    const map = JSON.parse(raw) as ProgressMap;
    return map[key] ?? null;
  } catch {
    return null;
  }
}

/** Remove one entry (e.g. when an item is finished/cleared). */
export function clearProgress(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.progress);
    if (!raw) return;
    const map = JSON.parse(raw) as ProgressMap;
    if (key in map) {
      delete map[key];
      writeLocalStorageJSON(STORAGE_KEYS.progress, map);
    }
  } catch {
    // ignore
  }
}
