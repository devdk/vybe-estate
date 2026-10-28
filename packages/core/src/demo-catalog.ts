// Deterministic demo inventory so the buyer app runs before partner onboarding
// exists. Every name, price, status and RERA number here is invented and is
// labelled as demo data in the UI. Replace with the Postgres repository.
import { CITIES, LOCALITIES } from "./cities";
import { carpetFromRooms, roomArea } from "./floorplan";
import type { City, Facing, Listing, Locality, Partner, Project, ProjectCategory, Room, Tower, Unit, UnitStatus, UnitType } from "./types";

export interface Catalog {
  partners: Map<string, Partner>;
  projects: Project[];
  listings: Listing[];
}

/** Seeded PRNG (cyrb-style hash into mulberry32) so SSR and client agree. */
export function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (r: () => number, lo: number, hi: number) => lo + r() * (hi - lo);
const intBetween = (r: () => number, lo: number, hi: number) => Math.floor(between(r, lo, hi + 1));
const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
const half = (n: number) => Math.round(n * 2) / 2;
const pad = (n: number) => String(n).padStart(2, "0");
export const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const FACINGS: Facing[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const DEVELOPERS = ["Kestrel Habitats", "Monsoon Ridge Developers", "Saltpan Builders", "Banyan Grid Realty", "Teakline Developers", "Ochre Stone Builders", "Riverbend Constructions", "Copperleaf Developers", "Granite Arc Realty", "Lattice Homes", "Basalt Line Developers", "Palash Infra", "Jamun Tree Builders", "Vetiver Homes", "Sandbar Habitat Co."];
const BROKERS = ["Doorstep Realty Partners", "Keystone Home Advisors", "Northstar Property Desk", "Tiled Roof Realtors", "Courtyard Estate Agents", "Plinth & Beam Realty", "Gateway Lane Properties", "Lantern Street Realtors", "Square Foot Advisors", "Open Door Property Co."];
const OWNERS = ["Meera K.", "Arjun S.", "Farah N.", "Vikram R.", "Ananya P.", "Rohit D.", "Sana M.", "Kiran B.", "Deepa R.", "Imran H."];
const PROJECT_NAMES = ["Tamarind Court", "Skylark Towers", "Cobalt Heights", "Juniper Residency", "Saffron Square", "Banyan Crest", "Indigo Park", "Halcyon Towers", "Monsoon Terraces", "Seven Palms", "Amber Fields", "Cedar Lane", "Lotus Row", "Harbour Line", "Peepal Grove", "Kingfisher Enclave", "Marigold Residences", "Teak Hollow", "Sandstone Greens", "Neem Court", "Amaltas Towers", "Rain Tree Residency", "Chinar Heights", "Bakul Residency", "Cassia Towers", "Pebble Bay", "Silver Birch Court", "Tidewater Residences", "Jacaranda Heights", "Kadamba Park", "Sal Forest Towers", "Ivory Lane"];
const VILLA_NAMES = ["Laterite Villas", "Bougainvillea Lane", "Red Earth Villas", "Riverstone Villas", "Gulmohar Estates", "Palm Shade Villas", "Hibiscus Row", "Coconut Grove Villas", "Frangipani Lane", "Champa Villas", "Ber Tree Villas"];
const BUILDINGS = ["Shanti Kunj CHS", "Sai Darshan Apartments", "Green Acres", "Lake View Residency", "Sunrise Towers", "Palm Grove", "Silver Oak Apartments", "Ganga Heights", "Orchid Enclave", "Classic Residency", "Vasant Vihar CHS", "Prakash Apartments"];
const AMENITIES = ["Clubhouse", "Swimming pool", "Gym", "Children's play area", "EV charging", "Power backup", "Rainwater harvesting", "Jogging track", "Indoor games", "Co-working lounge"];
const PROJECT_CATEGORIES: ProjectCategory[] = ["new-launch", "under-construction", "ready-to-move", "plots-villas"];

const AUTHORITY_CODE: Record<string, string> = { MahaRERA: "MH", "K-RERA": "KA", "HRERA Gurugram": "HR", "UP RERA": "UP", "TG RERA": "TG" };
const demoRera = (authority: string, r: () => number, prefix = "P") => `DEMO-${AUTHORITY_CODE[authority] ?? "IN"}-${prefix}${intBetween(r, 10000, 99999)}`;

const TYPE_SPECS: Record<number, { carpet: [number, number]; baths: number; balconies: number; parking: number }> = {
  1: { carpet: [420, 520], baths: 1, balconies: 1, parking: 1 },
  2: { carpet: [640, 780], baths: 2, balconies: 1, parking: 1 },
  3: { carpet: [950, 1180], baths: 3, balconies: 2, parking: 2 },
  4: { carpet: [1450, 1800], baths: 4, balconies: 2, parking: 2 },
};

function sizedRoom(name: string, area: number, aspect: number, balcony = false): Room {
  const widthFt = Math.max(4, half(Math.sqrt(area / aspect)));
  return { name, widthFt, lengthFt: half(area / widthFt), ...(balcony ? { balcony } : {}) };
}

/** Room list whose non-balcony areas add up to the target carpet area. */
function buildRooms(r: () => number, bhk: number, carpet: number, baths: number, balconies: number, villa: boolean): Room[] {
  const parts: { name: string; weight: number }[] = [
    { name: "Living & dining", weight: 3 + bhk * 0.35 },
    { name: "Kitchen", weight: 1 },
    ...Array.from({ length: bhk }, (_, i) => ({ name: i === 0 ? "Main bedroom" : `Bedroom ${i + 1}`, weight: i === 0 ? 1.9 : 1.5 })),
    ...Array.from({ length: baths }, (_, i) => ({ name: `Bathroom ${i + 1}`, weight: 0.5 })),
    ...(bhk >= 3 ? [{ name: "Utility", weight: 0.35 }] : []),
    ...(villa ? [{ name: "Family lounge", weight: 1.8 }] : []),
  ];
  const total = parts.reduce((s, p) => s + p.weight, 0);
  const rooms = parts.map((p) => sizedRoom(p.name, (p.weight / total) * carpet, between(r, 1, 1.35)));
  for (let i = 0; i < balconies; i++) rooms.push(sizedRoom(balconies > 1 ? `Balcony ${i + 1}` : "Balcony", carpet * 0.05, 2.6, true));
  return rooms;
}

function buildUnitType(r: () => number, id: string, bhk: number, villa: boolean): UnitType {
  const spec = villa ? { carpet: [1900, 2600] as [number, number], baths: bhk + 1, balconies: 2, parking: 2 } : TYPE_SPECS[bhk]!;
  const rooms = buildRooms(r, bhk, between(r, ...spec.carpet), spec.baths, spec.balconies, villa);
  const carpetSqft = Math.round(carpetFromRooms(rooms));
  const balconyArea = rooms.filter((x) => x.balcony).reduce((s, x) => s + roomArea(x), 0);
  const builtUpSqft = Math.round(carpetSqft * 1.1 + balconyArea);
  return {
    id,
    name: villa ? `${bhk} BHK villa` : `${bhk} BHK`,
    bhk,
    carpetSqft,
    builtUpSqft,
    superBuiltUpSqft: Math.round(builtUpSqft * 1.28),
    bathrooms: spec.baths,
    balconies: spec.balconies,
    parking: spec.parking,
    rooms,
  };
}

const SOLD_SHARE: Record<ProjectCategory, number> = { "new-launch": 0.22, "under-construction": 0.5, "ready-to-move": 0.72, "plots-villas": 0.45 };

function buildProject(city: City, loc: Locality, index: number, dev: Partner, category: ProjectCategory, name: string): Project {
  const r = rng(`${loc.slug}:project:${index}`);
  const villa = category === "plots-villas";
  const slug = `${slugify(name)}-${loc.slug}`;
  const base = loc.basePsfPaise / 100;
  const bhks = villa ? [3, 4] : base >= 25_000 ? [1, 2, 3] : base >= 12_000 ? [2, 3, 4] : [2, 3];
  const unitTypes = bhks.map((bhk, i) => buildUnitType(r, `${slug}:t${i}`, bhk, villa));
  const psfPaise = Math.round((loc.basePsfPaise * between(r, 0.92, 1.1)) / 10_000) * 10_000;
  const [minF, maxF] = city.id === "mumbai" ? [22, 42] : city.id === "delhi-ncr" ? [18, 32] : [14, 30];
  const towerCount = villa ? 1 : intBetween(r, 1, 3);
  const sold = SOLD_SHARE[category];

  const towers: Tower[] = Array.from({ length: towerCount }, (_, ti) => {
    const towerName = villa ? "Phase 1" : String.fromCharCode(65 + ti);
    const towerId = `${slug}:${towerName.replace(/\s/g, "").toLowerCase()}`;
    const floors = villa ? 1 : intBetween(r, minF, maxF);
    const stacks = villa ? intBetween(r, 10, 16) : intBetween(r, 4, 6);
    const stackType = Array.from({ length: stacks }, (_, s) => unitTypes[(s + ti) % unitTypes.length]!);
    const stackFacing = Array.from({ length: stacks }, () => pick(r, FACINGS));
    const units: Unit[] = [];
    for (let floor = 1; floor <= floors; floor++)
      for (let stack = 1; stack <= stacks; stack++) {
        const type = stackType[stack - 1]!;
        const facing = stackFacing[stack - 1]!;
        const x = r();
        const status: UnitStatus = x < sold ? "sold" : x < sold + 0.04 ? "booked" : x < sold + 0.1 ? "on_hold" : "available";
        const floorRise = villa ? 1 : 1 + 0.005 * Math.max(0, floor - 4);
        const facingPremium = facing === "N" || facing === "E" || facing === "NE" ? 1.02 : 1;
        const pricePaise = Math.round((type.carpetSqft * psfPaise * floorRise * facingPremium) / 1_000_000) * 1_000_000;
        const number = villa ? `V-${pad(stack)}` : `${towerName}-${floor}${pad(stack)}`;
        units.push({ id: `${towerId}:${floor}-${stack}`, number, towerId, floor, stack, unitTypeId: type.id, facing, status, pricePaise });
      }
    return { id: towerId, name: villa ? towerName : `Tower ${towerName}`, floors, stacks, units };
  });

  const possession =
    category === "ready-to-move" ? "ready"
    : category === "new-launch" ? `${intBetween(r, 2030, 2031)}-${pad(intBetween(r, 1, 12))}`
    : category === "plots-villas" ? `2028-${pad(intBetween(r, 1, 12))}`
    : `${intBetween(r, 2027, 2029)}-${pad(intBetween(r, 1, 12))}`;

  const amenities = [...AMENITIES].sort(() => r() - 0.5).slice(0, intBetween(r, 5, 8));
  const maintenanceRupees = city.id === "mumbai" ? between(r, 6, 9) : between(r, 3, 5);

  return {
    slug,
    name,
    developerId: dev.id,
    cityId: city.id,
    localitySlug: loc.slug,
    category,
    location: [loc.center[0] + between(r, -0.012, 0.012), loc.center[1] + between(r, -0.012, 0.012)],
    rera: { number: demoRera(loc.reraAuthority, r), authority: loc.reraAuthority },
    possession,
    maintenancePaisePerSqft: Math.round(maintenanceRupees * 2) * 50,
    amenities,
    unitTypes,
    towers,
    priceList: { version: intBetween(r, 1, 4), effectiveFrom: `2026-${pad(intBetween(r, 7, 9))}-01` },
  };
}

function buildListing(city: City, loc: Locality, index: number, kind: Listing["kind"], partner: Partner): Listing {
  const r = rng(`${loc.slug}:listing:${index}`);
  const bhk = intBetween(r, 1, 3);
  const spec = TYPE_SPECS[bhk]!;
  const rooms = buildRooms(r, bhk, between(r, ...spec.carpet), spec.baths, spec.balconies, false);
  const carpetSqft = Math.round(carpetFromRooms(rooms));
  const totalFloors = intBetween(r, 7, 26);
  const ageYears = intBetween(r, 2, 16);
  const psfPaise = loc.basePsfPaise * between(r, 0.85, 1) * (1 - ageYears * 0.008);
  const salePaise = Math.round((carpetSqft * psfPaise) / 5_000_000) * 5_000_000;
  const rentPaise = Math.round((salePaise * 0.028) / 12 / 50_000) * 50_000;
  const buildingName = pick(r, BUILDINGS);
  const rera = ageYears <= 8 && r() < 0.7 ? { number: demoRera(loc.reraAuthority, r), authority: loc.reraAuthority } : undefined;
  return {
    slug: `${bhk}-bhk-${kind === "rent" ? "for-rent" : "for-sale"}-${slugify(buildingName)}-${loc.slug}-${index}`,
    kind,
    partnerId: partner.id,
    cityId: city.id,
    localitySlug: loc.slug,
    location: [loc.center[0] + between(r, -0.015, 0.015), loc.center[1] + between(r, -0.015, 0.015)],
    buildingName,
    bhk,
    carpetSqft,
    floor: intBetween(r, 1, totalFloors),
    totalFloors,
    facing: pick(r, FACINGS),
    furnishing: pick(r, ["Unfurnished", "Semi-furnished", "Furnished"] as const),
    parking: spec.parking,
    maintenancePaisePerMonth: Math.round((carpetSqft * between(r, 3, 6)) / 100) * 100 * 100,
    ageYears,
    pricePaise: kind === "rent" ? rentPaise : salePaise,
    ...(kind === "rent" ? { depositPaise: rentPaise * (city.id === "bengaluru" ? 6 : 3), minLeaseMonths: 11 } : {}),
    ...(rera ? { rera } : {}),
    rooms,
    postedOn: `2026-10-${pad(intBetween(r, 1, 26))}`,
  };
}

export function buildDemoCatalog(): Catalog {
  const partners = new Map<string, Partner>();
  const projects: Project[] = [];
  const listings: Listing[] = [];

  // Project names are unique across all cities, so one name never means two developers.
  const usedNames = new Set<string>();

  CITIES.forEach((city, ci) => {
    const r = rng(`partners:${city.id}`);
    const devs = [0, 1, 2].map((i) => ({ id: slugify(DEVELOPERS[ci * 3 + i]!), type: "developer" as const, name: DEVELOPERS[ci * 3 + i]!, cityId: city.id, verified: true, since: intBetween(r, 1994, 2018) }));
    const authority = LOCALITIES.find((l) => l.cityId === city.id)!.reraAuthority;
    const brokers = [0, 1].map((i) => ({ id: slugify(BROKERS[ci * 2 + i]!), type: "broker" as const, name: BROKERS[ci * 2 + i]!, cityId: city.id, verified: true, agentRera: demoRera(authority, r, "A"), since: intBetween(r, 2008, 2022) }));
    const owners = [0, 1].map((i) => ({ id: `owner-${city.id}-${i}`, type: "owner" as const, name: OWNERS[ci * 2 + i]!, cityId: city.id, verified: i === 0, since: 2026 }));
    [...devs, ...brokers, ...owners].forEach((p) => partners.set(p.id, p));

    const nextName = (villa: boolean) => {
      const pool = villa ? VILLA_NAMES : PROJECT_NAMES;
      let i = Math.floor(r() * pool.length);
      while (usedNames.has(pool[i % pool.length]!)) i++;
      const name = pool[i % pool.length]!;
      usedNames.add(name);
      return name;
    };

    let pIndex = 0;
    let lIndex = 0;
    LOCALITIES.filter((l) => l.cityId === city.id).forEach((loc) => {
      for (let k = 0; k < 2; k++) {
        const category = PROJECT_CATEGORIES[pIndex % PROJECT_CATEGORIES.length]!;
        projects.push(buildProject(city, loc, pIndex, devs[pIndex % devs.length]!, category, nextName(category === "plots-villas")));
        pIndex++;
      }
      (["resale", "resale", "rent"] as const).forEach((kind, k) => {
        const partner = k === 1 ? owners[lIndex % owners.length]! : brokers[lIndex % brokers.length]!;
        listings.push(buildListing(city, loc, lIndex++, kind, partner));
      });
    });
  });

  return { partners, projects, listings };
}
