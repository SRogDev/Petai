# Petai — Build Plan

Derived from the 24-section product plan. Philosophy lives in `docs/`;
this file tracks execution.

## Phase 0 — Foundation ✅
- [x] Repo scaffold (`web/`, `api/`, `supabase/`, `docs/`)
- [x] GitHub repo `SRogDev/Petai` (public, Elastic 2.0)
- [x] Product philosophy extracted to `docs/01–07`
- [x] `supabase/db.sql` — full schema + RLS + storage bucket
- [x] Design system (ui-ux-pro-max): claymorphism, #F97316 / #FFF7ED, Fredoka + Nunito

## Phase 1 — MVP build (done 2026-09-27)
- [x] `api/` — FastAPI: Pet Runtime, deterministic simulation, LangGraph
      Pet Mind (mock), events/SSE, social, mock media, physical registry,
      demo seed. pytest 10/10, ruff clean.
- [x] `web/` — Next.js 15 PWA: landing, login (Supabase), create, pet
      home (CreatureCanvas, needs, interactions), AR physical world,
      social, gallery, bottom nav. `next build` green (15.5.26), biome clean,
      tsc clean. Web↔API contract aligned (envelopes unwrapped, /talk via
      /interact, /pets/{id}/social/meet, backend-faithful types).
- [x] Physical World Layer v1: three.js creature → GLB → model-viewer AR
      + haptics + capability registry (web + api parity).
      Note: camera placement not yet verified on a physical device.

## Phase 2 — Verify
- [x] API boots; `POST /demo/seed` returns Mochi
- [x] Web builds; demo mode works without Supabase env
- [x] Screenshots: landing, create, pet home (`docs/screenshots/`)
- [ ] Push to `SRogDev/Petai`

## Phase 3 — Roger-owned (waiting)
- [ ] Create Supabase project + apply `db.sql`
- [ ] Set env vars (`NEXT_PUBLIC_SUPABASE_URL`, keys, `NEXT_PUBLIC_API_URL`)
- [ ] Get `OPENROUTER_API_KEY` → real generation (replace mock provider)

## Later
- [ ] API adopts Supabase Postgres (replace JSON store)
- [ ] Video generation via OpenRouter
- [ ] World Interaction Layer (games)
- [ ] AR anchors, geolocation context
