import "server-only";
import fs from "fs";
import path from "path";
import { load } from "js-yaml";
import { cache } from "react";
import {
  buildEmbedSource,
  EmbedSource,
  EmbedSourceConfig,
} from "./embedSources";

interface YamlConfig {
  sources: EmbedSourceConfig[];
}

/**
 * Reads embed-sources.yaml (falls back to embed-sources.example.yaml).
 * Returns raw config objects — serialisable, suitable for API responses.
 * Cached per request via React cache().
 */
export const loadEmbedSourceConfigs = cache((): EmbedSourceConfig[] => {
  const root = process.cwd();
  const customPath = path.join(root, "embed-sources.yaml");
  const examplePath = path.join(root, "embed-sources.example.yaml");
  const filePath = fs.existsSync(customPath) ? customPath : examplePath;
  const content = fs.readFileSync(filePath, "utf-8");
  const config = load(content) as YamlConfig;
  return config?.sources ?? [];
});

/** Built EmbedSource objects for use in server components. */
export const loadEmbedSources = cache((): EmbedSource[] =>
  loadEmbedSourceConfigs().map(buildEmbedSource),
);
