#!/usr/bin/env bash
# Hourly updater for KutangaStream.
# Pulls origin/main and rebuilds the Docker stack if there are new commits.

set -eu

# cron's PATH is minimal — make sure we can find docker + git.
PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

REPO_DIR="${KUTANGASTREAM_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
LOG_FILE="${KUTANGASTREAM_LOG:-$REPO_DIR/.update.log}"
LOCK_FILE="/tmp/kutangastream-update.lock"

exec >> "$LOG_FILE" 2>&1

# Don't run two updates at once.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date)] Another update is running; skipping."
  exit 0
fi

cd "$REPO_DIR"

echo "[$(date)] Checking for updates…"
git fetch --quiet origin main

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "[$(date)] Already up to date ($LOCAL)."
  exit 0
fi

echo "[$(date)] Updates found: $LOCAL -> $REMOTE. Pulling…"
if ! git pull --ff-only --quiet origin main; then
  echo "[$(date)] git pull failed (local changes? conflicts?). Aborting."
  exit 1
fi

echo "[$(date)] Rebuilding container…"
docker compose up -d --build

echo "[$(date)] Update complete."
