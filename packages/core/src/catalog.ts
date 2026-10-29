// Read side of the catalogue. Today it serves the demo inventory; the same
// functions will be backed by Postgres (+ Meilisearch for search) later, so
// pages and the API depend on this module, never on demo-catalog directly.
import { CITIES, LOCALITIES } from "./cities";
import { buildDemoCatalog, type Catalog } from "./demo-catalog";
import { formatBhk, formatINR, ordinal } from "./format";
import { haversineKm } from "./geo";
import { allUnits, projectSummary } from "./inventory";
import type { SearchCard, SearchFilters } from "./search";
import { CATEGORIES, type CategoryId, type CityId, type Facing, type Listing, type Locality, type PartnerType, type Project, type Room } from "./types";
import { vibeScore } from "./vibe";

let cache: Catalog | undefined;
const db = () => (cache ??= buildDemoCatalog());

export const listCities = () => CITIES;
export const getCity = (id: string) => CITIES.find((c) => c.id === id);
export const listLocalities = (cityId: CityId) => LOCALITIES.filter((l) => l.cityId === cityId);
export const getLocality = (cityId: string, slug: string) => LOCALITIES.find((l) => l.cityId === cityId && l.slug === slug);
export const getPartner = (id: string) => db().partners.get(id);
export const getProject = (slug: string) => db().projects.find((p) => p.slug === slug);
export const getListing = (slug: string) => db().listings.find((l) => l.slug === slug);
export const listProjects = (cityId?: CityId) => db().projects.filter((p) => !cityId || p.cityId === cityId);
export const listListings = (cityId?: CityId) => db().listings.filter((l) => !cityId || l.cityId === cityId);
export const listPartners = () => [...db().partners.values()];
export const projectsByPartner = (partnerId: string) => db().projects.filter((p) => p.developerId === partnerId);
export const listingsByPartner = (partnerId: string) => db().listings.filter((l) => l.partnerId === partnerId);

const STATUS_CHAR = { available: "a", on_hold: "h", booked: "b", sold: "s" } as const;

const localityName = (cityId: string, slug: string) => getLocality(cityId, slug)?.name ?? slug;

function projectCard(p: Project, bhk?: number[]): SearchCard {
  const s = projectSummary(p, bhk);
  const dev = getPartner(p.developerId)!;
  return {
    kind: "project",
    id: p.slug,
    href: `/projects/${p.slug}`,
    title: p.name,
    cityId: p.cityId,
    localitySlug: p.localitySlug,
    localityName: localityName(p.cityId, p.localitySlug),
    category: p.category,
    priceFromPaise: s.priceFrom,
    priceToPaise: s.priceTo,
    isRent: false,
    bhks: s.bhks,
    carpetMin: s.carpetMin,
    carpetMax: s.carpetMax,
    possession: p.possession,
    rera: p.rera.number,
    partner: { id: dev.id, name: dev.name, type: dev.type, verified: dev.verified },
    available: s.available,
    total: s.total,
    preview: {
      type: "towers",
      towers: p.towers.map((t) => ({ name: t.name, floors: t.floors, stacks: t.stacks, statuses: t.units.map((u) => STATUS_CHAR[u.status]).join("") })),
    },
  };
}

function listingCard(l: Listing): SearchCard {
  const partner = getPartner(l.partnerId)!;
  return {
    kind: "listing",
    id: l.slug,
    href: `/homes/${l.slug}`,
    title: `${formatBhk(l.bhk)} in ${l.buildingName}`,
    cityId: l.cityId,
    localitySlug: l.localitySlug,
    localityName: localityName(l.cityId, l.localitySlug),
    category: l.kind,
    priceFromPaise: l.pricePaise,
    priceToPaise: l.pricePaise,
    isRent: l.kind === "rent",
    bhks: [l.bhk],
    carpetMin: l.carpetSqft,
    carpetMax: l.carpetSqft,
    possession: "ready",
    floorLabel: `${ordinal(l.floor)} of ${l.totalFloors} floors`,
    rera: l.rera?.number,
    partner: { id: partner.id, name: partner.name, type: partner.type, verified: partner.verified },
    preview: { type: "plan", rooms: l.rooms },
  };
}

const possessionYear = (p: string) => (p === "ready" ? 0 : Number(p.slice(0, 4)));

