"use client";
import { useCallback } from "react";
import { itemKey, type SavedItem } from "@/lib/storage";
import type { MediaSummary, MediaType } from "@/lib/types";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

const EMPTY: SavedItem[] = [];

export function useStoredList(storageKey: string) {
  const { value: items, hydrated } = useLocalStorageJSON<SavedItem[]>(
    storageKey,
    EMPTY,
  );

  const has = useCallback(
    (type: MediaType, id: number) =>
      items.some((it) => itemKey(it.type, it.id) === itemKey(type, id)),
    [items],
  );

  const add = useCallback(
    (media: MediaSummary) => {
      if (items.some((it) => itemKey(it.type, it.id) === itemKey(media.type, media.id))) {
        return;
      }
      writeLocalStorageJSON(storageKey, [
        { ...media, savedAt: Date.now() },
        ...items,
      ]);
    },
    [items, storageKey],
  );

  const remove = useCallback(
    (type: MediaType, id: number) => {
      writeLocalStorageJSON(
        storageKey,
        items.filter((it) => itemKey(it.type, it.id) !== itemKey(type, id)),
      );
    },
    [items, storageKey],
  );

  const toggle = useCallback(
    (media: MediaSummary) => {
      if (has(media.type, media.id)) remove(media.type, media.id);
      else add(media);
    },
    [add, remove, has],
  );

  return { items, has, add, remove, toggle, hydrated };
}
