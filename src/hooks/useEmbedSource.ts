"use client";
import { useCallback } from "react";
import { DEFAULT_SOURCE_ID } from "@/lib/embedSources";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

const STORAGE_KEY = "ms.embedSource.v1";

export function useEmbedSource() {
  const { value: sourceId, hydrated } = useLocalStorageJSON<string>(
    STORAGE_KEY,
    DEFAULT_SOURCE_ID,
  );

  const setSourceId = useCallback((id: string) => {
    writeLocalStorageJSON(STORAGE_KEY, id);
  }, []);

  return { sourceId, setSourceId, hydrated };
}
