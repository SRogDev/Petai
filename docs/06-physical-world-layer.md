# Petai — Physical World Layer

> Source: Petai product plan §§13–16. **This layer is a first-class
> priority**, not a post-MVP nice-to-have: the creature must be able to
> leave the app and exist in the user's physical environment.

## Principle

The creature leaves the app **as a digital creature**, never as a
productivity assistant. First technology: AR. The user points their phone
around the house and sees their creature walking around, sitting on
furniture, sleeping, playing, reacting to the environment, following them,
hiding.

## Architecture (replaceable capability)

```
Web / PWA  →  (optional Capacitor wrapper)  →  native AR capabilities
```

- The PWA remains the primary application architecture. Do not go fully
  native prematurely.
- AR is an additional "physical world" layer, designed as a **replaceable
  capability**: every physical interaction is registered in a capability
  registry with a stable contract, so new interactions plug in without
  touching the core.

## Capability contract

Every physical capability declares: `id`, `name`, `description`,
`platforms`, `status` (`available` | `planned`), and its input/output
contract. Capabilities are registered in:

- Backend: `api/app/physical/registry.py` → `GET /api/v1/physical/capabilities`
- Web: `web/lib/physical-world/registry.ts` (+ `usePhysicalWorld()` hook)

Every physical session is logged: `POST /api/v1/physical/sessions`
(persisted in `physical_sessions` — Supabase `db.sql` has the table).

## v1 — functional prototype (shipped in MVP)

| Capability | Status | What it really does |
|---|---|---|
| `ar_placement` | **available** | The creature is procedurally built in 3D (three.js) from its appearance genome, exported to GLB in-browser, and placed in the real world via `<model-viewer>` AR (`webxr`, Android Scene Viewer, iOS Quick Look). Real camera-based AR on device. |
| `haptic_feedback` | **available** | The creature's embodiment: `navigator.vibrate` patterns per emotion/action (tap, excited, happy, scared, wake, heartbeat). Pet jumps → subtle haptic; scared → different pattern. Not notification spam — embodiment. |
| `ambient_presence` | **available** | The creature reacts to physical-world session lifecycle (appears, notices, says goodbye) via session start/end events. |
| `world_anchor_persistence` | planned | Remember where the creature was placed between sessions. |
| `geolocation_context` | planned | Creature reacts to real places (park, home, beach). |

## Adding a new physical interaction

1. Register the capability in `api/app/physical/registry.py` (status, platforms, contract).
2. Mirror it in `web/lib/physical-world/registry.ts`.
3. Log sessions via `POST /api/v1/physical/sessions`.
4. Add the UI surface (usually under `/pets/[id]/ar`).

No changes to Pet Runtime, Pet Mind, or the simulation are required — the
Physical World Layer consumes the same event bus as everything else.

## Haptics design (plan §16)

Haptics are part of the creature's **embodiment**: the pet should feel
physically present in the device. Patterns live in the registry so web
(`lib/haptics.ts`) and any future native shell share one source of truth.
