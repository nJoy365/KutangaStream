#!/usr/bin/env bash
# One-shot setup for Raspberry Pi (or any Linux host running Docker).
# - Builds + starts the container
# - Installs an hourly cron job to pull updates from origin/main

set -eu

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "Setting up KutangaStream from $REPO_DIR"

if ! command -v docker >/dev/null 2>&1; then
  cat <<EOM

ERROR: Docker isn't installed. Install it first:
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker \$USER
  (then log out and back in so the group change takes effect)
EOM
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  cat <<EOM

ERROR: 'docker compose' (V2) not available. Install via:
  sudo apt install docker-compose-plugin
EOM
  exit 1
fi

if [ ! -f "$REPO_DIR/.env.local" ]; then
  cat <<EOM

ERROR: Missing $REPO_DIR/.env.local
  cp .env.local.example .env.local
  Then edit it and paste your TMDB_API_KEY.
EOM
  exit 1
fi

chmod +x "$REPO_DIR/scripts/update.sh"

echo
echo "▸ Building image and starting container…"
docker compose -f "$REPO_DIR/docker-compose.yml" up -d --build

echo
echo "▸ Installing hourly auto-update cron job…"
CRON_LINE="0 * * * * KUTANGASTREAM_DIR=$REPO_DIR $REPO_DIR/scripts/update.sh # kutangastream-auto-update"
EXISTING="$(crontab -l 2>/dev/null || true)"
FILTERED="$(printf "%s" "$EXISTING" | grep -v "kutangastream-auto-update" || true)"
if [ -n "$FILTERED" ]; then
  printf "%s\n%s\n" "$FILTERED" "$CRON_LINE" | crontab -
else
  printf "%s\n" "$CRON_LINE" | crontab -
fi

LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')

cat <<EOM

✓ Done.

  Container: $(docker compose -f "$REPO_DIR/docker-compose.yml" ps --format '{{.Name}} ({{.Status}})')
  Open:      http://${LAN_IP:-localhost}:3000

Useful commands:
  docker compose -f $REPO_DIR/docker-compose.yml logs -f   # tail container logs
  docker compose -f $REPO_DIR/docker-compose.yml ps        # status
  $REPO_DIR/scripts/update.sh                              # force update now
  tail -f $REPO_DIR/.update.log                            # tail update log
  crontab -l                                               # see cron jobs

To disable auto-updates: crontab -e and delete the # kutangastream-auto-update line.
EOM
