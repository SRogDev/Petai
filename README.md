# Petai 🐾

**A living digital creature that belongs to you.**

Petai is an AI-powered digital pet platform. You describe any creature you
can imagine — an animal, fantasy creature, alien, monster, robot-animal —
and it comes alive: it has needs, a personality, memories, moods, and a
life of its own between your visits. It is **not an assistant**. It is a
companion.

> *"Does this feel like my creature is alive?"* — the one question every
> Petai feature must answer.

- **Repo:** https://github.com/SRogDev/Petai
- **License:** Elastic License 2.0 (see `LICENSE`)
- **Product philosophy & hard rules:** [`docs/`](docs/)

## Monorepo

```
petai/
├── web/            # Next.js 15 PWA (mobile-first, English UI)
├── api/            # FastAPI + LangGraph Pet Mind (mock AI provider)
├── supabase/db.sql # Day-1 Postgres schema + RLS (apply in SQL editor)
└── docs/           # Vision, product rules, architecture, MVP scope
```

## Quickstart

**1. Database** — create a Supabase project, run `supabase/db.sql` in the
SQL editor, copy the project URL + anon key.

**2. Backend**
```bash
cd api
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt   # fastapi uvicorn pydantic langgraph httpx
uvicorn app.main:app --reload --port 8000
```

**3. Frontend**
```bash
cd web
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / API_URL
npm run dev                  # http://localhost:3000
```

Without Supabase env vars the web app runs in **demo mode** (fully
functional against the API, banner shown). AI generation is **mocked**
(keyword-driven procedural); set `AI_PROVIDER=openrouter` and
`OPENROUTER_API_KEY` in `api` to wire real models later.

## The Physical World Layer

A first-class priority: `/pets/[id]/ar` places your creature in the real
world via AR (`<model-viewer>` → Scene Viewer / Quick Look / WebXR) built
from a procedurally generated 3D model, plus haptic embodiment. New
physical interactions plug into the capability registry — see
[`docs/06-physical-world-layer.md`](docs/06-physical-world-layer.md).

## Status

MVP per [`docs/07-mvp-scope.md`](docs/07-mvp-scope.md). Honest stubs are
labeled in code and docs — never presented as working.
