@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A web app that lets a client mark signage placement locations on a map (either an uploaded floor-plan image or a real geographic map) and link each pin to signage data (company name, etc.), without any login. Access is via per-project unique links (view-only and edit). Part of the broader signage-design-automation project; the Illustrator ExtendScript side of that project lives in the separate `illustrator-scripts` repository — nothing here depends on it, and its conventions (ExtendScript/BOM rules etc.) do not apply here.

See `docs/adr/` for the architectural decisions and their rationale. Read the relevant ADR before touching an area it covers, and add a new ADR (don't silently override an existing one) if you change direction.

- **Stack**: Next.js 16 (App Router, TypeScript, Turbopack) + Tailwind CSS v4, Supabase (Postgres + Storage), `react-leaflet` for maps.
- **This is Next.js 16 — read `AGENTS.md` / `node_modules/next/dist/docs/` before writing App Router code**, not just this file. Concretely, in this codebase: dynamic route files use `proxy.ts` (not `middleware.ts`); `params`/`searchParams` in `page.tsx`/`layout.tsx`/route handlers are `Promise`s and must be `await`ed; Node.js **20.9+** is required everywhere (the Dockerfile pins this).
- **Local dev**: `supabase start` (Supabase CLI, runs its own Docker Compose stack) for the backend, then `docker compose up` (this repo's own `docker-compose.yml`) for the Next.js app. Both must be running for the app to work locally.
- **After adding a brand-new route folder/page** (e.g. a new `app/**/page.tsx` under a directory that didn't exist yet), the running dev container may 404 it — Turbopack's file watcher over the Windows/Docker Desktop bind mount doesn't always pick up newly created nested directories. If a new route 404s right after creating it, `docker compose restart web` before assuming the code is wrong.
- **Test runner (vitest) only runs correctly inside the container.** The host's Node.js here is older than this project requires; `npx vitest` on the host will fail on unrelated toolchain errors. Always run tests via `docker compose exec web npx vitest run` (or `docker compose run --rm web npx vitest run` if the container isn't up).
- **`node_modules` inside the container is a separate anonymous Docker volume from the host's**, by design (see `docker-compose.yml`) — installing a package with `npm install` on the host does not make it available inside the already-running container. After adding a dependency, run `docker compose exec web npm install` (or `docker compose up --build` to rebuild the image) before the container can `import` it, or you'll see a false "Module not found" error that looks like a code problem.
- **Uploaded images**: only `app/api/upload-map-image` may write to the `map-images` Storage bucket, using the Service Role key after validating `editToken` itself (see that route's comments and `docs/adr/0003-token-based-access.md`). The bucket is public for reads. Build the browser-facing image URL with `lib/supabase/storage.ts`'s `getMapImagePublicUrl()` (uses `NEXT_PUBLIC_SUPABASE_URL`) — never with `SUPABASE_URL_INTERNAL`/`host.docker.internal`, which the browser (running on the host, not in the container) cannot resolve.
- **No Supabase Auth / no login.** See `docs/adr/0003-token-based-access.md` — all data access goes through `SECURITY DEFINER` Postgres functions that validate a view/edit token argument. Never add a table policy that grants `anon` direct table access as a shortcut; add a new RPC function instead, and make sure it validates its token argument before touching data.
- **Map has two modes** (`docs/adr/0002-dual-map-mode.md`): floor-plan image (`CRS.Simple` + `ImageOverlay`, pixel coordinates) and geographic (default CRS + tile layer, lat/lng). Keep pin UI components mode-agnostic; branch on `project.map_type` only where the map itself is rendered.
- **Conflict handling** (`docs/adr/0004-conflict-handling.md`): pin updates carry the `updated_at` the client last saw; the RPC rejects the write if it doesn't match current DB state, and the client must surface that as "someone else updated this" rather than silently overwriting.

## Directory conventions

- `app/` — Next.js App Router pages and API routes
- `components/` — React components (map, pin editor, etc.)
- `supabase/` — Supabase project config, migrations (`supabase/migrations/`), and RPC function definitions (SQL)
- `docs/adr/` — architecture decision records (see `docs/adr/0001-tech-stack.md` for the format this repo uses)

## Development workflow

- Branch: `main` + short-lived feature branches for anything non-trivial.
- TDD: write a failing test first, then the minimal implementation, then refactor, for anything with real logic (RPC functions, conflict-handling logic, coordinate transforms). Pure UI layout/styling can skip this — say so rather than faking a test.
- Commit in meaningful units with a message that explains why, not just what.
- Do not push, force-push, or delete branches unless explicitly asked.

## Testing

- `npm test` — unit tests (once the test runner is set up; see the first implementation task for the actual choice/config)
- Backend logic (RPC functions) should be tested against the local Supabase stack (`supabase start` running), not mocked, since the whole point of the token-validation functions is that the database enforces them.
