# Petai 🐾

**A living digital creature that belongs to you.**

You describe any creature you can imagine — an animal, fantasy creature, alien, monster, robot-animal — and it comes alive: needs, personality, memories, moods, a life of its own between visits. It is **not an assistant**. It is a companion.

> *"Does this feel like my creature is alive?"* — the one question every feature must answer.

Design rules: never fully autonomous (the user stays important); freedom at creation, biological constraints after; deterministic systems own hunger/energy/time/inventory/progression/cooldowns/safety — AI owns decisions, dialogue, narrative. Mobile-first, English UI, PWA-first (AR is a replaceable capability layer).

## Status

- **MVP done and pushed (2026-09-27, `main` @ `6cce196`):** FastAPI api (pytest 10/10, uv-managed) + Next.js 16.3.6 PWA (build green, 8/8 pages). Full Supabase schema + RLS in `supabase/db.sql` (not applied yet).
- **Physical World Layer:** three.js genome→GLB, model-viewer AR, haptics, capability registry — camera placement not yet verified on a physical device.
- **AI is mocked** (keyword-driven procedural; OpenRouter seam ready — key not yet added).
- **Blocked on setup:** Supabase project + apply `db.sql` + env vars; `OPENROUTER_API_KEY`; real-device AR test.

## Stack

Next.js 16.3.6 PWA · FastAPI + LangGraph (uv-managed Python) · Supabase (Postgres + RLS) · three.js / model-viewer (AR) · OpenRouter (AI seam, mocked for now)

Look: claymorphism — orange `#F97316`, cream `#FFF7ED`, blue `#2563EB`.

## Quickstart

```bash
# Backend
cd api
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd web
npm install
cp .env.example .env.local   # NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / API_URL
npm run dev                  # http://localhost:3000
```

Without Supabase env vars the web app runs in **demo mode** (banner shown).

## Structure

```
petai/
├── web/            # Next.js 16 PWA (mobile-first, English UI)
├── api/            # FastAPI + LangGraph Pet Mind (mock AI provider)
├── supabase/db.sql # Postgres schema + RLS — apply in the SQL editor
└── docs/           # vision, product rules, architecture, MVP scope
```

## License

Elastic License 2.0 — see [LICENSE](LICENSE).
