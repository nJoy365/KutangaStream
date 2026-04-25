# KutangaStream

Self-hosted movie + TV streaming UI built on Next.js. Catalog metadata comes from [TMDB](https://www.themoviedb.org/); playback comes from a swappable list of third-party embed providers (vsembed.ru by default).

![KutangaStream home page](docs/home.png)

## Features

- Home page with **Movies / TV / All** tabs and rows: Trending, Now Playing, On the Air, Popular, Top Rated, Upcoming, Airing Today
- Combined movie + TV search
- Movie watch page with embedded player + similar titles
- TV watch page with season/episode picker, "Now Playing" episode summary, and Up-Next autoplay
- **Swappable embed sources** — toggle between VSEmbed, VidSrc, VidSrc.to, Embed.su, AutoEmbed, 2Embed, MoviesAPI on the watch page (preference persisted)
- **Watch history** at `/history` with filters by title, type, genre, and date range
- LocalStorage-backed quality-of-life features:
  - Watchlist
  - Favorites
  - Continue Watching (auto-resumes the last episode you opened)
  - Per-episode "watched" markers (toggle ◯ / ✓)
- Dark UI with violet accent, smooth horizontal row scrollers
- Server-side rendering with cached TMDB calls (30-min revalidate)

## Setup

### 1. Get a TMDB API key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup).
2. Go to **Settings → API**, request a **Developer** key (instant approval).
3. Copy either the **API Key (v3)** or the **API Read Access Token (v4)** — the app auto-detects which one you provided.

### 2. Configure the env

```bash
cp .env.local.example .env.local
# then edit .env.local and paste your key
```

### 3. Run it

#### Local development (hot reload)

```bash
npm install
npm run dev
# → http://localhost:3000
```

#### Docker (production-style)

```bash
docker compose up --build -d
# → http://localhost:3000
```

The compose file reads `.env.local` directly, so the same env file works for `npm run dev` and the container.

To stop: `docker compose down`. To rebuild after code changes: `docker compose up --build -d`.

## Raspberry Pi deployment (auto-updating)

Self-host on a Pi (4GB+ recommended; the Next.js build is memory-heavy) running 64-bit Raspberry Pi OS. The included installer:

- builds and starts the Docker container (auto-restarts on boot)
- installs an hourly cron job that pulls from `origin/main` and rebuilds **only if** there are new commits

### One-time setup

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in so the group change applies

# 2. Clone + configure
git clone https://github.com/nJoy365/KutangaStream.git ~/KutangaStream
cd ~/KutangaStream
cp .env.local.example .env.local
nano .env.local   # paste your TMDB_API_KEY

# 3. Run the installer
bash scripts/install-pi.sh
```

That's it. Open `http://<pi-ip>:3000` from any device on your LAN.

### Auto-update behavior

- Cron fires `scripts/update.sh` every hour at `:00`.
- The script `git fetch`es, compares `HEAD` to `origin/main`, and **only rebuilds if there are new commits**.
- A flock prevents overlapping runs.
- Logs go to `.update.log` in the repo dir.

To force an update now:

```bash
./scripts/update.sh && tail .update.log
```

To disable auto-updates: `crontab -e` and delete the line marked `# kutangastream-auto-update`.

## Project layout

```
src/
  app/                    # Next.js App Router pages
    page.tsx              # Home (filter tabs + rows)
    search/page.tsx       # /search?q=
    movie/[id]/page.tsx   # Movie watch page
    tv/[id]/page.tsx      # TV watch page (?season=&episode=)
    watchlist/page.tsx
    favorites/page.tsx
    history/page.tsx      # Watch history with filters
  components/             # UI: Navbar, PosterCard, Row, WatchPlayer, EpisodePicker, …
  hooks/                  # localStorage hooks (useSyncExternalStore-based)
  lib/
    tmdb.ts               # TMDB client (server-only)
    embedSources.ts       # Third-party embed provider registry
    images.ts             # TMDB image URL builder
    storage.ts            # localStorage helpers
    time.ts               # Relative-time formatter
    types.ts              # Shared types
```

## Notes

- Posters and metadata come from TMDB; the embed iframe streams from a third-party provider you choose. None of those services are hosted by this app.
- The TMDB key is **server-only** — it never leaves the Next.js server, so the bundle stays clean.
- All "saved" data (watchlist, favorites, continue watching, watched episodes, history) lives in your browser's `localStorage`. Clearing site data wipes it.
- Continue Watching tracks at the *episode* level, not the second — the embed iframe doesn't expose playback position.
- For ad-blocking inside the player, install [uBlock Origin](https://ublockorigin.com/) in your browser, or run [AdGuard Home](https://adguard.com/en/adguard-home/overview.html) on your network.