function matchesProject(p: Project, f: SearchFilters): boolean {
  if (f.category === "rent" || f.category === "resale") return false;
  if (f.category && p.category !== f.category) return false;
  if (f.localitySlug && p.localitySlug !== f.localitySlug) return false;
  if (f.possessionBy === "ready" && p.possession !== "ready") return false;
  if (typeof f.possessionBy === "number" && possessionYear(p.possession) > f.possessionBy) return false;
  const typeById = new Map(p.unitTypes.map((t) => [t.id, t]));
  return allUnits(p).some(
    (u) =>
      u.status === "available" &&
      (!f.bhk?.length || f.bhk.includes(typeById.get(u.unitTypeId)!.bhk)) &&
      (!f.minPaise || u.pricePaise >= f.minPaise) &&
      (!f.maxPaise || u.pricePaise <= f.maxPaise),
  );
}

function matchesListing(l: Listing, f: SearchFilters): boolean {
  if (f.category ? f.category !== l.kind : l.kind === "rent") return false;
  if (f.localitySlug && l.localitySlug !== f.localitySlug) return false;
  if (f.reraOnly && !l.rera) return false;
  if (f.bhk?.length && !f.bhk.includes(l.bhk)) return false;
  if (f.minPaise && l.pricePaise < f.minPaise) return false;
  if (f.maxPaise && l.pricePaise > f.maxPaise) return false;
  return true;
}

export function search(f: SearchFilters): SearchCard[] {
  const projects = listProjects(f.cityId)
    .filter((p) => matchesProject(p, f))
    .map((p) => {
      const card = projectCard(p, f.bhk);
      // Show the price band of units that actually fit the budget.
      const typeById = new Map(p.unitTypes.map((t) => [t.id, t]));
      const fits = allUnits(p)
        .filter((u) => u.status === "available" && (!f.bhk?.length || f.bhk.includes(typeById.get(u.unitTypeId)!.bhk)))
        .map((u) => u.pricePaise)
        .filter((x) => (!f.minPaise || x >= f.minPaise) && (!f.maxPaise || x <= f.maxPaise));
      return { ...card, priceFromPaise: Math.min(...fits), priceToPaise: Math.max(...fits) };
    });
  const listings = listListings(f.cityId)
    .filter((l) => matchesListing(l, f))
    .map(listingCard);
  const cards = [...projects, ...listings];
  const sort = f.sort ?? "price-asc";
  return cards.sort((a, b) =>
    sort === "price-desc" ? b.priceFromPaise - a.priceFromPaise
    : sort === "possession" ? possessionYear(a.possession) - possessionYear(b.possession) || a.priceFromPaise - b.priceFromPaise
    : a.priceFromPaise - b.priceFromPaise,
  );
}

export interface Suggestion {
  label: string;
  filters: SearchFilters;
  count: number;
}

/** Concrete next steps for an empty result: a nearby locality, a little more budget, or any BHK. */
export function suggestAlternatives(f: SearchFilters): Suggestion[] {
  const out: Suggestion[] = [];
  if (f.localitySlug) {
    const here = getLocality(f.cityId, f.localitySlug);
    const nearby = listLocalities(f.cityId)
      .filter((l) => l.slug !== f.localitySlug)
      .sort((a, b) => (here ? haversineKm(here.center, a.center) - haversineKm(here.center, b.center) : 0));
    for (const l of nearby) {
      const filters = { ...f, localitySlug: l.slug };
      const count = search(filters).length;
      if (count) {
        out.push({ label: `Widen to ${l.name}`, filters, count });
        break;
      }
    }
  }
  if (f.maxPaise) {
    const maxPaise = Math.round((f.maxPaise * 1.25) / 1e7) * 1e7;
    const filters = { ...f, maxPaise };
    const count = search(filters).length;
    if (count) out.push({ label: `Raise budget to ${formatINR(maxPaise)}`, filters, count });
  }
  if (f.bhk?.length) {
    const filters = { ...f, bhk: undefined };
    const count = search(filters).length;
    if (count) out.push({ label: "Any BHK", filters, count });
  }
  return out.slice(0, 2);
}

export interface LocalityStat {
  locality: Locality;
  homes: number;
  medianPsfPaise: number;
  vibe: number;
}

interface HomeForSale {
  pricePaise: number;
  carpetSqft: number;
  bhk: number;
}

