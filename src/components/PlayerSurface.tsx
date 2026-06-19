"use client";
import { useEffect, useRef } from "react";
import { progressKey, type WatchProgress } from "@/lib/storage";
import { readProgressEntry, recordProgress } from "@/hooks/useWatchProgress";
import { useWatchedEpisodes } from "@/hooks/useWatchedEpisodes";
import type { MediaType } from "@/lib/types";
import { Player } from "./Player";

interface Props {
  src: string;
  title?: string;
  type: MediaType;
  tmdbId: number;
  season?: number;
  episode?: number;
}

interface PlayerState {
  currentTime: number;
  duration: number;
  event: string;
}

// Pull { currentTime, duration, event } from the player's postMessage payload.
// The player broadcasts both a rich PLAYER_EVENT envelope and a bare
// { event: "time", ... }; we accept either and ignore everything else.
function parsePlayerMessage(data: unknown): PlayerState | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (obj.type === "PLAYER_EVENT" && obj.data && typeof obj.data === "object") {
    const d = obj.data as Record<string, unknown>;
    if (typeof d.currentTime === "number" && typeof d.duration === "number") {
      return {
        currentTime: d.currentTime,
        duration: d.duration,
        event: typeof d.event === "string" ? d.event : "timeupdate",
      };
    }
  }
  if (
    obj.event === "time" &&
    typeof obj.time === "number" &&
    typeof obj.duration === "number"
  ) {
    return { currentTime: obj.time, duration: obj.duration, event: "timeupdate" };
  }
  return null;
}

const FLUSH_EVENTS = new Set(["pause", "seeked", "ended"]);
const WRITE_INTERVAL_MS = 5000;
const RESUME_MIN_SECONDS = 30; // ignore positions barely into the title
const WATCHED_FRACTION = 0.95; // mark watched once playback passes this

/**
 * Wraps the embed player and bridges its postMessage stream to our state:
 *  - records playback position to `ks.progress.v1` (debounced)
 *  - seeks to the stored position once on load (cross-device resume)
 *  - marks a TV episode watched once it passes {@link WATCHED_FRACTION}
 *
 * The player sits behind a relay chain and exposes a JW-style command API;
 * `{ api: "seek", set: <seconds> }` seeks, which is what we post to resume.
 */
export function PlayerSurface({ src, title, type, tmdbId, season, episode }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastWriteRef = useRef(0);
  const resumeTargetRef = useRef<number | null>(null);
  const resumeDoneRef = useRef(false);
  const markedWatchedRef = useRef(false);

  const { markWatched } = useWatchedEpisodes(type === "tv" ? tmdbId : -1);
  // Reach markWatched from the listener without re-subscribing when it changes.
  const markWatchedRef = useRef(markWatched);
  useEffect(() => {
    markWatchedRef.current = markWatched;
  }, [markWatched]);

  const key = progressKey(type, tmdbId, season, episode);

  // Read where we left off, once per mount (before playback overwrites it).
  useEffect(() => {
    const stored = readProgressEntry(key);
    resumeTargetRef.current =
      stored && stored.time > RESUME_MIN_SECONDS ? stored.time : null;
    resumeDoneRef.current = false;
    markedWatchedRef.current = false;
  }, [key]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const state = parsePlayerMessage(e.data);
      if (!state || state.duration <= 0) return;

      // Resume once: seek to the stored position on the first timed event.
      // Skips if the player already landed there (same-device cookie) or if
      // the stored spot is within the last 3% (treat as finished).
      if (!resumeDoneRef.current) {
        resumeDoneRef.current = true;
        const target = resumeTargetRef.current;
        if (
          target != null &&
          target < state.duration * 0.97 &&
          Math.abs(state.currentTime - target) > 5
        ) {
          iframeRef.current?.contentWindow?.postMessage(
            { api: "seek", set: Math.floor(target) },
            "*",
          );
        }
      }

      // Mark a TV episode watched once it passes the threshold.
      if (
        type === "tv" &&
        season &&
        episode &&
        !markedWatchedRef.current &&
        state.currentTime / state.duration >= WATCHED_FRACTION
      ) {
        markedWatchedRef.current = true;
        markWatchedRef.current(season, episode);
      }

      // Persist position — debounced, but flushed immediately on pause/seek/end.
      const now = Date.now();
      const flush =
        FLUSH_EVENTS.has(state.event) ||
        now - lastWriteRef.current >= WRITE_INTERVAL_MS;
      if (flush && state.currentTime > 1) {
        recordProgress(key, {
          time: state.currentTime,
          duration: state.duration,
          updatedAt: now,
        } satisfies WatchProgress);
        lastWriteRef.current = now;
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [key, type, season, episode]);

  return <Player src={src} title={title} iframeRef={iframeRef} />;
}
