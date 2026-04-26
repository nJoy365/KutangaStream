"use client";
import { useCallback } from "react";
import { itemKey, type MinimalRef, type SavedRef } from "@/lib/storage";
import type { MediaType } from "@/lib/types";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

const EMPTY: SavedRef[] = [];

export function useStoredList(storageKey: string) {
  const { value: items, hydrated } = useLocalStorageJSON<SavedRef[]>(
    storageKey,
    EMPTY,
  );

  const has = useCallback(
    (type: MediaType, id: number) =>
      items.some((it) => itemKey(it.type, it.id) === itemKey(type, id)),
    [items],
  );

  const add = useCallback(
    (ref: MinimalRef) => {
      if (items.some((it) => itemKey(it.type, it.id) === itemKey(ref.type, ref.id))) {
        return;
      }
      writeLocalStorageJSON(storageKey, [
        { type: ref.type, id: ref.id, savedAt: Date.now() },
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
    (ref: MinimalRef) => {
      if (has(ref.type, ref.id)) remove(ref.type, ref.id);
      else add(ref);
    },
    [add, remove, has],
  );

  return { items, has, add, remove, toggle, hydrated };
}