/** Every home on sale right now: available flats in projects plus resale listings. Rentals are left out. */
function homesForSale(cityId: CityId, localitySlug?: string): HomeForSale[] {
  const out: HomeForSale[] = [];
  for (const p of listProjects(cityId)) {
    if (localitySlug && p.localitySlug !== localitySlug) continue;
    const typeById = new Map(p.unitTypes.map((t) => [t.id, t]));
    for (const u of allUnits(p))
      if (u.status === "available") {
        const t = typeById.get(u.unitTypeId)!;
        out.push({ pricePaise: u.pricePaise, carpetSqft: t.carpetSqft, bhk: t.bhk });
      }
  }
  for (const l of listListings(cityId))
    if (l.kind === "resale" && (!localitySlug || l.localitySlug === localitySlug)) out.push({ pricePaise: l.pricePaise, carpetSqft: l.carpetSqft, bhk: l.bhk });
  return out;
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const psf = (h: HomeForSale) => h.pricePaise / h.carpetSqft;

/** Live counts behind the city world: district height = homes, colour = ₹/sq ft. */
export function localityStats(cityId: CityId): LocalityStat[] {
  return listLocalities(cityId).map((locality) => {
    const homes = homesForSale(cityId, locality.slug);
    const rate = median(homes.map(psf)) ?? locality.basePsfPaise;
    return { locality, homes: homes.length, medianPsfPaise: Math.round(rate / 100) * 100, vibe: vibeScore(locality.vibe) };
  });
}

export interface BudgetReach {
  /** Median asking price per sq ft of carpet area across homes on sale in the city. */
  medianPsfPaise: number;
  /** Carpet area the budget buys at that median rate. */
  carpetSqft: number;
  /** Largest BHK whose median size in this city fits that area; null below a typical 1 BHK. */
  bhk: number | null;
  /** Search results (projects and resale homes) with at least one home at or under the budget. */
  results: number;
}

/** What a budget buys in a city at today's median asking rate, and how many results it opens. */
export function budgetReach(cityId: CityId, budgetPaise: number): BudgetReach {
  const homes = homesForSale(cityId);
  const medianPsfPaise = Math.round(median(homes.map(psf))! / 100) * 100;
  const carpetSqft = Math.round(budgetPaise / medianPsfPaise / 10) * 10;
  const bhks = [...new Set(homes.map((h) => h.bhk))].sort((a, b) => a - b);
  const fits = bhks.filter((b) => median(homes.filter((h) => h.bhk === b).map((h) => h.carpetSqft))! <= carpetSqft);
  return { medianPsfPaise, carpetSqft, bhk: fits.at(-1) ?? null, results: search({ cityId, maxPaise: budgetPaise }).length };
}

/** Live result counts per category, for "browse by category" links. */
export function categoryCounts(cityId: CityId): Record<CategoryId, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c.id, search({ cityId, category: c.id }).length])) as Record<CategoryId, number>;
}

/** Other projects a buyer of this one would also look at: same city, a shared BHK, nearest price; same locality first. */
export function similarProjects(p: Project, limit = 3): SearchCard[] {
  const s = projectSummary(p);
  return listProjects(p.cityId)
    .filter((o) => o.slug !== p.slug)
    .map((o) => ({ o, os: projectSummary(o) }))
    .filter(({ os }) => os.available > 0 && os.bhks.some((b) => s.bhks.includes(b)))
    .sort((a, b) => Number(b.o.localitySlug === p.localitySlug) - Number(a.o.localitySlug === p.localitySlug) || Math.abs(a.os.priceFrom - s.priceFrom) - Math.abs(b.os.priceFrom - s.priceFrom))
    .slice(0, limit)
    .map(({ o }) => projectCard(o));
}

export function similarListings(l: Listing, limit = 3): SearchCard[] {
  return listListings(l.cityId)
    .filter((o) => o.slug !== l.slug && o.kind === l.kind && Math.abs(o.bhk - l.bhk) <= 1)
    .sort((a, b) => Number(b.localitySlug === l.localitySlug) - Number(a.localitySlug === l.localitySlug) || Math.abs(a.pricePaise - l.pricePaise) - Math.abs(b.pricePaise - l.pricePaise))
    .slice(0, limit)
    .map(listingCard);
}

