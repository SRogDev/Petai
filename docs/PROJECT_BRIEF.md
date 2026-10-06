# Petai — Project Brief

> Full project context in one file. Hand this to ANOTHER AI (GPT, etc.) for planning
> and ideation, then bring the refined specs back. Keep this file accurate — it is the handoff doc.
> For the current timeline see `STATUS.md`. For how to work in this repo see `AGENTS.md`.

## One-liner
Petai is Roger's AI-powered digital pet platform: a living digital creature that belongs to you.

## Problem & audience
Digital pets are either Tamagotchi-simple or assistant-chatbots with a pet skin; nobody builds a creature that feels alive while keeping the user important.

## Product (what it is / is not)
A living digital creature that belongs to you. DESIGN RULES (locked): the pet is NOT an assistant ('does this feel alive?' is the metric); never fully autonomous (user stays important); freedom at creation, biological constraints after; deterministic systems own hunger/energy/time/inventory/progression/cooldowns/safety — AI owns decisions/dialogue/narrative; AI video is the creature's self-expression channel. PWA-first (AR is a replaceable capability layer; Capacitor where the web is insufficient).

## Key decisions (locked)
- License: Elastic License 2.0. English UI. PWA-first.
- Supabase from day 1 (full schema + RLS).
- AI mocked with an OpenRouter seam in MVP — Roger adds the key later.
- UI: claymorphism (orange #F97316, cream #FFF7ED, blue #2563EB), mobile-first, reduced-motion.

## Stack
FastAPI api (uv, pytest), Next.js 15 PWA, Supabase, three.js + model-viewer (AR), OpenRouter seam (mocked).

## Business model
Not locked — MVP is about the 'alive' feeling first.

## Open questions
- Real-device AR verification (camera placement unverified).
- What behaviors make it feel alive vs scripted.
