"use client";

import {
  BatteryCharging,
  Cookie,
  Gamepad2,
  Heart,
  type LucideIcon,
  Smile,
  Sparkles,
  Telescope,
  Users,
  Zap,
} from "lucide-react";
import type { NeedKey, Needs } from "../lib/api";
import { cn } from "../lib/cn";

const NEED_META: Record<NeedKey, { label: string; icon: LucideIcon }> = {
  hunger: { label: "Hunger", icon: Cookie },
  energy_cell: { label: "Charge", icon: BatteryCharging },
  energy: { label: "Energy", icon: Zap },
  happiness: { label: "Happiness", icon: Smile },
  social: { label: "Social", icon: Users },
  stimulation: { label: "Play", icon: Gamepad2 },
  affection: { label: "Affection", icon: Heart },
  cleanliness: { label: "Clean", icon: Sparkles },
  curiosity: { label: "Curiosity", icon: Telescope },
};

const BASE_ORDER: NeedKey[] = [
  "hunger",
  "energy",
  "happiness",
  "social",
  "stimulation",
  "affection",
  "cleanliness",
  "curiosity",
];

/**
 * The creature's kind decides its need model: a robot runs on an energy
 * cell instead of hunger. Swap the bar so the UI reflects the creature.
 */
function resolveOrder(needs: Needs): NeedKey[] {
  const order = [...BASE_ORDER];
  if ("energy_cell" in needs && !("hunger" in needs)) {
    const i = order.indexOf("hunger");
    if (i >= 0) order[i] = "energy_cell";
  }
  return order;
}

function barColor(value: number): string {
  if (value < 30) return "bg-red-400";
  if (value < 60) return "bg-amber-400";
  return "bg-emerald-400";
}

export function NeedsBars({ needs }: { needs: Needs }) {
  const order = resolveOrder(needs);
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {order.map((key) => {
        const { label, icon: Icon } = NEED_META[key];
        const value = Math.max(0, Math.min(100, Math.round(needs[key] ?? 0)));
        const low = value < 30;
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-card",
                low ? "text-red-500" : "text-foreground/70",
              )}
              aria-hidden
            >
              <Icon size={18} strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-foreground/80">
                  {label}
                </span>
                {low && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-red-500">
                    needs care
                  </span>
                )}
              </div>
              <div
                className="mt-1 h-3 overflow-hidden rounded-full border-2 border-border bg-muted"
                role="progressbar"
                tabIndex={0}
                aria-label={label}
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    barColor(value),
                  )}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
