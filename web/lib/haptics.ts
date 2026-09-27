/**
 * Haptics = the creature's embodiment.
 * Every pattern is a small tactile sentence: a jump feels different from fear.
 * Keep patterns short and intentional — embodiment, not notification spam.
 */

export type HapticName =
  | "tap"
  | "excited"
  | "happy"
  | "scared"
  | "wake"
  | "heartbeat"
  | "calm";

const PATTERNS: Record<HapticName, number[]> = {
  tap: [15],
  excited: [15, 40, 15],
  happy: [25],
  scared: [50, 40, 50],
  wake: [10, 60, 10],
  heartbeat: [20, 30, 20, 30, 60],
  calm: [40],
};

/** Type guard for haptic names arriving from the server. */
export function isHapticName(name: string): name is HapticName {
  return name in PATTERNS;
}

/**
 * Play a haptic pattern. Returns true if the device actually vibrated.
 * Safe to call anywhere — no-ops on devices/browsers without vibration support.
 */
export function buzz(name: HapticName): boolean {
  if (typeof navigator === "undefined") return false;
  const vibrate = navigator.vibrate?.bind(navigator);
  if (typeof vibrate !== "function") return false;
  try {
    return vibrate(PATTERNS[name]);
  } catch {
    return false;
  }
}

/** Human-readable labels for the haptics playground. */
export const HAPTIC_LABELS: Record<HapticName, string> = {
  tap: "Gentle tap",
  excited: "Excited bounce",
  happy: "Happy chirp",
  scared: "Startled shiver",
  wake: "Waking up",
  heartbeat: "Heartbeat",
  calm: "Calm purr",
};
