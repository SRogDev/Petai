"use client";

/**
 * Physical World Layer — client registry + hook.
 *
 * The registry mirrors the backend's capability list (GET /api/v1/physical/capabilities).
 * Capabilities are pluggable: each one is an id + how to launch it. New physical
 * interactions (world anchors, toy pairing, ambient presence...) plug in here
 * without touching the rest of the app.
 */
import { useCallback, useEffect, useState } from "react";
import {
  type CapabilityStatus,
  type PhysicalCapability,
  getPhysicalCapabilities,
  logPhysicalSession,
} from "../api";

export interface PhysicalCapabilityDef {
  id: string;
  name: string;
  tagline: string;
  /** What the user does to trigger it. */
  howToUse: string;
}

/**
 * Local catalogue of known capabilities. The backend is the source of truth
 * for `status`; anything unknown to the backend is treated as "planned".
 */
export const PHYSICAL_CAPABILITIES: PhysicalCapabilityDef[] = [
  {
    id: "ar_placement",
    name: "AR Placement",
    tagline: "Your creature, standing in your room.",
    howToUse:
      "Open the AR view, tap “See in your world”, and place your pet on any flat surface.",
  },
  {
    id: "haptics_playground",
    name: "Haptics Playground",
    tagline: "Feel the creature through your phone.",
    howToUse:
      "Try each pattern below — every emotion has its own vibration signature.",
  },
  {
    id: "ambient_presence",
    name: "Ambient Presence",
    tagline: "Gentle check-ins from your pet's world.",
    howToUse:
      "Coming soon: your pet nudges you with a soft haptic when something happens while you're away.",
  },
  {
    id: "world_anchor_memory",
    name: "World Anchors",
    tagline: "Your pet remembers places in your home.",
    howToUse:
      "Coming soon: anchor your pet's favorite spots — its bed by the window, its hideout under the table.",
  },
  {
    id: "toy_pairing",
    name: "Toy Pairing",
    tagline: "Physical toys your pet reacts to.",
    howToUse:
      "Coming soon: pair a BLE toy and watch your creature play with something real.",
  },
];

export interface ResolvedCapability extends PhysicalCapabilityDef {
  status: CapabilityStatus;
}

/**
 * Backend capability ids don't always match the local catalogue ids.
 * Aliases let the UI reflect the backend's real availability.
 */
const ID_ALIASES: Record<string, string> = {
  haptics_playground: "haptic_feedback",
  world_anchor_memory: "world_anchor_persistence",
};

export function usePhysicalWorld() {
  const [capabilities, setCapabilities] = useState<ResolvedCapability[]>(() =>
    PHYSICAL_CAPABILITIES.map((c) => ({
      ...c,
      status: "planned" as CapabilityStatus,
    })),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPhysicalCapabilities()
      .then((remote: PhysicalCapability[]) => {
        if (cancelled) return;
        const byId = new Map(remote.map((c) => [c.id, c]));
        setCapabilities(
          PHYSICAL_CAPABILITIES.map((def) => ({
            ...def,
            status:
              byId.get(def.id)?.status ??
              (ID_ALIASES[def.id]
                ? (byId.get(ID_ALIASES[def.id])?.status ?? "planned")
                : "planned"),
          })),
        );
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not load capabilities",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Tell the backend a physical session started (for memory + history). */
  const startSession = useCallback(
    async (petId: string, capabilityId: string) => {
      try {
        await logPhysicalSession(petId, capabilityId);
      } catch {
        // Physical play must never break because telemetry failed.
      }
    },
    [],
  );

  return { capabilities, loading, error, startSession };
}
