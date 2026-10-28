// Solar position for the "walk the unit" sun path. Same maths as SunCalc
// (Astronomical Algorithms, simplified), accurate to well under a degree.
import type { Facing, LngLat } from "./types";

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const J1970 = 2_440_588;
const J2000 = 2_451_545;
const OBLIQUITY = RAD * 23.4397;

const toDays = (date: Date) => date.valueOf() / DAY_MS - 0.5 + J1970 - J2000;

function sunCoords(d: number) {
  const m = RAD * (357.5291 + 0.98560028 * d);
  const c = RAD * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m));
  const l = m + c + RAD * 102.9372 + Math.PI;
  return {
    dec: Math.asin(Math.sin(l) * Math.sin(OBLIQUITY)),
    ra: Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY), Math.cos(l)),
  };
}

export interface SunPosition {
  /** Compass bearing of the sun, degrees clockwise from north. */
  bearing: number;
  /** Degrees above the horizon; negative at night. */
  altitude: number;
}

export function sunPosition(date: Date, [lng, lat]: LngLat): SunPosition {
  const d = toDays(date);
  const phi = RAD * lat;
  const { dec, ra } = sunCoords(d);
  const h = RAD * (280.16 + 360.9856235 * d) + RAD * lng - ra;
  const azFromSouth = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  const altitude = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(h));
  return { bearing: (azFromSouth / RAD + 180 + 360) % 360, altitude: altitude / RAD };
}

/** Indian Standard Time (UTC+5:30) wall-clock time → Date. */
export function istDate(isoDay: string, hour: number): Date {
  const [y, m, d] = isoDay.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d) + (hour - 5.5) * 3_600_000);
}

export const FACING_BEARING: Record<Facing, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
const COMPASS: Facing[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export const compassPoint = (bearing: number): Facing => COMPASS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8]!;

const angleBetween = (a: number, b: number) => {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
};

/** Below this the sun is usually behind neighbouring buildings. */
export const LOW_SUN_DEG = 5;

export type Side = "front" | "right" | "back" | "left";

/**
 * Which outside walls of the flat the sun shines on. The front is the side
 * the flat faces; right, back and left follow clockwise. Which rooms sit on
 * each wall comes from the developer's plan, so this stays at wall level.
 */
export function sunlitSides(facing: Facing, sun: SunPosition): { side: Side; faces: Facing; lit: boolean }[] {
  const front = FACING_BEARING[facing];
  return (["front", "right", "back", "left"] as const).map((side, i) => {
    const bearing = front + i * 90;
    return { side, faces: compassPoint(bearing), lit: sun.altitude >= LOW_SUN_DEG && angleBetween(bearing, sun.bearing) < 80 };
  });
}