/** One column of the compare table. Numbers stay raw so the page can highlight the better value. */
export interface CompareRow {
  key: string;
  kind: "unit" | "project" | "listing";
  title: string;
  href: string;
  cityName: string;
  localityName: string;
  vibe: number;
  pricePaise: number;
  isRent: boolean;
  carpetSqft: number;
  carpetMaxSqft: number;
  psfPaise: number | null;
  bhk: string;
  floor: string;
  facing: Facing | null;
  possession: string;
  maintenancePaisePerMonth: number;
  parking: number;
  depositPaise: number | null;
  rera: string | null;
  partner: { id: string; name: string; type: PartnerType; verified: boolean };
  rooms: Room[] | null;
}

/** Resolves a shortlist key ("unit:<project>:<number>", "project:<slug>", "listing:<slug>"). */
export function compareRow(key: string): CompareRow | null {
  const [kind, slug, number] = key.split(":");
  if (kind === "listing" && slug) {
    const l = getListing(slug);
    if (!l) return null;
    const loc = getLocality(l.cityId, l.localitySlug)!;
    const partner = getPartner(l.partnerId)!;
    return {
      key, kind, title: `${formatBhk(l.bhk)} in ${l.buildingName}`, href: `/homes/${l.slug}`, cityName: getCity(l.cityId)!.name, localityName: loc.name, vibe: vibeScore(loc.vibe),
      pricePaise: l.pricePaise, isRent: l.kind === "rent", carpetSqft: l.carpetSqft, carpetMaxSqft: l.carpetSqft,
      psfPaise: l.kind === "rent" ? null : Math.round(l.pricePaise / l.carpetSqft), bhk: formatBhk(l.bhk),
      floor: `${ordinal(l.floor)} of ${l.totalFloors}`, facing: l.facing, possession: "ready", maintenancePaisePerMonth: l.maintenancePaisePerMonth,
      parking: l.parking, depositPaise: l.depositPaise ?? null, rera: l.rera?.number ?? null,
      partner: { id: partner.id, name: partner.name, type: partner.type, verified: partner.verified }, rooms: l.rooms,
    };
  }
  const p = slug ? getProject(slug) : undefined;
  if (!p) return null;
  const loc = getLocality(p.cityId, p.localitySlug)!;
  const dev = getPartner(p.developerId)!;
  const base = { cityName: getCity(p.cityId)!.name, localityName: loc.name, vibe: vibeScore(loc.vibe), isRent: false, possession: p.possession, depositPaise: null, rera: p.rera.number, partner: { id: dev.id, name: dev.name, type: dev.type, verified: dev.verified } };
  if (kind === "unit" && number) {
    const unit = allUnits(p).find((u) => u.number === number);
    const type = unit && p.unitTypes.find((t) => t.id === unit.unitTypeId);
    if (!unit || !type) return null;
    const tower = p.towers.find((t) => t.id === unit.towerId)!;
    return {
      ...base, key, kind, title: `${unit.number} · ${p.name}`, href: `/projects/${p.slug}?unit=${encodeURIComponent(unit.number)}#explorer`,
      pricePaise: unit.pricePaise, carpetSqft: type.carpetSqft, carpetMaxSqft: type.carpetSqft, psfPaise: Math.round(unit.pricePaise / type.carpetSqft),
      bhk: type.name, floor: tower.floors > 1 ? `${ordinal(unit.floor)} of ${tower.floors}` : "Independent villa", facing: unit.facing,
      maintenancePaisePerMonth: p.maintenancePaisePerSqft * type.carpetSqft, parking: type.parking, rooms: type.rooms,
    };
  }
  if (kind === "project") {
    const s = projectSummary(p);
    const smallest = [...p.unitTypes].sort((a, b) => a.carpetSqft - b.carpetSqft)[0]!;
    return {
      ...base, key, kind, title: p.name, href: `/projects/${p.slug}`, pricePaise: s.priceFrom, carpetSqft: s.carpetMin, carpetMaxSqft: s.carpetMax,
      psfPaise: null, bhk: s.bhks.map((b) => `${b}`).join(", ") + " BHK",
      floor: "Choose a flat", facing: null, maintenancePaisePerMonth: p.maintenancePaisePerSqft * smallest.carpetSqft, parking: smallest.parking, rooms: null,
    };
  }
  return null;
}

/** Everything a partner has live: projects for developers, listings for brokers and owners. */
export function partnerCards(partnerId: string): SearchCard[] {
  return [...projectsByPartner(partnerId).map((p) => projectCard(p)), ...listingsByPartner(partnerId).map(listingCard)];
}
