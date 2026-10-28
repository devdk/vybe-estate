// Source of truth: PostgreSQL 16 + PostGIS. Column keys are camelCase in code
// and snake_case in the database (drizzle `casing: "snake_case"`).
//
// Rules from the blueprint:
// - every business table carries tenant_id, so white-label sites need no migration
// - money is integer paise (bigint); areas are sq ft, carpet / built-up / super built-up kept apart
// - modules own their tables and talk through the outbox, so a module can move out later
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  date,
  geometry,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Boundaries as MultiPolygon in WGS84, read/written as EWKT. */
const multiPolygon = customType<{ data: string }>({ dataType: () => "geometry(MultiPolygon, 4326)" });
const point = (name: string) => geometry(name, { type: "point", mode: "tuple", srid: 4326 });
const paise = (name: string) => bigint(name, { mode: "number" });
const id = () => uuid().primaryKey().defaultRandom();
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());
const tenantId = () => uuid().notNull().references(() => tenants.id);

// ─── Platform ────────────────────────────────────────────────────────────────

export const tenantKind = pgEnum("tenant_kind", ["marketplace", "white_label"]);

export const tenants = pgTable("tenants", {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  kind: tenantKind().notNull().default("marketplace"),
  /** For white-label sites: the developer whose inventory the site shows. */
  partnerId: uuid(),
  createdAt: createdAt(),
});

export const settings = pgTable("settings", { tenantId: tenantId(), key: text().notNull(), value: jsonb().notNull(), updatedAt: updatedAt() }, (t) => [primaryKey({ columns: [t.tenantId, t.key] })]);

export const featureFlags = pgTable("feature_flags", { tenantId: tenantId(), key: text().notNull(), enabled: boolean().notNull().default(false), rules: jsonb() }, (t) => [primaryKey({ columns: [t.tenantId, t.key] })]);

export const auditLogs = pgTable(
  "audit_logs",
  { id: id(), tenantId: tenantId(), actorId: uuid(), action: text().notNull(), entity: text().notNull(), entityId: text().notNull(), before: jsonb(), after: jsonb(), at: createdAt() },
  (t) => [index().on(t.tenantId, t.entity, t.entityId)],
);

export const webhooks = pgTable("webhooks", {
  id: id(),
  tenantId: tenantId(),
  partnerId: uuid().notNull(),
  url: text().notNull(),
  /** HMAC secret for signed deliveries; stored encrypted at rest. */
  secret: text().notNull(),
  events: text().array().notNull(),
  active: boolean().notNull().default(true),
  createdAt: createdAt(),
});

/** Transactional outbox: modules publish change events here, a worker relays them. */
export const outbox = pgTable("outbox", { id: id(), topic: text().notNull(), key: text().notNull(), payload: jsonb().notNull(), createdAt: createdAt(), publishedAt: timestamp({ withTimezone: true }) }, (t) => [
  index().on(t.publishedAt).where(sql`${t.publishedAt} is null`),
]);

// ─── Geography (shared reference data, not tenant-scoped) ────────────────────

export const cities = pgTable("cities", { id: text().primaryKey(), name: text().notNull(), region: text().notNull(), state: text().notNull(), center: point("center").notNull() });

export const microMarkets = pgTable("micro_markets", {
  id: id(),
  cityId: text().notNull().references(() => cities.id),
  slug: text().notNull(),
  name: text().notNull(),
  boundary: multiPolygon(),
}, (t) => [uniqueIndex().on(t.cityId, t.slug)]);

export const localities = pgTable(
  "localities",
  {
    id: id(),
    cityId: text().notNull().references(() => cities.id),
    microMarketId: uuid().references(() => microMarkets.id),
    slug: text().notNull(),
    name: text().notNull(),
    center: point("center").notNull(),
    boundary: multiPolygon(),
    reraAuthority: text().notNull(),
  },
  (t) => [uniqueIndex().on(t.cityId, t.slug), index().using("gist", t.center)],
);

export const landmarkKind = pgEnum("landmark_kind", ["metro", "rail", "school", "hospital", "it_park", "park", "mall"]);

export const landmarks = pgTable(
  "landmarks",
  { id: id(), cityId: text().notNull().references(() => cities.id), kind: landmarkKind().notNull(), name: text().notNull(), location: point("location").notNull(), source: text().notNull(), sourceDate: date().notNull() },
  (t) => [index().using("gist", t.location)],
);

