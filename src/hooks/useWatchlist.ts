"use client";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStoredList } from "./useStoredList";

export function useWatchlist() {
  return useStoredList(STORAGE_KEYS.watchlist);
}
