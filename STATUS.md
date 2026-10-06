# STATUS — Petai

> Single source of truth for where this project stands. Last updated: 2026-10-06.
> Read this before starting work. Update it in the same PR when reality changes.

## Done
- 2026-09-27 — MVP DONE and pushed (`main` @ `6cce196`): FastAPI api (pytest 10/10) + Next.js 15.5.26 PWA (build green, 8/8 pages).
- 2026-09-27 — `supabase/db.sql`: full schema + RLS (not applied — Roger applies).
- 2026-09-27 — Physical World Layer: three.js genome→GLB, model-viewer AR, haptics, capability registry.
- 2026-09-27 — Next.js 16 pilot: codemod made 0 code changes, build green 8/8 (upgrade path validated).

## In progress / blocked
- Camera placement NOT yet verified on a physical device.
- Blocked on Roger: Supabase project + apply `db.sql` + env vars; `OPENROUTER_API_KEY`; real-device AR test.

## Next
- Verify AR on a real device, wire the real AI (OpenRouter seam is mocked), then iterate on 'does this feel alive?'.
