"use client";
import { useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/storage";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

export function useEmbedSource() {
  const { value: sourceId, hydrated } = useLocalStorageJSON<string>(
    STORAGE_KEYS.embedSource,
    "",
  );

  const setSourceId = useCallback((id: string) => {
    writeLocalStorageJSON(STORAGE_KEYS.embedSource, id);
  }, []);

  return { sourceId, setSourceId, hydrated };
}