/** Recomputed nightly; every input keeps its source so the UI can cite it. */
export const vibeScores = pgTable("vibe_scores", {
  localityId: uuid().primaryKey().references(() => localities.id),
  commute: numeric({ precision: 3, scale: 1 }).notNull(),
  schools: numeric({ precision: 3, scale: 1 }).notNull(),
  greenCover: numeric({ precision: 3, scale: 1 }).notNull(),
  nightlife: numeric({ precision: 3, scale: 1 }).notNull(),
  appreciation: numeric({ precision: 3, scale: 1 }).notNull(),
  score: numeric({ precision: 3, scale: 1 }).notNull(),
  sources: jsonb().$type<{ factor: string; source: string; asOf: string }[]>().notNull(),
  computedAt: createdAt(),
});

// ─── Partners ────────────────────────────────────────────────────────────────

export const partnerType = pgEnum("partner_type", ["developer", "broker", "owner"]);
export const partnerStatus = pgEnum("partner_status", ["pending", "verified", "suspended"]);
export const memberRole = pgEnum("member_role", ["owner", "admin", "sales_manager", "agent"]);
export const checkStatus = pgEnum("check_status", ["pending", "passed", "failed", "expired"]);

export const partners = pgTable("partners", {
  id: id(),
  tenantId: tenantId(),
  type: partnerType().notNull(),
  name: text().notNull(),
  status: partnerStatus().notNull().default("pending"),
  cityId: text().references(() => cities.id),
  verifiedAt: timestamp({ withTimezone: true }),
  createdAt: createdAt(),
});

export const partnerMembers = pgTable(
  "partner_members",
  {
    partnerId: uuid().notNull().references(() => partners.id),
    userId: uuid().notNull().references(() => users.id),
    role: memberRole().notNull(),
    /** Sales managers and agents see only leads for these projects; empty = all. */
    projectIds: uuid().array().notNull().default(sql`'{}'::uuid[]`),
  },
  (t) => [primaryKey({ columns: [t.partnerId, t.userId] })],
);

export const kycChecks = pgTable("kyc_checks", {
  id: id(),
  tenantId: tenantId(),
  partnerId: uuid().notNull().references(() => partners.id),
  kind: text().$type<"pan" | "gstin" | "ownership" | "aadhaar_offline">().notNull(),
  status: checkStatus().notNull().default("pending"),
  providerRef: text(),
  checkedAt: timestamp({ withTimezone: true }),
});

/** Project and agent registrations; a failed or expired one hides listings where the state requires it. */
export const reraRegistrations = pgTable(
  "rera_registrations",
  {
    id: id(),
    tenantId: tenantId(),
    partnerId: uuid().references(() => partners.id),
    projectId: uuid().references(() => projects.id),
    authority: text().notNull(),
    number: text().notNull(),
    status: checkStatus().notNull().default("pending"),
    validUntil: date(),
    checkedAt: timestamp({ withTimezone: true }),
  },
  (t) => [uniqueIndex().on(t.authority, t.number)],
);

export const plans = pgTable("plans", {
  id: id(),
  tenantId: tenantId(),
  code: text().notNull(),
  name: text().notNull(),
  partnerType: partnerType().notNull(),
  monthlyPaise: paise("monthly_paise").notNull(),
  listingSlots: integer().notNull(),
  seats: integer().notNull(),
  monthlyCredits: integer().notNull(),
});

export const credits = pgTable("credits", { id: id(), tenantId: tenantId(), partnerId: uuid().notNull().references(() => partners.id), delta: integer().notNull(), reason: text().notNull(), refId: text(), createdAt: createdAt() });

// ─── Projects & inventory ────────────────────────────────────────────────────

export const projectCategory = pgEnum("project_category", ["new_launch", "under_construction", "ready_to_move", "plots_villas", "commercial"]);
export const unitStatus = pgEnum("unit_status", ["available", "on_hold", "booked", "sold"]);
export const facing = pgEnum("facing", ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);

export const projects = pgTable(
  "projects",
  {
    id: id(),
    tenantId: tenantId(),
    developerId: uuid().notNull().references(() => partners.id),
    cityId: text().notNull().references(() => cities.id),
    localityId: uuid().notNull().references(() => localities.id),
    slug: text().notNull(),
    name: text().notNull(),
    category: projectCategory().notNull(),
    location: point("location").notNull(),
    /** RERA possession date; null once the occupancy certificate is in. */
    possessionDate: date(),
    ocReceivedAt: date(),
    maintenancePaisePerSqft: integer().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex().on(t.tenantId, t.slug), index().on(t.cityId, t.localityId), index().using("gist", t.location)],
);

