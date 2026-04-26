"use client";
import { useRef, useState } from "react";
import { runMigration } from "@/components/Migrate";
import { useToast } from "@/components/Toast";
import { useSettings, type Settings } from "@/hooks/useSettings";
import {
  type BackupEnvelope,
  decodeBackup,
  encodeBackup,
} from "@/lib/backup";
import { STORAGE_KEYS } from "@/lib/storage";

// Curated set of common subtitle languages. Empty value = let the player
// pick its own default. ISO 639-1 codes.
const LANGUAGES: { code: string; label: string }[] = [
  { code: "", label: "Auto / off" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "pl", label: "Polish" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "tr", label: "Turkish" },
  { code: "nl", label: "Dutch" },
  { code: "sv", label: "Swedish" },
  { code: "da", label: "Danish" },
  { code: "fi", label: "Finnish" },
  { code: "no", label: "Norwegian" },
  { code: "cs", label: "Czech" },
];

const STORAGE_PREFIX = "ms.";

// Inner payload shape (what gets gzipped into the envelope). All entries are
// minimal refs only — display metadata is re-fetched on demand at render time.
interface BackupPayload {
  watchlist?: unknown;
  favorites?: unknown;
  continueWatching?: unknown;
  watchHistory?: unknown;
  watchedEpisodes?: unknown;
  settings?: unknown;
  embedSource?: unknown;
}

function readJSON(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function collectPayload(): BackupPayload {
  return {
    watchlist: readJSON(STORAGE_KEYS.watchlist),
    favorites: readJSON(STORAGE_KEYS.favorites),
    continueWatching: readJSON(STORAGE_KEYS.continueWatching),
    watchHistory: readJSON(STORAGE_KEYS.watchHistory),
    watchedEpisodes: readJSON(STORAGE_KEYS.watchedEpisodes),
    settings: readJSON(STORAGE_KEYS.settings),
    embedSource: readJSON(STORAGE_KEYS.embedSource),
  };
}

function hasExistingData(): boolean {
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) return true;
  }
  return false;
}

function confirmOverwrite(): boolean {
  if (!hasExistingData()) return true;
  return window.confirm(
    "Importing will REPLACE your current watchlist, favorites, history, watched episodes, and settings with the contents of the backup.\n\nContinue?",
  );
}

/** Apply a v2 backup payload — write each key directly to localStorage. */
function applyV2Payload(payload: BackupPayload): number {
  const writes: [string, unknown][] = [
    [STORAGE_KEYS.watchlist, payload.watchlist],
    [STORAGE_KEYS.favorites, payload.favorites],
    [STORAGE_KEYS.continueWatching, payload.continueWatching],
    [STORAGE_KEYS.watchHistory, payload.watchHistory],
    [STORAGE_KEYS.watchedEpisodes, payload.watchedEpisodes],
    [STORAGE_KEYS.settings, payload.settings],
    [STORAGE_KEYS.embedSource, payload.embedSource],
  ];
  let count = 0;
  for (const [k, v] of writes) {
    if (v === undefined) continue;
    window.localStorage.setItem(k, JSON.stringify(v));
    count++;
  }
  window.dispatchEvent(new Event("ms-storage-change"));
  return count;
}

/** Apply a legacy v1 backup (rich data keyed by ms.*.v1) — write keys then
 *  let the migration logic strip them down to v2 minimal form. */
function applyV1Payload(data: Record<string, unknown>): number {
  let count = 0;
  for (const [k, v] of Object.entries(data)) {
    if (!k.startsWith(STORAGE_PREFIX)) continue;
    window.localStorage.setItem(k, JSON.stringify(v));
    count++;
  }
  // Rip the v1 rich data down to the v2 minimal shape.
  runMigration();
  window.dispatchEvent(new Event("ms-storage-change"));
  return count;
}

async function applyBackup(parsed: unknown): Promise<number> {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid backup file.");
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.app !== "KutangaStream") {
    throw new Error("Not a KutangaStream backup.");
  }

  if (!confirmOverwrite()) return 0;

  // v2: gzip+base64 envelope
  if (obj.version === 2 && typeof obj.data === "string") {
    const payload = await decodeBackup<BackupPayload>(obj as unknown as BackupEnvelope);
    return applyV2Payload(payload);
  }
  // v1: legacy rich-data envelope
  if (obj.version === 1 && obj.data && typeof obj.data === "object") {
    return applyV1Payload(obj.data as Record<string, unknown>);
  }
  throw new Error("Unknown backup version.");
}

