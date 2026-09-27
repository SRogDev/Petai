/**
 * Typed client for the Petai FastAPI backend.
 *
 * The backend owns the Pet Runtime (state, simulation, events) and returns
 * enveloped payloads ({pet}, {pets}, {events}, ...). This module unwraps
 * them into plain values and normalizes vocabulary (e.g. capability
 * statuses) so pages work with clean types.
 *
 * The backend is the source of truth for the simulated internal state
 * (needs, emotions, memory). The frontend never simulates — it renders.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ---------------- Types (mirror backend Pydantic models) ---------------- */

export type BodyShape = "blob" | "round" | "long" | "dragon" | "robot" | "cat";
export type EyeStyle = "big_round" | "sleepy" | "happy" | "starry";
export type CreatureSize = "tiny" | "small" | "medium";

export interface Appearance {
  body_shape: BodyShape;
  base_color: string;
  belly_color: string;
  accent_color: string;
  eye_style: EyeStyle;
  size: CreatureSize;
  /** e.g. "wings" | "horns" | "antenna" | "ears" | "tail" */
  features: string[];
  /** e.g. "scarf" | "hat" | "bow" | "glasses" */
  accessories: string[];
  visual_style: string;
}

export interface Personality {
  traits: string[];
  description: string;
  voice_style: string;
}

export interface Preferences {
  favorite_foods: string[];
  favorite_games: string[];
  favorite_activities: string[];
  dislikes: string[];
  fears: string[];
}

export interface Origin {
  backstory: string;
}

export type NeedKey =
  | "hunger"
  | "energy_cell"
  | "energy"
  | "happiness"
  | "social"
  | "stimulation"
  | "affection"
  | "cleanliness"
  | "curiosity";

/** Needs are a free map: the creature's kind decides which keys exist. */
export type Needs = Record<string, number>;

export type PetMood =
  | "ecstatic"
  | "happy"
  | "content"
  | "sleepy"
  | "bored"
  | "lonely"
  | "hungry"
  | "grumpy";

export interface Pet {
  id: string;
  name: string;
  species: string;
  appearance: Appearance;
  personality: Personality;
  preferences: Preferences;
  origin: Origin;
  needs: Needs;
  need_model: string[];
  mood: PetMood;
  activity: string;
  level: number;
  xp: number;
  owner_id: string | null;
  created_at: string;
  last_seen_at: string;
}

export interface PetEvent {
  id: string;
  pet_id: string;
  type: string;
  title: string;
  body: string;
  media_url: string | null;
  created_at: string;
  seen: boolean;
}

export interface InteractResponse {
  pet: Pet;
  /** What the creature "says"/does in response — shown in a speech bubble. */
  reaction: string;
  /** Server-chosen embodiment: the tactile signature of this reaction. */
  haptic: string;
  animation: string;
}

export interface TalkResponse {
  reply: string;
  pet: Pet;
}

export interface MeetResponse {
  title: string;
  dialogue: string[];
  /** 0–100 friendship score after the encounter */
  friendship: number;
}

export type MediaKind = "image" | "video";

export interface MediaArtifact {
  id: string;
  pet_id: string;
  kind: string;
  url: string;
  caption: string | null;
  created_at: string;
}

/** Frontend vocabulary for capability status. */
export type CapabilityStatus = "live" | "beta" | "planned";

export interface PhysicalCapability {
  id: string;
  name: string;
  description: string;
  status: CapabilityStatus;
}

export interface PhysicalSession {
  session_id: string;
  pet_id: string;
  capability_id: string;
}

export type InteractAction =
  | "feed"
  | "play"
  | "pet"
  | "cuddle"
  | "comfort"
  | "clean"
  | "talk"
  | "give_gift";

/* ---------------- Errors ---------------- */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/* ---------------- Helpers ---------------- */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(
      0,
      `Could not reach the Petai backend at ${API_BASE}. Is it running?`,
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(
      res.status,
      text || `Request failed with status ${res.status}`,
    );
  }
  return (await res.json()) as T;
}

/* ---------------- Pets ---------------- */

/**
 * The backend list endpoint returns summaries; resolve each to the full
 * pet so components (creature preview, needs) have everything.
 */
export async function listPets(): Promise<Pet[]> {
  const { pets } = await request<{ pets: { id: string }[] }>("/api/v1/pets");
  const full = await Promise.all(pets.map((p) => getPet(p.id)));
  return full.map((f) => f.pet);
}

