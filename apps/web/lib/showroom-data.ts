// Server-side shaping of catalogue data into the small payloads the showrooms need.
import { allUnits, layoutPoints, toLocalKm, type CityId, type Facing, type Project, type UnitStatus } from "@vybe/core";
import { listProjects, localityStats } from "@vybe/core/catalog";

export interface District {
  slug: string;
  name: string;
  /** Plane position: x east, y north. */
  x: number;
  y: number;
  radius: number;
  homes: number;
  medianPsfPaise: number;
  vibe: number;
  projects: { slug: string; name: string; dx: number; dy: number; floors: number }[];
}

export const CITY_RADIUS = 6;
/** Projects within this distance of a locality centre are drawn inside its district. */
const PROJECT_SPREAD_KM = 1.6;

export function cityDistricts(cityId: CityId): District[] {
  const stats = localityStats(cityId);
  const { positions, markerRadius } = layoutPoints(
    stats.map((s) => s.locality.center),
    CITY_RADIUS,
  );
  const projects = listProjects(cityId);
  return stats.map((s, i) => ({
    slug: s.locality.slug,
    name: s.locality.name,
    x: positions[i]!.x,
    y: positions[i]!.y,
    radius: markerRadius,
    homes: s.homes,
    medianPsfPaise: s.medianPsfPaise,
    vibe: s.vibe,
    projects: projects
      .filter((p) => p.localitySlug === s.locality.slug)
      .map((p) => {
        const km = toLocalKm(p.location, s.locality.center);
        const k = (markerRadius * 0.62) / PROJECT_SPREAD_KM;
        return { slug: p.slug, name: p.name, dx: km.x * k, dy: km.y * k, floors: Math.max(...p.towers.map((t) => t.floors)) };
      }),
  }));
}

/** [number, floor, stack, status, unit-type index, facing, price in rupees] */
export type UnitTuple = [string, number, number, UnitStatus, number, Facing, number];

export interface ExplorerTower {
  id: string;
  name: string;
  floors: number;
  stacks: number;
  units: UnitTuple[];
}

export function explorerTowers(p: Project): ExplorerTower[] {
  const typeIndex = new Map(p.unitTypes.map((t, i) => [t.id, i]));
  return p.towers.map((t) => ({
    id: t.id,
    name: t.name,
    floors: t.floors,
    stacks: t.stacks,
    units: t.units.map((u) => [u.number, u.floor, u.stack, u.status, typeIndex.get(u.unitTypeId)!, u.facing, Math.round(u.pricePaise / 100)]),
  }));
}

export const unitCount = (p: Project) => allUnits(p).length;
