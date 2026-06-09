"use client";
import { useCallback, useSyncExternalStore } from "react";

// Module-level cache so getSnapshot returns referentially stable values
// across renders when the underlying string hasn't changed. This is required
// for useSyncExternalStore to avoid infinite-loop warnings.
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readCached<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T;
  try {
    value = raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    value = fallback;
  }
  cache.set(key, { raw, value });
  return value;
}

function subscribe(callback: () => void) {
  function onStorage() {
    callback();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener("ks-storage-change", onStorage);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("ks-storage-change", onStorage);
  };
}

/**
 * Reactive read of a JSON-serialized localStorage key.
 * SSR-safe: returns `fallback` during server render and first client paint.
 * `hydrated` flips to true after mount so the consumer can distinguish
 * "loaded and empty" from "still hydrating".
 */
export function useLocalStorageJSON<T>(
  key: string,
  fallback: T,
): { value: T; hydrated: boolean } {
  const getSnapshot = useCallback(() => readCached<T>(key, fallback), [key, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // After first client render, useSyncExternalStore flips to client snapshot,
  // so we can mirror that with a constant true via the same hook system.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return { value, hydrated };
}

export function writeLocalStorageJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    cache.delete(key); // invalidate so next read parses fresh
    window.dispatchEvent(new Event("ks-storage-change"));
  } catch {
    // quota or storage disabled — silently ignore
  }
}