/**
 * Copy text to clipboard. Tries the modern API first; falls back to a hidden
 * textarea + execCommand for non-secure contexts (HTTP on a LAN IP, where
 * navigator.clipboard is unavailable).
 */
async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy path
    }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function SettingsPage() {
  const { settings, update, hydrated } = useSettings();
  const { show } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");

  async function downloadBackup() {
    const envelope = await encodeBackup(collectPayload());
    const blob = new Blob([JSON.stringify(envelope)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kutangastream-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    show("Backup downloaded", "success");
  }

  async function copyBackup() {
    const envelope = await encodeBackup(collectPayload());
    const ok = await copyTextToClipboard(JSON.stringify(envelope));
    if (ok) {
      show("Backup copied to clipboard", "success");
    } else {
      show(
        "Couldn't copy — use Download or paste the JSON manually",
        "error",
      );
    }
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const n = await applyBackup(parsed);
        if (n > 0) {
          show(`Imported ${n} ${n === 1 ? "section" : "sections"}`, "success");
        }
      } catch (err) {
        show(
          err instanceof Error ? err.message : "Import failed — invalid file",
          "error",
        );
      }
    };
    reader.readAsText(file);
  }

  async function handlePaste() {
    if (!pasteText.trim()) return;
    try {
      const parsed = JSON.parse(pasteText);
      const n = await applyBackup(parsed);
      if (n > 0) {
        show(`Imported ${n} ${n === 1 ? "section" : "sections"}`, "success");
        setPasteText("");
      }
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Import failed — invalid JSON",
        "error",
      );
    }
  }

  function clearAllData() {
    if (
      !window.confirm(
        "Clear ALL local data — watchlist, favorites, history, settings? This can't be undone.",
      )
    )
      return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
    window.dispatchEvent(new Event("ms-storage-change"));
    show("All data cleared", "success");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Preferences are stored locally in your browser.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Playback</h2>
        <Field
          label="Preferred subtitle language"
          help="Passed to the embed player as ds_lang. Most providers honor this when matching subtitles are available."
        >
          <select
            value={settings.subtitleLanguage}
            onChange={(e) => update({ subtitleLanguage: e.target.value })}
            disabled={!hydrated}
            className="h-9 px-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Browsing</h2>
        <Field
          label="Default home page filter"
          help="Which set of rows to show on the home page when you haven't explicitly chosen a filter."
        >
          <select
            value={settings.defaultHomeFilter}
            onChange={(e) => {
              const v = e.target.value as Settings["defaultHomeFilter"];
              update({ defaultHomeFilter: v });
              // Mirror to a cookie so the (server-rendered) home page can
              // honor the preference on the very first request.
              document.cookie = `ms_home_filter=${v}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
            }}
            disabled={!hydrated}
            className="h-9 px-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value="all">All (default)</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Backup & restore</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Backups contain only your saved ids and watch state — gzip-compressed
          and base64-wrapped. Movie / TV metadata (posters, descriptions) is
          re-fetched from TMDB when you view your lists, so the file stays tiny.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadBackup}>Download backup</Button>
          <Button onClick={copyBackup} variant="secondary">
            Copy as text
          </Button>
          <Button
            onClick={() => fileInput.current?.click()}
            variant="secondary"
          >
            Import from file
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <details className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <summary className="cursor-pointer px-4 py-2 text-sm text-zinc-300">
            Paste a backup as text
          </summary>
          <div className="px-4 pb-4 space-y-2">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={5}
              placeholder='Paste the JSON you copied with "Copy as text"…'
              className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-xs text-white focus:outline-none focus:border-[var(--color-accent)] font-mono"
            />
            <Button onClick={handlePaste}>Import pasted text</Button>
          </div>
        </details>
      </section>

      <section className="space-y-3 pt-4 border-t border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-rose-400">Danger zone</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Wipes everything: watchlist, favorites, history, settings.
        </p>
        <Button onClick={clearAllData} variant="danger">
          Clear all local data
        </Button>
      </section>
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-white">{label}</span>
      {children}
      {help && <span className="text-xs text-[var(--color-text-muted)]">{help}</span>}
    </label>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}) {
  const base =
    "px-4 h-9 inline-flex items-center justify-center rounded-md text-sm font-medium border transition-colors";
  const styles =
    variant === "primary"
      ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
      : variant === "danger"
        ? "bg-transparent border-rose-500 text-rose-400 hover:bg-rose-500/10"
        : "bg-[var(--color-surface)] border-[var(--color-border)] text-white hover:border-[var(--color-accent)]";
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
