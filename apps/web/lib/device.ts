"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "./store";

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/** Low-memory phones, 2G, Data Saver or no WebGL → 2D only. Scenes are generated from data, so 3G is fine. */
export function deviceWantsLite(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: NetworkInfo };
  if (nav.connection?.saveData) return true;
  if (nav.connection?.effectiveType && ["slow-2g", "2g"].includes(nav.connection.effectiveType)) return true;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return true;
  try {
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") || c.getContext("webgl"))) return true;
  } catch {
    return true;
  }
  return false;
}

/**
 * Whether to skip 3D. Returns true until mounted, so the server HTML and the
 * first client paint are always the 2D version; 3D loads after that.
 */
export function useLiteMode(): boolean {
  const pref = usePrefs((s) => s.lite);
  const [auto, setAuto] = useState<boolean | null>(null);
  // Effects run after the first paint, so the 2D view always shows first.
  useEffect(() => setAuto(deviceWantsLite()), []);
  if (auto === null) return true;
  return pref ?? auto;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

const TOKEN_NAMES = ["accent", "navy", "pedestal", "building", "line", "avail", "hold", "sold", "booked", "ink", "muted", "raised"] as const;
export type Tokens = Record<(typeof TOKEN_NAMES)[number], string>;

/** Reads the CSS design tokens so 3D materials use the same colours as the page. */
export function useTokens(): Tokens | null {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      setTokens(Object.fromEntries(TOKEN_NAMES.map((n) => [n, cs.getPropertyValue(`--${n}`).trim()])) as Tokens);
    };
    read();
  }, []);
  return tokens;
}
