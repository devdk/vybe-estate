import { haversineKm } from "./geo";
import type { LngLat } from "./types";

export interface VisitStop {
  id: string;
  label: string;
  partnerName: string;
  location: LngLat;
}

export interface PlannedVisit extends VisitStop {
  start: string;
  end: string;
  travelMinutes: number;
}

const VISIT_MINUTES = 45;
/** Average door-to-door speed in Indian metro traffic; shown to buyers as an estimate. */
export const CITY_SPEED_KMH = 18;

const hhmm = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
const roundUp = (mins: number, step: number) => Math.ceil(mins / step) * step;

/**
 * Orders the shortlist into one day of site visits: nearest stop next,
 * 45 minutes on site, travel estimated from straight-line distance.
 */
export function planVisitDay(stops: VisitStop[], startHour = 10): PlannedVisit[] {
  const remaining = [...stops];
  const out: PlannedVisit[] = [];
  let clock = startHour * 60;
  let here: LngLat | null = null;
  while (remaining.length) {
    let idx = 0;
    if (here) {
      let best = Infinity;
      remaining.forEach((s, i) => {
        const d = haversineKm(here!, s.location);
        if (d < best) [best, idx] = [d, i];
      });
    }
    const stop = remaining.splice(idx, 1)[0]!;
    const travel = here ? roundUp((haversineKm(here, stop.location) / CITY_SPEED_KMH) * 60 * 1.3, 15) : 0;
    clock += travel;
    out.push({ ...stop, start: hhmm(clock), end: hhmm(clock + VISIT_MINUTES), travelMinutes: travel });
    clock += VISIT_MINUTES;
    here = stop.location;
  }
  return out;
}
