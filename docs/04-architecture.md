# Petai — Architecture

> Source: Petai product plan §§17–19.

## The core runtime model

Each pet has persistent state:

```
Pet
├── Identity · Appearance · Personality · Memory · Needs
├── Emotional state · Preferences · Relationships · Skills
├── Inventory · Current environment · Current activity
├── History · Autonomous goals
```

**The AI does not directly control everything.** Instead:

```
Simulation/state → AI reasoning → allowed actions → state update
```

Deterministic systems control: hunger, energy, time, inventory,
progression, cooldowns, resource consumption, permissions, safety.
AI controls higher-level behavior: decisions, dialogue, personality
expression, creative activities, social interactions, autonomous
entertainment, narrative generation.

This prevents the LLM from becoming the entire game engine.

## Stack

- **Backend:** FastAPI · LangGraph · OpenRouter · persistent DB
  (Supabase Postgres) · object storage · background jobs · event system
- **Frontend:** Next.js (PWA) · mobile-first UI

## Engine separation

| Engine | Responsibility |
|---|---|
| Pet Runtime | Maintains state and events |
| Pet Mind | Decides what the pet wants to do (LangGraph) |
| Activity Engine | Turns intentions into executable activities |
| Memory | Stores meaningful experiences, not every interaction |
| Social Engine | Pet-to-pet interactions |
| Media Engine | Generates images/video/audio when appropriate (Pet Event → Media, never User → video generator) |
| World Interaction Layer | Pets interact with games / digital environments |
| Physical World Layer | AR and device capabilities (see `06-physical-world-layer.md`) |

## Event-driven

The pet reacts to events: `OWNER_RETURNED`, `PET_HUNGRY`, `PET_BORED`,
`PET_MISSED_OWNER`, `NEW_DAY`, `NEW_FRIEND`, `GAME_DISCOVERED`,
`ACTIVITY_COMPLETED`, `RANDOM_DISCOVERY`, `SOCIAL_INTERACTION`,
`OWNER_TOUCHED_PET`, `PET_CREATED`, `PET_LEVELED_UP`.

Example: `OWNER_RETURNED` → evaluate emotional state → decide whether to
greet → choose greeting behavior → generate animation/dialogue →
optionally create media.

This produces far more life than asking an LLM "what should my pet say?"
