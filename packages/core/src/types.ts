// Domain types shared by the buyer app, partner console, admin console and API.
// Money is always integer paise; areas are always sq ft.

export type CityId = "mumbai" | "bengaluru" | "pune" | "delhi-ncr" | "hyderabad";

/** [longitude, latitude] in WGS84, matching PostGIS / GeoJSON order. */
export type LngLat = readonly [lng: number, lat: number];

export const CATEGORIES = [
  { id: "new-launch", label: "New launch" },
  { id: "under-construction", label: "Under construction" },
  { id: "ready-to-move", label: "Ready to move" },
  { id: "resale", label: "Resale" },
  { id: "rent", label: "Rent" },
  { id: "plots-villas", label: "Plots & villas" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type ProjectCategory = Exclude<CategoryId, "resale" | "rent">;
export type ListingKind = "resale" | "rent";

export type UnitStatus = "available" | "on_hold" | "booked" | "sold";
export type Facing = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export type PartnerType = "developer" | "broker" | "owner";

/** Every figure shown to a buyer carries where it came from and when. */
export interface Sourced {
  source: string;
  asOf: string;
}

export interface City {
  id: CityId;
  name: string;
  region: string;
  state: string;
  center: LngLat;
  sales: { units: number; yoyPct: number } & Sourced;
}

export interface VibeInputs {
  commute: number;
  schools: number;
  greenCover: number;
  nightlife: number;
  appreciation: number;
}

export interface Locality {
  slug: string;
  cityId: CityId;
  name: string;
  /** Approximate centre; real boundaries come from the admin city builder. */
  center: LngLat;
  reraAuthority: string;
  vibe: VibeInputs;
  /** Base carpet rate used by the demo generator, in paise per sq ft. */
  basePsfPaise: number;
}

export interface Partner {
  id: string;
  type: PartnerType;
  name: string;
  cityId: CityId;
  verified: boolean;
  /** Agent registration for brokers; developers carry RERA per project. */
  agentRera?: string;
  since: number;
}

export interface Room {
  name: string;
  widthFt: number;
  lengthFt: number;
  /** Balconies are shown on the plan but are not part of RERA carpet area. */
  balcony?: boolean;
}

export interface UnitType {
  id: string;
  name: string;
  bhk: number;
  carpetSqft: number;
  builtUpSqft: number;
  superBuiltUpSqft: number;
  bathrooms: number;
  balconies: number;
  parking: number;
  rooms: Room[];
}

export interface Unit {
  id: string;
  number: string;
  towerId: string;
  floor: number;
  stack: number;
  unitTypeId: string;
  facing: Facing;
  status: UnitStatus;
  pricePaise: number;
}

export interface Tower {
  id: string;
  name: string;
  floors: number;
  stacks: number;
  units: Unit[];
}

export interface Project {
  slug: string;
  name: string;
  developerId: string;
  cityId: CityId;
  localitySlug: string;
  category: ProjectCategory;
  location: LngLat;
  rera: { number: string; authority: string };
  /** "ready" once the occupancy certificate is in, otherwise RERA possession as YYYY-MM. */
  possession: string;
  maintenancePaisePerSqft: number;
  amenities: string[];
  unitTypes: UnitType[];
  towers: Tower[];
  priceList: { version: number; effectiveFrom: string };
}

export interface Listing {
  slug: string;
  kind: ListingKind;
  partnerId: string;
  cityId: CityId;
  localitySlug: string;
  location: LngLat;
  buildingName: string;
  bhk: number;
  carpetSqft: number;
  floor: number;
  totalFloors: number;
  facing: Facing;
  furnishing: "Unfurnished" | "Semi-furnished" | "Furnished";
  parking: number;
  maintenancePaisePerMonth: number;
  ageYears: number;
  /** Sale price for resale, monthly rent for rent. */
  pricePaise: number;
  depositPaise?: number;
  minLeaseMonths?: number;
  /** Project RERA number when the building is in a registered project. */
  rera?: { number: string; authority: string };
  rooms: Room[];
  postedOn: string;
}
