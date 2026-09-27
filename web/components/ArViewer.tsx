"use client";

/**
 * ArViewer — the Physical World Layer's first real capability.
 *
 * The same Appearance genome that draws the 2D pet is rebuilt as a true 3D
 * creature (GLB, generated on-device with three.js) and handed to
 * <model-viewer>, which unlocks native AR: WebXR on Android, Scene Viewer
 * fallback, Quick Look on iOS. When the user launches AR we log a physical
 * session so the pet remembers it met you in your world.
 */
import { Box, ScanFace } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Appearance } from "../lib/api";

interface ArViewerProps {
  petId: string;
  petName: string;
  appearance: Appearance;
  onArLaunch?: () => void;
}

export function ArViewer({
  petId,
  petName,
  appearance,
  onArLaunch,
}: ArViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;

    (async () => {
      try {
        // Register the <model-viewer> custom element (client only).
        await import("@google/model-viewer");
        // Build the creature GLB from the genome — real 3D, generated on-device.
        const { buildCreatureGLB, revokeCreatureGLB } = await import(
          "../lib/creature3d"
        );
        const url = await buildCreatureGLB(appearance);
        if (cancelled) {
          revokeCreatureGLB(url);
          return;
        }
        urlRef.current = url;
        setGlbUrl(url);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not build the 3D creature.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (urlRef.current) {
        // Dynamic import again is cheap (cached) and keeps this module static-import free.
        import("../lib/creature3d").then((m) =>
          m.revokeCreatureGLB(urlRef.current as string),
        );
        urlRef.current = null;
      }
    };
    // Rebuilds if the genome ever changes (e.g. the creature evolves).
  }, [appearance]);

  if (!mounted) {
    return (
      <div className="clay-card-flat flex h-[420px] items-center justify-center">
        <p className="font-display text-lg font-semibold text-foreground/60">
          Waking up the 3D world…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clay-card-flat flex h-[420px] flex-col items-center justify-center gap-3 p-6 text-center">
        <Box size={40} className="text-foreground/40" aria-hidden />
        <p className="font-display text-lg font-semibold">
          3D view unavailable
        </p>
        <p className="text-sm font-medium text-foreground/60">{error}</p>
      </div>
    );
  }

  if (!glbUrl) {
    return (
      <div className="clay-card-flat flex h-[420px] flex-col items-center justify-center gap-3">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"
          aria-hidden
        />
        <p className="font-display text-lg font-semibold text-foreground/60">
          Sculpting {petName} in 3D…
        </p>
      </div>
    );
  }

  return (
    <div className="clay-card overflow-hidden p-0">
      <model-viewer
        src={glbUrl}
        alt={`3D model of ${petName}`}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        interaction-prompt="auto"
        style={{ width: "100%", height: "420px", background: "#FFF7ED" }}
      >
        <button
          type="button"
          slot="ar-button"
          onClick={onArLaunch}
          className="clay-btn font-display absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap bg-primary px-6 py-3 text-lg font-semibold text-on-primary"
        >
          <ScanFace size={22} aria-hidden />
          See in your world
        </button>
      </model-viewer>
      <p className="px-5 py-3 text-center text-xs font-bold text-foreground/55">
        Pet #{petId.slice(0, 8)} · rebuilt live from {petName}'s genome
      </p>
    </div>
  );
}