export interface GetPetResult {
  pet: Pet;
  /** Events the creature generated while the owner was away. */
  awayEvents: PetEvent[];
}

export async function getPet(id: string): Promise<GetPetResult> {
  const data = await request<{ pet: Pet; away_events: PetEvent[] }>(
    `/api/v1/pets/${encodeURIComponent(id)}`,
  );
  return { pet: data.pet, awayEvents: data.away_events ?? [] };
}

export async function createPet(input: {
  name?: string;
  description: string;
}): Promise<Pet> {
  const data = await request<{ pet: Pet }>("/api/v1/pets", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.pet;
}

interface BackendReaction {
  text: string;
  animation: string;
  haptic: string;
  mood: string;
}

export async function interactPet(
  id: string,
  action: InteractAction,
  detail?: string,
): Promise<InteractResponse> {
  const data = await request<{ pet: Pet; reaction: BackendReaction }>(
    `/api/v1/pets/${encodeURIComponent(id)}/interact`,
    {
      method: "POST",
      body: JSON.stringify({ action, detail }),
    },
  );
  return {
    pet: data.pet,
    reaction: data.reaction.text,
    haptic: data.reaction.haptic,
    animation: data.reaction.animation,
  };
}

export async function talkToPet(
  id: string,
  message: string,
): Promise<TalkResponse> {
  const res = await interactPet(id, "talk", message);
  return { pet: res.pet, reply: res.reaction };
}

export async function getPetEvents(id: string): Promise<PetEvent[]> {
  const data = await request<{ events: PetEvent[] }>(
    `/api/v1/pets/${encodeURIComponent(id)}/events`,
  );
  return data.events ?? [];
}

/* ---------------- Social ---------------- */

interface BackendInteraction {
  summary: string;
  dialogue: string[];
  compatibility: number;
  became_friends: boolean;
}

export async function meetPets(
  petIdA: string,
  petIdB: string,
): Promise<MeetResponse> {
  const data = await request<{ interaction: BackendInteraction }>(
    `/api/v1/pets/${encodeURIComponent(petIdA)}/social/meet`,
    {
      method: "POST",
      body: JSON.stringify({ other_pet_id: petIdB }),
    },
  );
  const ix = data.interaction;
  return {
    title: ix.summary,
    dialogue: ix.dialogue,
    // Backend compatibility is 0–1; the UI renders 0–100.
    friendship: Math.max(0, Math.min(100, Math.round(ix.compatibility * 100))),
  };
}

/* ---------------- Media ---------------- */

export async function listMedia(petId: string): Promise<MediaArtifact[]> {
  const data = await request<{ media: MediaArtifact[] }>(
    `/api/v1/pets/${encodeURIComponent(petId)}/media`,
  );
  return data.media ?? [];
}

export async function createMedia(
  petId: string,
  kind: MediaKind,
  prompt?: string,
): Promise<MediaArtifact> {
  const data = await request<{ media: MediaArtifact }>(
    `/api/v1/pets/${encodeURIComponent(petId)}/media`,
    {
      method: "POST",
      body: JSON.stringify({ kind, prompt_hint: prompt }),
    },
  );
  return data.media;
}

/* ---------------- Physical world ---------------- */

type BackendCapabilityStatus = "available" | "planned";

function toCapabilityStatus(s: BackendCapabilityStatus): CapabilityStatus {
  return s === "available" ? "live" : "planned";
}

export async function getPhysicalCapabilities(): Promise<PhysicalCapability[]> {
  const data = await request<{
    capabilities: {
      id: string;
      name: string;
      description: string;
      status: BackendCapabilityStatus;
    }[];
  }>("/api/v1/physical/capabilities");
  return (data.capabilities ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: toCapabilityStatus(c.status),
  }));
}

export async function logPhysicalSession(
  petId: string,
  capabilityId: string,
): Promise<PhysicalSession> {
  const data = await request<{
    session: { id: string; pet_id: string; capability_id: string };
  }>("/api/v1/physical/sessions", {
    method: "POST",
    body: JSON.stringify({ pet_id: petId, capability_id: capabilityId }),
  });
  return {
    session_id: data.session.id,
    pet_id: data.session.pet_id,
    capability_id: data.session.capability_id,
  };
}

export function apiBase(): string {
  return API_BASE;
}
