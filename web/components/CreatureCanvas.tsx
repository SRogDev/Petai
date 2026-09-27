"use client";

/**
 * CreatureCanvas — the living 2D embodiment of a pet.
 *
 * Renders the pet's Appearance genome procedurally on <canvas>:
 * body per shape, belly patch, eyes per style, blush, features,
 * accessories — animated with rAF (idle bounce, blinking, wandering).
 *
 * The pet never freezes into a static image: even at rest it breathes.
 */
import { useEffect, useRef } from "react";
import type { Appearance, EyeStyle, PetMood } from "../lib/api";

interface CreatureCanvasProps {
  appearance: Appearance;
  mood?: PetMood;
  width?: number;
  height?: number;
  className?: string;
}

/* ---------- color helpers ---------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return [249, 115, 22];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

/* ---------- animation energy per mood ---------- */

function energyFor(mood: PetMood | undefined): { amp: number; freq: number } {
  switch (mood) {
    case "ecstatic":
      return { amp: 15, freq: 6.5 };
    case "happy":
      return { amp: 9, freq: 4.2 };
    case "sleepy":
      return { amp: 2.5, freq: 1.1 };
    case "bored":
      return { amp: 3.5, freq: 1.8 };
    case "grumpy":
      return { amp: 4, freq: 2.6 };
    default:
      return { amp: 6, freq: 3.2 };
  }
}

function effectiveEyes(
  appearance: Appearance,
  mood: PetMood | undefined,
): EyeStyle {
  if (mood === "sleepy") return "sleepy";
  if (mood === "ecstatic") return "happy";
  return appearance.eye_style;
}

