CREATE TYPE "public"."check_status" AS ENUM('pending', 'passed', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."facing" AS ENUM('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW');--> statement-breakpoint
CREATE TYPE "public"."landmark_kind" AS ENUM('metro', 'rail', 'school', 'hospital', 'it_park', 'park', 'mall');--> statement-breakpoint
CREATE TYPE "public"."lead_event_kind" AS ENUM('masked_call', 'chat', 'visit', 'video_tour', 'note', 'stage_change');--> statement-breakpoint
CREATE TYPE "public"."lead_stage" AS ENUM('new', 'contacted', 'visit_booked', 'visited', 'negotiating', 'token_paid', 'booked', 'lost');--> statement-breakpoint
CREATE TYPE "public"."listing_kind" AS ENUM('new', 'resale', 'rent', 'plot');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'pending_review', 'live', 'paused', 'removed');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('photo', 'render', 'video', 'floor_plan', 'brochure', 'panorama_360', 'glb', 'splat');--> statement-breakpoint
CREATE TYPE "public"."media_label" AS ENUM('real', 'artists_impression', 'virtually_staged');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('uploaded', 'processing', 'needs_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'sales_manager', 'agent');--> statement-breakpoint
CREATE TYPE "public"."partner_status" AS ENUM('pending', 'verified', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."partner_type" AS ENUM('developer', 'broker', 'owner');--> statement-breakpoint
CREATE TYPE "public"."project_category" AS ENUM('new_launch', 'under_construction', 'ready_to_move', 'plots_villas', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."tenant_kind" AS ENUM('marketplace', 'white_label');--> statement-breakpoint
CREATE TYPE "public"."token_status" AS ENUM('created', 'held', 'released', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."unit_status" AS ENUM('available', 'on_hold', 'booked', 'sold');--> statement-breakpoint
CREATE TYPE "public"."visit_status" AS ENUM('requested', 'confirmed', 'done', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TABLE "amenities" (
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "amenities_project_id_name_pk" PRIMARY KEY("project_id","name")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"state" text NOT NULL,
	"center" geometry(point) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"partner_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duplicate_cluster_members" (
	"cluster_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"score" numeric(4, 3) NOT NULL,
	CONSTRAINT "duplicate_cluster_members_cluster_id_listing_id_pk" PRIMARY KEY("cluster_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "duplicate_clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"canonical_listing_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"tenant_id" uuid NOT NULL,
	"key" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"rules" jsonb,
	CONSTRAINT "feature_flags_tenant_id_key_pk" PRIMARY KEY("tenant_id","key")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"number" text NOT NULL,
	"total_paise" bigint NOT NULL,
	"gst_paise" bigint NOT NULL,
	"issued_on" date NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "invoices_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "kyc_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"status" "check_status" DEFAULT 'pending' NOT NULL,
	"provider_ref" text,
	"checked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "landmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" text NOT NULL,
	"kind" "landmark_kind" NOT NULL,
	"name" text NOT NULL,
	"location" geometry(point) NOT NULL,
	"source" text NOT NULL,
	"source_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"amount_paise" bigint NOT NULL,
	"invoice_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_charges_leadId_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE "lead_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"kind" "lead_event_kind" NOT NULL,
	"payload" jsonb,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"assigned_to" uuid,
	"stage" "lead_stage" DEFAULT 'new' NOT NULL,
	"verified_at" timestamp with time zone,
	"budget_match" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"txn_id" uuid NOT NULL,
	"account" text NOT NULL,
	"debit_paise" bigint DEFAULT 0 NOT NULL,
	"credit_paise" bigint DEFAULT 0 NOT NULL,
	"ref_type" text NOT NULL,
	"ref_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"price_paise" bigint NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"kind" "listing_kind" NOT NULL,
	"project_id" uuid,
	"unit_id" uuid,
	"city_id" text NOT NULL,
	"locality_id" uuid NOT NULL,
	"location" geometry(point) NOT NULL,
	"slug" text NOT NULL,
	"building_name" text NOT NULL,
	"bhk" smallint NOT NULL,
	"carpet_sqft" integer NOT NULL,
	"floor" smallint NOT NULL,
	"total_floors" smallint NOT NULL,
	"facing" "facing" NOT NULL,
	"possession_date" date,
	"parking" smallint NOT NULL,
	"maintenance_paise_per_month" integer NOT NULL,
	"price_paise" bigint NOT NULL,
	"deposit_paise" bigint,
	"min_lease_months" smallint,
	"rera_number" text,
	"description" text,
	"description_ai_drafted" boolean DEFAULT false NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "localities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" text NOT NULL,
	"micro_market_id" uuid,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"center" geometry(point) NOT NULL,
	"boundary" geometry(MultiPolygon, 4326),
	"rera_authority" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid,
	"kind" "media_kind" NOT NULL,
	"label" "media_label" DEFAULT 'real' NOT NULL,
	"status" "media_status" DEFAULT 'uploaded' NOT NULL,
	"storage_key" text NOT NULL,
	"sha256" text NOT NULL,
	"phash" text,
	"exif_taken_at" timestamp with time zone,
	"exif_location" geometry(point),
	"width" integer,
	"height" integer,
	"palette" text[],
	"original_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "micro_markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"boundary" geometry(MultiPolygon, 4326)
);
--> statement-breakpoint
CREATE TABLE "models_3d" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_type_id" uuid NOT NULL,
	"tier" smallint NOT NULL,
	"media_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"bytes" integer NOT NULL,
	"status" "media_status" DEFAULT 'processing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" text NOT NULL,
	"key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "partner_members" (
	"partner_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" NOT NULL,
	"project_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	CONSTRAINT "partner_members_partner_id_user_id_pk" PRIMARY KEY("partner_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "partner_type" NOT NULL,
	"name" text NOT NULL,
	"status" "partner_status" DEFAULT 'pending' NOT NULL,
	"city_id" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"partner_type" "partner_type" NOT NULL,
	"monthly_paise" bigint NOT NULL,
	"listing_slots" integer NOT NULL,
	"seats" integer NOT NULL,
	"monthly_credits" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"effective_from" date NOT NULL,
	"media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"developer_id" uuid NOT NULL,
	"city_id" text NOT NULL,
	"locality_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" "project_category" NOT NULL,
	"location" geometry(point) NOT NULL,
	"possession_date" date,
	"oc_received_at" date,
	"maintenance_paise_per_sqft" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_payment_id" uuid NOT NULL,
	"amount_paise" bigint NOT NULL,
	"razorpay_refund_id" text,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"media_id" uuid,
	"reporter_id" uuid,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rera_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid,
	"project_id" uuid,
	"authority" text NOT NULL,
	"number" text NOT NULL,
	"status" "check_status" DEFAULT 'pending' NOT NULL,
	"valid_until" date,
	"checked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"site_visit_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_siteVisitId_unique" UNIQUE("site_visit_id")
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"city_id" text NOT NULL,
	"filters" jsonb NOT NULL,
	"channel" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"tenant_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_tenant_id_key_pk" PRIMARY KEY("tenant_id","key")
);
--> statement-breakpoint
CREATE TABLE "shortlists" (
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"unit_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"reference" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" "visit_status" DEFAULT 'requested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" "tenant_kind" DEFAULT 'marketplace' NOT NULL,
	"partner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "token_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"amount_paise" bigint NOT NULL,
	"status" "token_status" DEFAULT 'created' NOT NULL,
	"razorpay_order_id" text NOT NULL,
	"razorpay_payment_id" text,
	"hold_expires_at" timestamp with time zone,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_payments_razorpayOrderId_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "token_payments_idempotencyKey_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "towers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"floors" smallint NOT NULL,
	"stacks" smallint NOT NULL,
	"elevation_media_id" uuid
);
--> statement-breakpoint
CREATE TABLE "unit_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"bhk" smallint NOT NULL,
	"carpet_sqft" integer NOT NULL,
	"built_up_sqft" integer NOT NULL,
	"super_built_up_sqft" integer NOT NULL,
	"bathrooms" smallint NOT NULL,
	"balconies" smallint NOT NULL,
	"parking" smallint NOT NULL,
	"plan" jsonb,
	"plan_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tower_id" uuid NOT NULL,
	"unit_type_id" uuid NOT NULL,
	"number" text NOT NULL,
	"floor" smallint NOT NULL,
	"stack" smallint NOT NULL,
	"facing" "facing" NOT NULL,
	"status" "unit_status" DEFAULT 'available' NOT NULL,
	"price_paise" bigint NOT NULL,
	"hold_expires_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"phone_e_164" text NOT NULL,
	"phone_verified_at" timestamp with time zone,
	"name" text,
	"email" text,
	"locale" text DEFAULT 'en-IN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"check" text NOT NULL,
	"status" "check_status" NOT NULL,
	"detail" jsonb,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vibe_scores" (
	"locality_id" uuid PRIMARY KEY NOT NULL,
	"commute" numeric(3, 1) NOT NULL,
	"schools" numeric(3, 1) NOT NULL,
	"green_cover" numeric(3, 1) NOT NULL,
	"nightlife" numeric(3, 1) NOT NULL,
	"appreciation" numeric(3, 1) NOT NULL,
	"score" numeric(3, 1) NOT NULL,
	"sources" jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"room_url" text,
	"status" "visit_status" DEFAULT 'requested' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" text[] NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_cluster_members" ADD CONSTRAINT "duplicate_cluster_members_cluster_id_duplicate_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."duplicate_clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_cluster_members" ADD CONSTRAINT "duplicate_cluster_members_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_clusters" ADD CONSTRAINT "duplicate_clusters_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_clusters" ADD CONSTRAINT "duplicate_clusters_canonical_listing_id_listings_id_fk" FOREIGN KEY ("canonical_listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_checks" ADD CONSTRAINT "kyc_checks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_checks" ADD CONSTRAINT "kyc_checks_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landmarks" ADD CONSTRAINT "landmarks_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_charges" ADD CONSTRAINT "lead_charges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_charges" ADD CONSTRAINT "lead_charges_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_charges" ADD CONSTRAINT "lead_charges_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_charges" ADD CONSTRAINT "lead_charges_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_versions" ADD CONSTRAINT "listing_versions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localities" ADD CONSTRAINT "localities_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localities" ADD CONSTRAINT "localities_micro_market_id_micro_markets_id_fk" FOREIGN KEY ("micro_market_id") REFERENCES "public"."micro_markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "micro_markets" ADD CONSTRAINT "micro_markets_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models_3d" ADD CONSTRAINT "models_3d_unit_type_id_unit_types_id_fk" FOREIGN KEY ("unit_type_id") REFERENCES "public"."unit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models_3d" ADD CONSTRAINT "models_3d_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_members" ADD CONSTRAINT "partner_members_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_members" ADD CONSTRAINT "partner_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_developer_id_partners_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_token_payment_id_token_payments_id_fk" FOREIGN KEY ("token_payment_id") REFERENCES "public"."token_payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rera_registrations" ADD CONSTRAINT "rera_registrations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rera_registrations" ADD CONSTRAINT "rera_registrations_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rera_registrations" ADD CONSTRAINT "rera_registrations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_site_visit_id_site_visits_id_fk" FOREIGN KEY ("site_visit_id") REFERENCES "public"."site_visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_payments" ADD CONSTRAINT "token_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_payments" ADD CONSTRAINT "token_payments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_payments" ADD CONSTRAINT "token_payments_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "towers" ADD CONSTRAINT "towers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_types" ADD CONSTRAINT "unit_types_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_tower_id_towers_id_fk" FOREIGN KEY ("tower_id") REFERENCES "public"."towers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_unit_type_id_unit_types_id_fk" FOREIGN KEY ("unit_type_id") REFERENCES "public"."unit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vibe_scores" ADD CONSTRAINT "vibe_scores_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_tours" ADD CONSTRAINT "video_tours_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_tours" ADD CONSTRAINT "video_tours_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_id_entity_entity_id_index" ON "audit_logs" USING btree ("tenant_id","entity","entity_id");--> statement-breakpoint
CREATE INDEX "landmarks_location_index" ON "landmarks" USING gist ("location");--> statement-breakpoint
CREATE INDEX "lead_events_lead_id_created_at_index" ON "lead_events" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_partner_id_stage_index" ON "leads" USING btree ("partner_id","stage");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_user_id_listing_id_index" ON "leads" USING btree ("user_id","listing_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_txn_id_index" ON "ledger_entries" USING btree ("txn_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_ref_type_ref_id_index" ON "ledger_entries" USING btree ("ref_type","ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_versions_listing_id_version_index" ON "listing_versions" USING btree ("listing_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_tenant_id_slug_index" ON "listings" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "listings_city_id_status_kind_index" ON "listings" USING btree ("city_id","status","kind");--> statement-breakpoint
CREATE INDEX "listings_location_index" ON "listings" USING gist ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "localities_city_id_slug_index" ON "localities" USING btree ("city_id","slug");--> statement-breakpoint
CREATE INDEX "localities_center_index" ON "localities" USING gist ("center");--> statement-breakpoint
CREATE INDEX "media_phash_index" ON "media" USING btree ("phash");--> statement-breakpoint
CREATE UNIQUE INDEX "media_tenant_id_sha256_index" ON "media" USING btree ("tenant_id","sha256");--> statement-breakpoint
CREATE UNIQUE INDEX "micro_markets_city_id_slug_index" ON "micro_markets" USING btree ("city_id","slug");--> statement-breakpoint
CREATE INDEX "outbox_published_at_index" ON "outbox" USING btree ("published_at") WHERE "outbox"."published_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "price_lists_project_id_version_index" ON "price_lists" USING btree ("project_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_tenant_id_slug_index" ON "projects" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "projects_city_id_locality_id_index" ON "projects" USING btree ("city_id","locality_id");--> statement-breakpoint
CREATE INDEX "projects_location_index" ON "projects" USING gist ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "rera_registrations_authority_number_index" ON "rera_registrations" USING btree ("authority","number");--> statement-breakpoint
CREATE UNIQUE INDEX "shortlists_user_id_listing_id_unit_id_index" ON "shortlists" USING btree ("user_id","listing_id","unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "units_tower_id_number_index" ON "units" USING btree ("tower_id","number");--> statement-breakpoint
CREATE INDEX "units_status_index" ON "units" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_id_phone_e_164_index" ON "users" USING btree ("tenant_id","phone_e_164");