-- drizzle-kit emits point columns without an SRID; pin every one to WGS84
-- so distance and containment queries never mix coordinate systems.
ALTER TABLE "cities" ALTER COLUMN "center" TYPE geometry(Point, 4326) USING ST_SetSRID("center", 4326);--> statement-breakpoint
ALTER TABLE "localities" ALTER COLUMN "center" TYPE geometry(Point, 4326) USING ST_SetSRID("center", 4326);--> statement-breakpoint
ALTER TABLE "landmarks" ALTER COLUMN "location" TYPE geometry(Point, 4326) USING ST_SetSRID("location", 4326);--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "location" TYPE geometry(Point, 4326) USING ST_SetSRID("location", 4326);--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "location" TYPE geometry(Point, 4326) USING ST_SetSRID("location", 4326);--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "exif_location" TYPE geometry(Point, 4326) USING ST_SetSRID("exif_location", 4326);