export function CreatureCanvas({
  appearance,
  mood,
  width = 280,
  height = 280,
  className,
}: CreatureCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ appearance, mood });
  stateRef.current = { appearance, mood };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const { appearance: a, mood: m } = stateRef.current;
      const t = reduced ? 1.2 : (now - start) / 1000;
      const { amp, freq } = energyFor(m);
      const eyes = effectiveEyes(a, m);

      ctx.clearRect(0, 0, width, height);

      const SIZE_SCALE: Record<string, number> = {
        tiny: 0.75,
        small: 1,
        medium: 1.3,
      };
      const r = Math.min(width, height) * 0.26 * (SIZE_SCALE[a.size] ?? 1);
      const wanderX = reduced ? 0 : Math.sin(t * 0.4) * width * 0.03;
      const cx = width / 2 + wanderX;
      const groundY = height * 0.86;
      const lift = reduced ? amp * 0.4 : Math.abs(Math.sin(t * freq)) * amp;
      const cy = groundY - r - lift;
      const squash = reduced ? 1 : 1 - 0.05 * Math.sin(t * freq * 2);

      /* shadow */
      const shadowScale = 1 - lift / (height * 0.5);
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#9a3412";
      ctx.beginPath();
      ctx.ellipse(
        cx,
        groundY + r * 0.12,
        r * 1.05 * shadowScale,
        r * 0.18,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, squash);

      const bodyStroke = shade(a.base_color, -38);
      ctx.lineWidth = 3;
      ctx.strokeStyle = bodyStroke;
      ctx.fillStyle = a.base_color;

      /* tail (behind body) */
      if (a.features.includes("tail") || a.body_shape === "cat") {
        const wag = reduced ? 0 : Math.sin(t * 3) * r * 0.12;
        ctx.beginPath();
        ctx.moveTo(-r * 0.85, r * 0.25);
        ctx.quadraticCurveTo(
          -r * 1.7,
          r * 0.1 + wag,
          -r * 1.55,
          -r * 0.75 + wag,
        );
        ctx.lineWidth = r * 0.22;
        ctx.lineCap = "round";
        ctx.strokeStyle = bodyStroke;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.85, r * 0.25);
        ctx.quadraticCurveTo(
          -r * 1.7,
          r * 0.1 + wag,
          -r * 1.55,
          -r * 0.75 + wag,
        );
        ctx.lineWidth = r * 0.22 - 6;
        ctx.strokeStyle = a.base_color;
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.strokeStyle = bodyStroke;
      }

      /* wings (behind body) */
      if (a.features.includes("wings") || a.body_shape === "dragon") {
        const flap = reduced ? 0 : Math.sin(t * freq * 1.4) * r * 0.18;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * r * 0.55, -r * 0.1);
          ctx.lineTo(side * r * 1.55, -r * 0.85 - flap);
          ctx.lineTo(side * r * 0.95, r * 0.05);
          ctx.closePath();
          ctx.fillStyle = a.accent_color;
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = a.base_color;
      }

      /* body */
      ctx.beginPath();
      if (a.body_shape === "long") {
        ctx.roundRect(-r * 1.45, -r * 0.8, r * 2.9, r * 1.6, r * 0.8);
      } else if (a.body_shape === "robot") {
        ctx.roundRect(-r * 0.95, -r * 1.05, r * 1.9, r * 2.0, r * 0.35);
      } else if (a.body_shape === "blob") {
        // wobbly blob
        const wob = reduced ? 0 : Math.sin(t * 2.2) * r * 0.05;
        ctx.moveTo(0, -r * 1.05);
        ctx.bezierCurveTo(
          r * 0.9,
          -r * 1.05,
          r * 1.05 + wob,
          -r * 0.3,
          r * 1.0,
          r * 0.35,
        );
        ctx.bezierCurveTo(r * 0.95, r * 0.95, r * 0.4, r * 1.02, 0, r * 1.0);
        ctx.bezierCurveTo(
          -r * 0.4,
          r * 1.02,
          -r * 0.95,
          r * 0.95,
          -r * 1.0,
          r * 0.35,
        );
        ctx.bezierCurveTo(
          -r * 1.05 - wob,
          -r * 0.3,
          -r * 0.9,
          -r * 1.05,
          0,
          -r * 1.05,
        );
        ctx.closePath();
      } else {
        ctx.ellipse(0, 0, r, r * 0.96, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();

      /* belly patch */
      ctx.beginPath();
      ctx.ellipse(0, r * 0.42, r * 0.55, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = a.belly_color;
      ctx.fill();

      /* ears / horns / antenna (on top) */
      const ear = (x: number, w: number, h: number, color: string) => {
        ctx.beginPath();
        ctx.moveTo(x - w / 2, -r * 0.85);
        ctx.lineTo(x, -r * 0.85 - h);
        ctx.lineTo(x + w / 2, -r * 0.85);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
      };
      if (a.body_shape === "cat" || a.features.includes("ears")) {
        ear(-r * 0.52, r * 0.5, r * 0.55, a.base_color);
        ear(r * 0.52, r * 0.5, r * 0.55, a.base_color);
      }
      if (a.features.includes("horns") || a.body_shape === "dragon") {
        ear(-r * 0.38, r * 0.3, r * 0.5, a.belly_color);
        ear(r * 0.38, r * 0.3, r * 0.5, a.belly_color);
      }
      if (a.features.includes("antenna") || a.body_shape === "robot") {
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.0);
        ctx.lineTo(0, -r * 1.55);
        ctx.lineWidth = 5;
        ctx.strokeStyle = bodyStroke;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -r * 1.62, r * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = a.accent_color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      /* eyes */
      const eyeY = -r * 0.25;
      const eyeDX = r * 0.36;
      const blink = !reduced && t % 3.4 < 0.16;
      const drawEye = (ex: number) => {
        if (eyes === "big_round" || eyes === "starry") {
          if (blink) {
            ctx.beginPath();
            ctx.moveTo(ex - r * 0.16, eyeY);
            ctx.lineTo(ex + r * 0.16, eyeY);
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#1f2937";
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(ex, eyeY, r * 0.19, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#1f2937";
            ctx.stroke();
            const lookX = reduced ? 0 : Math.sin(t * 0.4) * r * 0.04;
            ctx.beginPath();
            ctx.arc(ex + lookX, eyeY + r * 0.03, r * 0.085, 0, Math.PI * 2);
            ctx.fillStyle = "#1f2937";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(
              ex + lookX - r * 0.03,
              eyeY - r * 0.02,
              r * 0.03,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = "#ffffff";
            ctx.fill();
          }
          if (eyes === "starry" && !blink) {
            for (const [sx, sy] of [
              [ex + r * 0.3, eyeY - r * 0.28],
              [ex - r * 0.28, eyeY + r * 0.3],
            ]) {
              ctx.beginPath();
              const sr = r * 0.07;
              for (let i = 0; i < 8; i++) {
                const ang = (i * Math.PI) / 4;
                const rr = i % 2 === 0 ? sr : sr * 0.4;
                ctx[i === 0 ? "moveTo" : "lineTo"](
                  sx + Math.cos(ang) * rr,
                  sy + Math.sin(ang) * rr,
                );
              }
              ctx.closePath();
              ctx.fillStyle = "#fbbf24";
              ctx.fill();
            }
          }
        } else if (eyes === "sleepy") {
          ctx.beginPath();
          ctx.arc(
            ex,
            eyeY - r * 0.05,
            r * 0.16,
            0.15 * Math.PI,
            0.85 * Math.PI,
          );
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#1f2937";
          ctx.stroke();
        } else {
          // happy: ^^ arcs
          ctx.beginPath();
          ctx.arc(
            ex,
            eyeY + r * 0.08,
            r * 0.15,
            1.15 * Math.PI,
            1.85 * Math.PI,
          );
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#1f2937";
          ctx.stroke();
        }
      };
      drawEye(-eyeDX);
      drawEye(eyeDX);

      /* blush */
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#f9a8d4";
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(
          side * r * 0.62,
          eyeY + r * 0.32,
          r * 0.13,
          r * 0.09,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* accessories */
      if (a.accessories.includes("scarf")) {
        ctx.beginPath();
        ctx.roundRect(-r * 0.75, r * 0.28, r * 1.5, r * 0.34, r * 0.17);
        ctx.fillStyle = a.accent_color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = shade(a.accent_color, -38);
        ctx.stroke();
      }
      if (a.accessories.includes("hat")) {
        ctx.save();
        ctx.rotate(-0.14);
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.95);
        ctx.lineTo(r * 0.1, -r * 1.85);
        ctx.lineTo(r * 0.6, -r * 0.95);
        ctx.closePath();
        ctx.fillStyle = a.accent_color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = shade(a.accent_color, -38);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(r * 0.1, -r * 1.9, r * 0.13, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      if (a.accessories.includes("bow")) {
        const bx = r * 0.68;
        const by = -r * 0.95;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + side * r * 0.34, by - r * 0.2);
          ctx.lineTo(bx + side * r * 0.34, by + r * 0.2);
          ctx.closePath();
          ctx.fillStyle = a.accent_color;
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = shade(a.accent_color, -38);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(bx, by, r * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = shade(a.accent_color, -38);
        ctx.fill();
      }
      if (a.accessories.includes("glasses")) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#1f2937";
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(side * eyeDX, eyeY, r * 0.24, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-eyeDX + r * 0.24, eyeY);
        ctx.lineTo(eyeDX - r * 0.24, eyeY);
        ctx.stroke();
      }

      ctx.restore();

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [width, height]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ width, height }}
      className={className}
      role="img"
      aria-label={`Animated illustration of your creature (${stateRef.current.appearance.body_shape})`}
    />
  );
}
