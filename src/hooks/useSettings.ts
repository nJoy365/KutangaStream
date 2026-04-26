"use client";
import { useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/storage";
import {
  useLocalStorageJSON,
  writeLocalStorageJSON,
} from "./useLocalStorageJSON";

export interface Settings {
  // ISO 639-1 language code passed to vsembed via ds_lang
  subtitleLanguage: string;
  // Default home page filter when no ?type= is provided
  defaultHomeFilter: "all" | "movie" | "tv";
}

export const DEFAULT_SETTINGS: Settings = {
  subtitleLanguage: "",
  defaultHomeFilter: "all",
};

export function useSettings() {
  const { value: settings, hydrated } = useLocalStorageJSON<Settings>(
    STORAGE_KEYS.settings,
    DEFAULT_SETTINGS,
  );

  const update = useCallback(
    (patch: Partial<Settings>) => {
      writeLocalStorageJSON(STORAGE_KEYS.settings, { ...settings, ...patch });
    },
    [settings],
  );

  return { settings, update, hydrated };
}
