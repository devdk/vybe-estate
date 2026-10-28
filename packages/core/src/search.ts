import { CATEGORIES, type CategoryId, type CityId, type PartnerType, type Room } from "./types";

export type SortKey = "price-asc" | "price-desc" | "possession";

/** Search filters. Budgets are in paise; for rent they are monthly rent. */
export interface SearchFilters {
  cityId: CityId;
  /** Undefined means every buy category (everything except rent). */
  category?: CategoryId;
  localitySlug?: string;
  bhk?: number[];
  minPaise?: number;
  maxPaise?: number;
  /** "ready" or a year: possession on or before the end of that year. */
  possessionBy?: "ready" | number;
  reraOnly?: boolean;
  sort?: SortKey;
}

export interface SearchCard {
  kind: "project" | "listing";
  id: string;
  href: string;
  title: string;
  cityId: CityId;
  localitySlug: string;
  localityName: string;
  category: CategoryId;
  priceFromPaise: number;
  priceToPaise: number;
  isRent: boolean;
  bhks: number[];
  carpetMin: number;
  carpetMax: number;
  possession: string;
  floorLabel?: string;
  rera?: string;
  partner: { id: string; name: string; type: PartnerType; verified: boolean };
  available?: number;
  total?: number;
  preview: { type: "towers"; towers: { name: string; floors: number; stacks: number; /** One char per unit, floor by floor: a(vailable) h(old) b(ooked) s(old). */ statuses: string }[] } | { type: "plan"; rooms: Room[] };
}

export const SALE_BUDGETS = [50, 75, 100, 150, 200, 300, 500, 1000].map((lakh) => lakh * 1e5 * 100);
export const RENT_BUDGETS = [15_000, 25_000, 40_000, 60_000, 100_000, 200_000].map((r) => r * 100);

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const rupeesToPaise = (v: string | undefined) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
};

/** URL search params → filters. Budgets travel as whole rupees to keep URLs readable. */
export function parseFilters(cityId: CityId, params: Params): SearchFilters {
  const type = first(params.type);
  const category = CATEGORIES.some((c) => c.id === type) ? (type as CategoryId) : undefined;
  const bhkRaw = params.bhk;
  const bhk = (Array.isArray(bhkRaw) ? bhkRaw : [bhkRaw ?? ""])
    .flatMap((s) => s.split(","))
    .map(Number)
    .filter((n, i, xs) => Number.isInteger(n) && n > 0 && n < 10 && xs.indexOf(n) === i)
    .sort((a, b) => a - b);
  const possession = first(params.possession);
  const year = Number(possession);
  const sort = first(params.sort);
  return {
    cityId,
    category,
    localitySlug: first(params.locality) || undefined,
    bhk: bhk.length ? bhk : undefined,
    minPaise: rupeesToPaise(first(params.min)),
    maxPaise: rupeesToPaise(first(params.max)),
    possessionBy: possession === "ready" ? "ready" : Number.isInteger(year) && year > 2000 ? year : undefined,
    reraOnly: first(params.rera) === "1" || undefined,
    sort: sort === "price-desc" || sort === "possession" ? sort : undefined,
  };
}

/** Filters → query string (without the city, which lives in the path). */
export function filtersToQuery(f: Partial<SearchFilters>): string {
  const q = new URLSearchParams();
  if (f.category) q.set("type", f.category);
  if (f.localitySlug) q.set("locality", f.localitySlug);
  if (f.bhk?.length) q.set("bhk", f.bhk.join(","));
  if (f.minPaise) q.set("min", String(Math.round(f.minPaise / 100)));
  if (f.maxPaise) q.set("max", String(Math.round(f.maxPaise / 100)));
  if (f.possessionBy) q.set("possession", String(f.possessionBy));
  if (f.reraOnly) q.set("rera", "1");
  if (f.sort) q.set("sort", f.sort);
  const s = q.toString();
  return s ? `?${s}` : "";
}
