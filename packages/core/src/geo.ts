import type { LngLat } from "./types";

const EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** Equirectangular projection around a centre: x east, y north, in km. Fine at city scale. */
export function toLocalKm(p: LngLat, center: LngLat): { x: number; y: number } {
  const kmPerDegLat = (Math.PI * EARTH_KM) / 180;
  return {
    x: (p[0] - center[0]) * kmPerDegLat * Math.cos(rad(center[1])),
    y: (p[1] - center[1]) * kmPerDegLat,
  };
}

/**
 * Lays points out on a plane of the given radius, keeping their real relative
 * positions, and returns a marker size that keeps neighbours from overlapping.
 */
export function layoutPoints(points: LngLat[], radius: number) {
  if (points.length === 0) return { positions: [], markerRadius: 0 };
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  const local = points.map((p) => toLocalKm(p, [cx, cy]));
  const extent = Math.max(...local.map((p) => Math.hypot(p.x, p.y)), 0.001);
  const scale = radius / extent;
  const positions = local.map((p) => ({ x: p.x * scale, y: p.y * scale }));
  let minGap = Infinity;
  for (let i = 0; i < positions.length; i++)
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i]!, b = positions[j]!;
      minGap = Math.min(minGap, Math.hypot(a.x - b.x, a.y - b.y));
    }
  const markerRadius = Number.isFinite(minGap) ? Math.min(radius * 0.32, minGap * 0.46) : radius * 0.32;
  return { positions, markerRadius };
}
