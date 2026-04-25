"use client";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStoredList } from "./useStoredList";

export function useFavorites() {
  return useStoredList(STORAGE_KEYS.favorites);
}
