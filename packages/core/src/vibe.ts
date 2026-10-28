import type { VibeInputs } from "./types";

export const VIBE_FACTORS = [
  { key: "commute", label: "Commute", weight: 0.3 },
  { key: "schools", label: "Schools", weight: 0.2 },
  { key: "greenCover", label: "Green cover", weight: 0.2 },
  { key: "appreciation", label: "Appreciation", weight: 0.2 },
  { key: "nightlife", label: "Nightlife", weight: 0.1 },
] as const satisfies readonly { key: keyof VibeInputs; label: string; weight: number }[];

/** Weighted 0–10 score, one decimal. Inputs are 0–10 per factor. */
export function vibeScore(v: VibeInputs): number {
  const s = VIBE_FACTORS.reduce((sum, f) => sum + v[f.key] * f.weight, 0);
  return Math.round(s * 10) / 10;
}
