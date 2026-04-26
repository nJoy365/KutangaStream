<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project conventions

A few things that aren't obvious from reading individual files:

## localStorage holds *only user actions*

`localStorage` stores tiny refs (`{ type, id, savedAt }` shape — no titles, no posters, no genres, no descriptions). All display metadata is fetched on demand via `POST /api/media-batch` and cached in `sessionStorage` + a module-level `Map` (see `src/hooks/useMediaBatch.ts`).

**Do not put TMDB-derived metadata into `localStorage`.** It violates the architecture and bloats backups. If you need it on a page, fetch it.

The current minimal shapes live in `src/lib/storage.ts` (`SavedRef`, `ContinueWatchingRef`, `WatchHistoryRef`). Storage keys are at `STORAGE_KEYS` in the same file.

## Server vs client boundary

- `src/lib/tmdb.ts` is `import "server-only"`. The TMDB key never crosses to the client. Server components import from here directly; client code uses an API route.
- New API routes for client-side data needs go in `src/app/api/...`.
- `useLocalStorageJSON` (`src/hooks/useLocalStorageJSON.ts`) is the base for *all* persistent client state — uses `useSyncExternalStore` for React-19 compatibility. Build new domain-specific hooks on top of it rather than calling `localStorage` directly.

## Migrations

`<Migrate />` mounted in the root layout runs once on first client mount. If you change a localStorage shape, add a migration step there (idempotent — check the v2 key isn't already populated) and bump the storage key version (e.g. `ms.watchlist.v2` → `.v3`).

## Backup format

`src/lib/backup.ts` defines a gzip + base64 envelope. Anything you add to `localStorage` should also be added to `collectPayload()` and `applyV2Payload()` in `src/app/settings/page.tsx`, otherwise it won't be in backups.

## Embed sources

Third-party players are registered in `src/lib/embedSources.ts`. Adding a new one is ~5 lines (id, name, two URL builders); the picker UI auto-populates.

## Build & verify

```bash
npm run lint        # eslint
npx tsc --noEmit    # typecheck
npm run build       # full Next build (catches SSR / RSC / metadata issues)
```

ESLint is strict about React 19's `set-state-in-effect` rule — prefer deriving via `useMemo` over setState in `useEffect`. The two existing escape-hatch comments (in `useMediaBatch` and `SearchBar`) are for legitimate fetch-on-input loading state and should stay.
