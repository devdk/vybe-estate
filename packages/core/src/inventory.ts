import type { Project, Unit, UnitStatus } from "./types";

export const STATUS_LABEL: Record<UnitStatus, string> = {
  available: "Available",
  on_hold: "On hold",
  booked: "Booked",
  sold: "Sold",
};

export const allUnits = (p: Project): Unit[] => p.towers.flatMap((t) => t.units);

export function statusCounts(units: Unit[]): Record<UnitStatus, number> {
  const c: Record<UnitStatus, number> = { available: 0, on_hold: 0, booked: 0, sold: 0 };
  for (const u of units) c[u.status]++;
  return c;
}

export function projectSummary(p: Project, bhks?: number[]) {
  const typeById = new Map(p.unitTypes.map((t) => [t.id, t]));
  const units = allUnits(p).filter((u) => !bhks?.length || bhks.includes(typeById.get(u.unitTypeId)!.bhk));
  const available = units.filter((u) => u.status === "available");
  const prices = available.map((u) => u.pricePaise);
  const types = [...new Set(units.map((u) => u.unitTypeId))].map((id) => typeById.get(id)!);
  return {
    counts: statusCounts(units),
    total: units.length,
    available: available.length,
    priceFrom: prices.length ? Math.min(...prices) : 0,
    priceTo: prices.length ? Math.max(...prices) : 0,
    bhks: [...new Set(types.map((t) => t.bhk))].sort((a, b) => a - b),
    carpetMin: Math.min(...types.map((t) => t.carpetSqft)),
    carpetMax: Math.max(...types.map((t) => t.carpetSqft)),
  };
}

/**
 * Scarcity text comes only from the live count. Returns null when there is
 * nothing true and useful to say, so components cannot invent urgency.
 */
export function scarcityText(available: number, threshold = 5): string | null {
  if (available <= 0) return "All units sold or held";
  if (available <= threshold) return `${available} ${available === 1 ? "unit" : "units"} left`;
  return null;
}
