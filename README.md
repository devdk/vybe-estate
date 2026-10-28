# Vybe Estate

Multi-partner property marketplace for MMR, Bengaluru, Pune, Delhi-NCR and Hyderabad. Buyers explore each city as a 3D map, open a project's towers, pick the exact flat, and plan site visits with several sellers on one day.

This repo is the Phase 1 foundation from the blueprint (Oct 27, 2026): the buyer web app on demo inventory, the shared domain package, the Postgres/PostGIS schema, and the anti-slop release gates.

## Run it

```bash
npm install
npm run dev          # http://localhost:3100
```

Checks (the same gates CI runs on every merge):

```bash
npm run typecheck
npm test
npm run lint:copy
npm run build && npm run start   # then, in another terminal:
npm run check:logged-out
```

## Layout

| Path | What it is |
| --- | --- |
| `apps/web` | Buyer app: Next.js 16 (App Router, RSC), Tailwind 4, React Three Fiber |
| `packages/core` | Domain types and pure logic shared by every app: money in paise, search and filters, EMI, vibe score, inventory status, visit planner, floor-plan layout. `@vybe/core/catalog` is the read side, today backed by deterministic demo inventory |
| `packages/db` | Drizzle schema for PostgreSQL 16 + PostGIS covering every domain in the data model, with generated SQL migrations |
| `tools/` | Release gates: copy linter (banned words, raw colours) and the logged-out check |

## Buyer website: pages

Light theme only. Every page works without signing in; the shortlist lives on the device.

| Page | Route |
| --- | --- |
| Home: 3D city world for all five cities, quick search, city sales, live counts by category, new launches | `/` |
| City: 3D city world with a 2D map first, locality table, category counts, filters, results, empty states with next steps | `/[city]` |
| Locality guide: homes, median ₹/sq ft, vibe score breakdown, listings, nearby localities | `/[city]/[locality]` |
| Vibe check: two localities side by side (score rings, factors, prices, homes) | `/[city]/vibe-check` |
| Project: facts first, 3D tower explorer with live flat status, flat grid, price list, floor plans, EMI, location, developer, similar projects, report a problem | `/projects/[slug]` |
| Walk the unit: 3D or 2D plan turned to its real facing, real sun position for any date and time, sunlit walls, sunrise and sunset, room sizes, furniture fit check | `/projects/[slug]/walk/[type]`, `/homes/[slug]/walk` |
| Resale or rental: facts, plan, EMI or rent costs, location, seller, similar homes, report a problem | `/homes/[slug]` |
| Developer or broker profile (owners stay private) | `/partners/[id]` |
| Shortlist and one-day visit planning | `/shortlist` |
| Compare up to three homes, plans drawn to the same scale | `/compare` |
| Home loan EMI calculator with yearly repayment and how much you can borrow | `/home-loan-emi-calculator` |
| About, how we verify, help, privacy notice (draft), terms (draft) | `/about`, `/how-we-verify`, `/help`, `/privacy`, `/terms` |

Plus a 404 page, an error page, `sitemap.xml`, `robots.txt` and JSON-LD on project, listing and help pages.

## Not built yet

- Partner console and admin console (the other two apps in the blueprint).
- Postgres wiring: pages read `@vybe/core/catalog`; the next step is a Postgres implementation of the same functions plus seed data, then Meilisearch for search.
- Things that need outside services: sign-in, OTP-verified leads, masked calling, WhatsApp/SMS notifications, refundable tokens (Razorpay), real photos and the media pipeline, map tiles, locality data for vibe scores and commute times. Visit requests and listing reports are kept in memory and nobody is contacted.
- Hindi and other languages; Lighthouse budgets and visual regression in CI.

## Demo data

Every project, developer, broker, owner, price, unit status and RERA number in `packages/core/src/demo-catalog.ts` is invented (RERA numbers start with `DEMO-`), and the UI says so on every page. Locality centres are approximate. Vibe-score inputs are placeholders until the locality data source is chosen. The only real figures are the Q3 2026 city sales from Anarock, shown with their source.

## Database

```bash
npm run db:up                       # PostGIS 16 in Docker
npm run migrate -w @vybe/db         # applies packages/db/migrations
npm run generate -w @vybe/db        # after editing src/schema.ts
```

`0000_init.sql` is generated from the schema; `0001_point_srid.sql` is hand-written because drizzle-kit drops the SRID on point columns. The migrations have been generated but not yet applied to a running database.

