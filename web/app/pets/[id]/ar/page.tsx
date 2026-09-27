"use client";

import {
  AlarmClock,
  Fingerprint,
  HeartPulse,
  Loader2,
  type LucideIcon,
  Plug,
  Smile,
  TriangleAlert,
  Waves,
  Zap,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArViewer } from "../../../../components/ArViewer";
import {
  Chip,
  ClayButton,
  ClayCard,
  SectionTitle,
} from "../../../../components/ui";
import { type Pet, getPet } from "../../../../lib/api";
import { cn } from "../../../../lib/cn";
import { HAPTIC_LABELS, type HapticName, buzz } from "../../../../lib/haptics";
import {
  type ResolvedCapability,
  usePhysicalWorld,
} from "../../../../lib/physical-world/registry";

export const dynamic = "force-dynamic";

const HAPTIC_ICONS: Record<HapticName, LucideIcon> = {
  tap: Fingerprint,
  excited: Zap,
  happy: Smile,
  scared: TriangleAlert,
  wake: AlarmClock,
  heartbeat: HeartPulse,
  calm: Waves,
};

const STATUS_STYLE: Record<ResolvedCapability["status"], string> = {
  live: "bg-emerald-100 text-emerald-700 border-emerald-300",
  beta: "bg-amber-100 text-amber-700 border-amber-300",
  planned: "bg-muted text-foreground/55 border-border",
};

export default function ArPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    capabilities,
    loading: capsLoading,
    startSession,
  } = usePhysicalWorld();

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    getPet(id)
      .then((data) => {
        if (!cancelled) setPet(data.pet);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleArLaunch = useCallback(() => {
    buzz("excited");
    if (id) void startSession(id, "ar_placement");
  }, [id, startSession]);

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-primary" aria-hidden />
        <p className="font-display text-lg font-semibold text-foreground/60">
          Opening the physical world…
        </p>
      </div>
    );
  }

  if (!pet) {
    return (
      <ClayCard className="text-center">
        <p className="font-display text-xl font-semibold">No creature found.</p>
        <p className="mt-2 text-sm font-semibold text-foreground/60">
          It may have wandered into another dimension.
        </p>
      </ClayCard>
    );
  }

  return (
    <div className="space-y-6">
      <header className="text-center">
        <SectionTitle className="text-3xl">
          {pet.name}, in your world
        </SectionTitle>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-foreground/65">
          The Physical World Layer: your creature leaves the screen and stands
          in your room. Same genome, new embodiment.
        </p>
      </header>

      <ArViewer
        petId={pet.id}
        petName={pet.name}
        appearance={pet.appearance}
        onArLaunch={handleArLaunch}
      />

      {/* ---------- Haptics playground ---------- */}
      <ClayCard>
        <SectionTitle className="mb-1 text-xl">Haptics playground</SectionTitle>
        <p className="mb-4 text-sm font-semibold text-foreground/60">
          Every emotion has its own vibration signature. Feel the creature
          through your phone.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(Object.keys(HAPTIC_LABELS) as HapticName[]).map((name) => {
            const Icon = HAPTIC_ICONS[name];
            return (
              <button
                key={name}
                type="button"
                onClick={() => buzz(name)}
                className="clay-btn flex min-h-[64px] flex-col items-center justify-center gap-1 bg-card px-2 py-3 text-sm font-extrabold text-foreground"
              >
                <Icon size={22} aria-hidden />
                {HAPTIC_LABELS[name]}
              </button>
            );
          })}
        </div>
      </ClayCard>

      {/* ---------- Capability registry ---------- */}
      <ClayCard>
        <SectionTitle className="mb-1 text-xl">
          Physical capabilities
        </SectionTitle>
        <p className="mb-4 text-sm font-semibold text-foreground/60">
          Pluggable powers for the real world. New ones slot in here without
          touching the rest of the app.
        </p>
        {capsLoading ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2
              size={24}
              className="animate-spin text-primary"
              aria-hidden
            />
            <span className="text-sm font-bold text-foreground/60">
              Loading…
            </span>
          </div>
        ) : (
          <ul className="space-y-3">
            {capabilities.map((cap) => (
              <li
                key={cap.id}
                className="clay-card-flat flex items-start justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-display text-base font-semibold">
                    {cap.name}
                  </p>
                  <p className="text-sm font-semibold text-foreground/60">
                    {cap.tagline}
                  </p>
                  <p className="mt-1 text-xs font-medium text-foreground/50">
                    {cap.howToUse}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border-2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide",
                    STATUS_STYLE[cap.status],
                  )}
                >
                  {cap.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 flex items-center gap-2 text-xs font-bold text-foreground/50">
          <Plug size={14} aria-hidden />
          More physical capabilities plug in here — world anchors, toy pairing,
          ambient presence.
        </p>
      </ClayCard>

      <div className="pb-2 text-center">
        <ClayButton
          variant="secondary"
          onClick={() => {
            buzz("calm");
            if (id) void startSession(id, "haptics_playground");
          }}
        >
          <HeartPulse size={20} aria-hidden /> Log a cuddle session
        </ClayButton>
      </div>
    </div>
  );
}
