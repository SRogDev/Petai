# Petai — MVP Scope

> Source: Petai product plan §22. The MVP proves one thing:
>
> **"Can an AI-generated creature feel like a living digital pet that the
> user wants to return to?"**

## In scope

- **Creation** — describe creature → generated appearance, personality,
  needs, initial backstory (mock AI: keyword-driven procedural generation;
  swap to OpenRouter with `AI_PROVIDER=openrouter` + key).
- **Pet Home** — animated creature (procedural 2D canvas), interactive
  environment, needs bars, feed / play / pet / cuddle / comfort / clean,
  simple communication with reaction bubbles.
- **Personality** — persistent traits, preferences, memory of meaningful
  experiences, emotional state, mood-reactive reactions.
- **Autonomous life** — background tick simulation, "while you were away"
  events on return, daily stochastic activities, occasional generated
  media (postcards now; video stubbed).
- **Social** — two pets can meet; playful interaction narrative;
  relationship score.
- **Content** — creature-generated postcard images (SVG, mock); shareable
  event feed.
- **Presence** — PWA (manifest, icons, service worker), haptics where
  supported.
- **Physical World Layer v1** — real AR placement via `<model-viewer>`
  (Scene Viewer / Quick Look / WebXR) from a procedurally built 3D
  creature + haptic embodiment + capability registry (see
  `06-physical-world-layer.md`).

## Honest stubs (not shipped as working)

- Video generation → `501` until `OPENROUTER_API_KEY` is configured.
- `world_anchor_persistence`, `geolocation_context` → `planned` in the
  capability registry.
- Digital-world game interaction (plan §9, JEV layer) → architecture
  seam exists (`World Interaction Layer` in `04-architecture.md`), not
  implemented.
- API persistence is a JSON file store in the MVP; the Supabase schema
  (`supabase/db.sql`) is the day-1 system of record — the API adopts it
  when the project is created.

## Roadmap (from plan §§9, 24)

Turn-based game integration → richer social dynamics → creator content
tools → persistent AR anchors → the creature living across multiple
digital environments. Each phase must re-prove the MVP question at a
larger scale.
