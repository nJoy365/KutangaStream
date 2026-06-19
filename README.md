# KutangaStream

Self-hosted movie + TV streaming UI built on Next.js. Catalog metadata comes from [TMDB](https://www.themoviedb.org/); playback comes from a swappable list of third-party embed providers that you configure yourself (see [Embed sources](#embed-sources)).

![KutangaStream home page](docs/home.png)

## Features

### Browse & search
- Home page with **All / Movies / TV** tabs and rows: Trending, Now Playing, On the Air, Popular, Top Rated, Upcoming, Airing Today
- **Search-as-you-type** dropdown in the navbar with keyboard navigation (↑/↓/Enter/Esc), debounced + AbortController-cancelled
- Full search results page at `/search?q=...`
- **Genre pages** at `/genre/[id]` — browse by genre with Popular / Top Rated / New tabs, filtered by movie or TV
- **Age rating pages** at `/rating/[code]` — browse by US certification (G, PG, PG-13, R, NC-17, TV-14, TV-MA, etc.)

### Watch
- Movie watch page: backdrop hero → embedded player → metadata → cast → "More Like This"
- TV watch page: same, plus a season/episode picker that auto-scrolls to the current episode
- **Playback progress + resume** — captures position from the player's `postMessage` stream into `localStorage`, then on load seeks the player back to where you left off (works cross-device once your backup is imported). Position is debounced to keep writes small.
- **Smart "resume last episode"** (hybrid): opening `/tv/[id]` without `?season=&episode=` resumes the last episode you were on if it's unfinished, otherwise advances to the **next unwatched** episode in release order
- **Auto "watched" at 95%** — an episode is marked watched once playback passes 95%, rather than the moment you open it
- **Soft client-side navigation** when changing episodes (no full page reload, no scroll jump)
- **User-configurable embed sources** — add, edit, remove, and reorder your own providers in **Settings → Embed sources**; switch between them on the watch page; preference persists per device
- **Subtitle language preference** in Settings, passed to embed providers via `ds_lang`
- **Trailers** — YouTube modal on movie/TV detail pages and Coming Soon banners; picks the best official trailer/teaser available from TMDB
- **Cast & crew scroller** — horizontal card row with hover-reveal left/right scroll arrows; shows photo, name, and character
- **US age ratings** — certification badge (G / PG / PG-13 / R / TV-14 / TV-MA etc.) displayed on detail pages; genre tags link through to the genre browse page
- **Coming Soon banner** for unreleased titles — shows poster, release date, certification, genres (linked), trailer button, and a note that streaming may not be available on premiere day
- **Coming-soon poster treatment** — unreleased titles in any row are grayscaled with a "Releases {date}" banner on the poster card

### Personal data (all local-only)
- **Watchlist** + **Favorites** — heart / bookmark any title
- **Continue Watching** row on home — TV shows only, auto-hides shows where every episode has been marked watched; per-show progress bar on the card showing how far into the current episode you are
- **Watch history** at `/history` with filters by title, type, **genre**, and date range
- **Per-episode "watched"** markers (toggle ◯ / ✓, also set automatically at 95% playback), plus bulk **"Mark season watched/unwatched"** in the episode picker
- **Resume progress bars** under episode thumbnails in the picker and on Continue Watching cards — a thin bar showing how far into a started-but-unfinished episode you are
- **Watch progress badges** on TV poster cards anywhere they appear ("✓ N watched")
- **Backup & restore** in Settings — exports as a gzip+base64 envelope (~30% the size of raw JSON), imports JSON file or pasted text, with a confirm prompt before overwriting existing data. Clipboard fallback works on HTTP (e.g. when accessing the LAN IP from a phone).
- **Toast notifications** on save/remove actions
- **Default home filter** preference (mirrored to a cookie so the server-rendered home page honors it on first request)

### UX polish
- Dark UI with violet accent, smooth horizontal row scrollers with hover-reveal arrow buttons
- **Mobile-friendly**: bottom nav (Home / Watchlist / Favorites / History / Settings) with active-route highlighting + iOS safe-area inset, tighter responsive padding, episode picker scopes its own scroll
- Loading skeletons for route transitions
- Per-page browser tab titles (`<show> · KutangaStream`) and Open Graph tags for link previews

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

## Embed sources

The app ships with **no** built-in stream providers — you bring your own. There are two ways to configure them:

### In-app (recommended)

Go to **Settings → Embed sources** and click **+ Add source**. Each source needs:

- **Name** — shown on the source-picker pills on watch pages
- **Movie URL** and **TV URL** — templates with placeholders

URL templates support these placeholders, substituted at watch time:

| Placeholder | Meaning |
|-------------|---------|
| `{tmdb}`    | TMDB numeric id |
| `{imdb}`    | IMDB id (e.g. `tt1234567`), when available |
| `{season}`  | season number (TV only) |
| `{episode}` | episode number (TV only) |

The first source in the list is the default; use the ↑/↓ buttons to reorder. Your list is stored locally in the browser (and included in **Backup & restore**). Subtitle language from Settings is appended automatically as `?ds_lang=...`.

For example, a path-style provider:

- **Movie URL:** `https://your-provider.example/embed/movie/{tmdb}`
- **TV URL:** `https://your-provider.example/embed/tv/{tmdb}/{season}/{episode}`

### YAML seed (optional)

On first run, if you haven't added any sources in the UI, the app seeds your list from `embed-sources.yaml` at the project root. Copy the example to pre-populate the list:

```bash
cp embed-sources.example.yaml embed-sources.yaml
# then edit embed-sources.yaml with your provider URLs
```

`embed-sources.yaml` is gitignored. It's only read to seed an empty list — once you have sources in the UI, the in-app list is authoritative.

## Storage architecture

The architecture is *deliberately split between server and browser*:

- **Server (Next.js):** holds the TMDB key, makes all upstream API calls, never sends the key to the client. The watch pages are server components that render with full metadata in the initial HTML.
- **Browser (`localStorage`):** stores **only your user actions** — `{ type, id, savedAt }` for watchlist/favorites, `{ type, id, watchedAt, season?, episode? }` for history, etc. No posters, no titles, no genres. Anything derivable from a TMDB id is fetched on demand.
- **Browser (`sessionStorage`):** caches `MediaSummary` payloads for the current tab. The Watchlist / Favorites / History / Continue Watching pages call `POST /api/media-batch` with their saved refs, get back metadata for everything in one round-trip, and re-render. Cached refs render synchronously on subsequent navigations.

Why? Two reasons:
1. **localStorage stays tiny** even after years of use — backups are small, parses are fast, no risk of hitting the ~5 MB browser quota.
2. **Metadata is always fresh** — if TMDB updates a poster or rating, you see it on next view rather than a stale cached version from when you first added a title.

A one-time migration (`<Migrate />` in the root layout) strips any pre-refactor v1 entries down to the new minimal v2 shape on first mount, then deletes the v1 keys. It also removes any legacy movie entries from Continue Watching (TV-only since the latest update). Idempotent and silent.

### Backup format

Backups are a small JSON envelope wrapping a **gzip-compressed, base64-encoded** payload of the raw v2 keys:

```json
{
  "app": "KutangaStream",
  "version": 2,
  "exportedAt": "2026-04-26T...",
  "encoding": "gzip+base64",
  "data": "H4sIAAAAAAAAA1WPwQ..."
}
```

The `Settings → Backup & restore` panel offers download-as-file, copy-as-text (with a textarea fallback for non-secure HTTP contexts), and import from file or pasted text. Legacy v1 backups (from before the refactor) still import — they're written to v1 keys and the migration runs immediately to convert.

## Project layout

```
src/
  app/                              # Next.js App Router pages
    page.tsx                        # Home (filter tabs + rows + Continue Watching)
    layout.tsx                      # Root layout (Toast, Migrate, Navbar, BottomNav)
    loading.tsx                     # Home skeleton
    search/page.tsx                 # /search?q=
    movie/[id]/{page,loading}.tsx   # Movie detail (player, cast, trailer, similar)
    tv/[id]/{page,loading}.tsx      # TV detail (player, episode picker, cast, trailer, similar)
    genre/[id]/page.tsx             # Browse by genre (Popular / Top Rated / New tabs)
    rating/[code]/page.tsx          # Browse by US age rating
    watchlist/{page,layout}.tsx
    favorites/{page,layout}.tsx
    history/{page,layout}.tsx
    settings/{page,layout}.tsx      # Subtitle lang + home filter + backup/restore
    api/
      search/route.ts               # Typeahead + full search
      media/[type]/[id]/route.ts    # Single-item hydration
      media-batch/route.ts          # Bulk hydration (returns episodeCount for TV)
  components/                       # UI primitives + watch-page widgets
    WatchPlayer.tsx                 # Source picker + player wrapper
    PlayerSurface.tsx               # Bridges the player's postMessage stream:
                                    #   progress capture, resume seek, auto-watched
    ProgressBar.tsx                 # Thin "resume" bar for thumbnails/posters
    CastScroller.tsx                # Horizontal cast card row with scroll arrows
    ContinueWatchingRow.tsx         # TV-only; hides fully-watched shows
    RatingBadge.tsx                 # US certification badge (PG-13, TV-MA, etc.)
    TrailerButton.tsx               # YouTube trailer modal with Esc + backdrop close
    Row.tsx                         # Generic horizontal media row with scroll arrows
    ...
  hooks/                            # localStorage hooks + useMediaBatch + useSettings
  lib/
    tmdb.ts                         # TMDB client (server-only)
    embedSources.ts                 # Embed URL template builder + helpers
    embedSourcesServer.ts           # Reads embed-sources.yaml (server-only)
    backup.ts                       # gzip+base64 encode/decode
    storage.ts                      # Storage keys + minimal types
    images.ts                       # TMDB image URL builders (poster, backdrop, profile)
    time.ts                         # Relative-time formatter
    types.ts                        # Shared types (MediaSummary, TvDetails, CastMember…)
```

## Disclaimer

This project is intended **for educational purposes only**. It is a personal learning exercise demonstrating Next.js, React, and modern web development techniques. It does not host, store, or distribute any media content. All metadata is sourced from [TMDB](https://www.themoviedb.org/) and all playback is handled by independent third-party embed providers — this app merely links to them in the same way a browser bookmark would. The author is not responsible for the content of any third-party services.

## Notes

- Posters and metadata come from TMDB; the embed iframe streams from a third-party provider you choose. None of those services are hosted by this app.
- The TMDB key is **server-only** — it never leaves the Next.js server, so the bundle stays clean.
- Playback position is read from the player's `postMessage` stream (it's reached through a relay chain and exposes a JW-style command API; `{ api: "seek", set: <seconds> }` is what we post to resume). Progress and resume work for both movies and TV; **Continue Watching** itself stays TV-only (episode-level) by design.
- For ad-blocking inside the player, install [uBlock Origin](https://ublockorigin.com/) in your browser, or run [AdGuard Home](https://adguard.com/en/adguard-home/overview.html) on your network.
- Local data lives in your browser's storage. Use **Settings → Backup & restore** before clearing site data or moving to a new device.