export const towers = pgTable("towers", { id: id(), projectId: uuid().notNull().references(() => projects.id), name: text().notNull(), floors: smallint().notNull(), stacks: smallint().notNull(), elevationMediaId: uuid() });

export const unitTypes = pgTable("unit_types", {
  id: id(),
  projectId: uuid().notNull().references(() => projects.id),
  name: text().notNull(),
  bhk: smallint().notNull(),
  carpetSqft: integer().notNull(),
  builtUpSqft: integer().notNull(),
  superBuiltUpSqft: integer().notNull(),
  bathrooms: smallint().notNull(),
  balconies: smallint().notNull(),
  parking: smallint().notNull(),
  /** Vector plan after ops QA: rooms, walls, doors, windows. */
  plan: jsonb(),
  planVersion: integer().notNull().default(1),
});

export const units = pgTable(
  "units",
  {
    id: id(),
    towerId: uuid().notNull().references(() => towers.id),
    unitTypeId: uuid().notNull().references(() => unitTypes.id),
    number: text().notNull(),
    floor: smallint().notNull(),
    stack: smallint().notNull(),
    facing: facing().notNull(),
    status: unitStatus().notNull().default("available"),
    pricePaise: paise("price_paise").notNull(),
    holdExpiresAt: timestamp({ withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex().on(t.towerId, t.number), index().on(t.status)],
);

export const priceLists = pgTable("price_lists", { id: id(), projectId: uuid().notNull().references(() => projects.id), version: integer().notNull(), effectiveFrom: date().notNull(), mediaId: uuid(), createdAt: createdAt() }, (t) => [
  uniqueIndex().on(t.projectId, t.version),
]);

export const amenities = pgTable("amenities", { projectId: uuid().notNull().references(() => projects.id), name: text().notNull() }, (t) => [primaryKey({ columns: [t.projectId, t.name] })]);

export const mediaKind = pgEnum("media_kind", ["photo", "render", "video", "floor_plan", "brochure", "panorama_360", "glb", "splat"]);
export const mediaLabel = pgEnum("media_label", ["real", "artists_impression", "virtually_staged"]);
export const mediaStatus = pgEnum("media_status", ["uploaded", "processing", "needs_review", "approved", "rejected"]);

export const media = pgTable(
  "media",
  {
    id: id(),
    tenantId: tenantId(),
    partnerId: uuid().references(() => partners.id),
    kind: mediaKind().notNull(),
    label: mediaLabel().notNull().default("real"),
    status: mediaStatus().notNull().default("uploaded"),
    storageKey: text().notNull(),
    sha256: text().notNull(),
    /** Perceptual hash, checked against the whole library for stolen or reused photos. */
    phash: text(),
    exifTakenAt: timestamp({ withTimezone: true }),
    exifLocation: point("exif_location"),
    width: integer(),
    height: integer(),
    /** Dominant colours that tint the 3D lighting to match the photos. */
    palette: text().array(),
    /** Set for virtually staged images: the empty-room original shown beside it. */
    originalMediaId: uuid(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.phash), uniqueIndex().on(t.tenantId, t.sha256)],
);

export const models3d = pgTable("models_3d", {
  id: id(),
  unitTypeId: uuid().notNull().references(() => unitTypes.id),
  tier: smallint().$type<1 | 2 | 3>().notNull(),
  mediaId: uuid().notNull().references(() => media.id),
  version: integer().notNull(),
  bytes: integer().notNull(),
  status: mediaStatus().notNull().default("processing"),
  createdAt: createdAt(),
});

// ─── Listings ────────────────────────────────────────────────────────────────

export const listingKind = pgEnum("listing_kind", ["new", "resale", "rent", "plot"]);
export const listingStatus = pgEnum("listing_status", ["draft", "pending_review", "live", "paused", "removed"]);

/** Facts-first: the fields buyers need are required columns, not free text. */
export const listings = pgTable(
  "listings",
  {
    id: id(),
    tenantId: tenantId(),
    partnerId: uuid().notNull().references(() => partners.id),
    kind: listingKind().notNull(),
    projectId: uuid().references(() => projects.id),
    unitId: uuid().references(() => units.id),
    cityId: text().notNull().references(() => cities.id),
    localityId: uuid().notNull().references(() => localities.id),
    location: point("location").notNull(),
    slug: text().notNull(),
    buildingName: text().notNull(),
    bhk: smallint().notNull(),
    carpetSqft: integer().notNull(),
    floor: smallint().notNull(),
    totalFloors: smallint().notNull(),
    facing: facing().notNull(),
    possessionDate: date(),
    parking: smallint().notNull(),
    maintenancePaisePerMonth: integer().notNull(),
    pricePaise: paise("price_paise").notNull(),
    depositPaise: paise("deposit_paise"),
    minLeaseMonths: smallint(),
    reraNumber: text(),
    description: text(),
    /** "Drafted with AI from your details": shown until the partner edits it. */
    descriptionAiDrafted: boolean().notNull().default(false),
    status: listingStatus().notNull().default("draft"),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex().on(t.tenantId, t.slug), index().on(t.cityId, t.status, t.kind), index().using("gist", t.location)],
);

export const listingVersions = pgTable("listing_versions", { id: id(), listingId: uuid().notNull().references(() => listings.id), version: integer().notNull(), snapshot: jsonb().notNull(), pricePaise: paise("price_paise").notNull(), createdBy: uuid(), createdAt: createdAt() }, (t) => [
  uniqueIndex().on(t.listingId, t.version),
]);

// ─── Demand ──────────────────────────────────────────────────────────────────

export const leadStage = pgEnum("lead_stage", ["new", "contacted", "visit_booked", "visited", "negotiating", "token_paid", "booked", "lost"]);
export const leadEventKind = pgEnum("lead_event_kind", ["masked_call", "chat", "visit", "video_tour", "note", "stage_change"]);
export const visitStatus = pgEnum("visit_status", ["requested", "confirmed", "done", "cancelled", "no_show"]);

export const users = pgTable("users", {
  id: id(),
  tenantId: tenantId(),
  phoneE164: text().notNull(),
  phoneVerifiedAt: timestamp({ withTimezone: true }),
  name: text(),
  email: text(),
  locale: text().notNull().default("en-IN"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex().on(t.tenantId, t.phoneE164)]);

/** DPDP Act: one row per purpose the buyer agreed to, revocable. */
export const consents = pgTable("consents", { id: id(), tenantId: tenantId(), userId: uuid().notNull().references(() => users.id), purpose: text().notNull(), partnerId: uuid().references(() => partners.id), grantedAt: createdAt(), withdrawnAt: timestamp({ withTimezone: true }) });

export const shortlists = pgTable("shortlists", { userId: uuid().notNull().references(() => users.id), listingId: uuid().notNull().references(() => listings.id), unitId: uuid().references(() => units.id), createdAt: createdAt() }, (t) => [
  uniqueIndex().on(t.userId, t.listingId, t.unitId),
]);

export const savedSearches = pgTable("saved_searches", { id: id(), tenantId: tenantId(), userId: uuid().notNull().references(() => users.id), cityId: text().notNull().references(() => cities.id), filters: jsonb().notNull(), channel: text().$type<"whatsapp" | "email" | "push">().notNull(), createdAt: createdAt() });

export const leads = pgTable(
  "leads",
  {
    id: id(),
    tenantId: tenantId(),
    userId: uuid().notNull().references(() => users.id),
    listingId: uuid().notNull().references(() => listings.id),
    partnerId: uuid().notNull().references(() => partners.id),
    assignedTo: uuid().references(() => users.id),
    stage: leadStage().notNull().default("new"),
    /** Pay-per-lead charges only OTP-verified leads whose budget matches the listing. */
    verifiedAt: timestamp({ withTimezone: true }),
    budgetMatch: boolean().notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.partnerId, t.stage), uniqueIndex().on(t.userId, t.listingId)],
);

export const leadEvents = pgTable("lead_events", { id: id(), leadId: uuid().notNull().references(() => leads.id), kind: leadEventKind().notNull(), payload: jsonb(), actorId: uuid(), createdAt: createdAt() }, (t) => [index().on(t.leadId, t.createdAt)]);

export const siteVisits = pgTable("site_visits", {
  id: id(),
  tenantId: tenantId(),
  leadId: uuid().notNull().references(() => leads.id),
  reference: text().notNull(),
  scheduledFor: timestamp({ withTimezone: true }).notNull(),
  status: visitStatus().notNull().default("requested"),
  createdAt: createdAt(),
});

export const videoTours = pgTable("video_tours", { id: id(), tenantId: tenantId(), leadId: uuid().notNull().references(() => leads.id), scheduledFor: timestamp({ withTimezone: true }).notNull(), roomUrl: text(), status: visitStatus().notNull().default("requested") });

// ─── Money ───────────────────────────────────────────────────────────────────

export const tokenStatus = pgEnum("token_status", ["created", "held", "released", "refunded", "failed"]);

/** Refundable token: held for the agreed window, then released to the developer or refunded. */
export const tokenPayments = pgTable("token_payments", {
  id: id(),
  tenantId: tenantId(),
  leadId: uuid().notNull().references(() => leads.id),
  unitId: uuid().notNull().references(() => units.id),
  amountPaise: paise("amount_paise").notNull(),
  status: tokenStatus().notNull().default("created"),
  razorpayOrderId: text().notNull().unique(),
  razorpayPaymentId: text(),
  holdExpiresAt: timestamp({ withTimezone: true }),
  idempotencyKey: text().notNull().unique(),
  createdAt: createdAt(),
});

export const refunds = pgTable("refunds", { id: id(), tokenPaymentId: uuid().notNull().references(() => tokenPayments.id), amountPaise: paise("amount_paise").notNull(), razorpayRefundId: text(), reason: text().notNull(), createdAt: createdAt() });

export const subscriptions = pgTable("subscriptions", { id: id(), tenantId: tenantId(), partnerId: uuid().notNull().references(() => partners.id), planId: uuid().notNull().references(() => plans.id), startsOn: date().notNull(), endsOn: date(), status: text().$type<"active" | "past_due" | "cancelled">().notNull() });

export const invoices = pgTable("invoices", { id: id(), tenantId: tenantId(), partnerId: uuid().notNull().references(() => partners.id), number: text().notNull().unique(), totalPaise: paise("total_paise").notNull(), gstPaise: paise("gst_paise").notNull(), issuedOn: date().notNull(), paidAt: timestamp({ withTimezone: true }) });

export const leadCharges = pgTable("lead_charges", { id: id(), tenantId: tenantId(), leadId: uuid().notNull().references(() => leads.id).unique(), partnerId: uuid().notNull().references(() => partners.id), amountPaise: paise("amount_paise").notNull(), invoiceId: uuid().references(() => invoices.id), createdAt: createdAt() });

/** Double-entry ledger: every money step (token, release, refund, fee) writes balanced rows. */
export const ledgerEntries = pgTable("ledger_entries", {
  id: id(),
  tenantId: tenantId(),
  txnId: uuid().notNull(),
  account: text().notNull(),
  debitPaise: paise("debit_paise").notNull().default(0),
  creditPaise: paise("credit_paise").notNull().default(0),
  refType: text().notNull(),
  refId: uuid().notNull(),
  createdAt: createdAt(),
}, (t) => [index().on(t.txnId), index().on(t.refType, t.refId)]);

// ─── Trust ───────────────────────────────────────────────────────────────────

export const verifications = pgTable("verifications", { id: id(), tenantId: tenantId(), subjectType: text().notNull(), subjectId: uuid().notNull(), check: text().notNull(), status: checkStatus().notNull(), detail: jsonb(), checkedAt: createdAt() });

export const reports = pgTable("reports", { id: id(), tenantId: tenantId(), listingId: uuid().notNull().references(() => listings.id), mediaId: uuid().references(() => media.id), reporterId: uuid().references(() => users.id), reason: text().notNull(), status: text().$type<"open" | "upheld" | "dismissed">().notNull().default("open"), createdAt: createdAt() });

/** Listings of the same physical unit across brokers, grouped for moderation. */
export const duplicateClusters = pgTable("duplicate_clusters", { id: id(), tenantId: tenantId(), canonicalListingId: uuid().references(() => listings.id), createdAt: createdAt() });
export const duplicateClusterMembers = pgTable("duplicate_cluster_members", { clusterId: uuid().notNull().references(() => duplicateClusters.id), listingId: uuid().notNull().references(() => listings.id), score: numeric({ precision: 4, scale: 3 }).notNull() }, (t) => [
  primaryKey({ columns: [t.clusterId, t.listingId] }),
]);

/** Partner reviews only from buyers with a completed site visit. */
export const reviews = pgTable("reviews", {
  id: id(),
  tenantId: tenantId(),
  partnerId: uuid().notNull().references(() => partners.id),
  userId: uuid().notNull().references(() => users.id),
  siteVisitId: uuid().notNull().references(() => siteVisits.id).unique(),
  rating: smallint().notNull(),
  body: text(),
  createdAt: createdAt(),
});
