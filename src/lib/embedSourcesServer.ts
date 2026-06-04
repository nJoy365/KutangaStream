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
 * Reads embed-sources.yaml from the project root (falls back to
 * embed-sources.example.yaml if the user hasn't created their own copy yet).
 * Result is cached per request via React cache().
 */
export const loadEmbedSources = cache((): EmbedSource[] => {
  const root = process.cwd();
  const customPath = path.join(root, "embed-sources.yaml");
  const examplePath = path.join(root, "embed-sources.example.yaml");
  const filePath = fs.existsSync(customPath) ? customPath : examplePath;
  const content = fs.readFileSync(filePath, "utf-8");
  const config = load(content) as YamlConfig;
  return (config?.sources ?? []).map(buildEmbedSource);
});
