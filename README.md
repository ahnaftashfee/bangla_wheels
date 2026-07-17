# BanglaWheels.com

BanglaWheels.com is a Bangladesh-first automotive marketplace MVP inspired by mature car classified platforms.

## Current Product Surface

- Buy cars with advanced filters, saved ads, comparison, search alerts, detail pages, and seller lead capture.
- Browse by category, make/model, city, year, certified cars, dealer cars, inspected cars, and low-mileage stock.
- Sell cars through a working ad submission form with pending admin approval.
- Dealer area with showroom profiles, subscription plans, and dealer application capture.
- Trust tools for fair price estimates, car loan/finance estimates, inspection bookings, car comparison, auction sheet checks, and ownership cost estimates.
- Auto parts catalog with cart checkout and admin order tracking.
- Admin dashboard for approving listings, toggling badges, handling leads, bookings, dealer applications, orders, and document checks.

## Frontend Structure

- `src/App.jsx` keeps app state, route selection, and product event handlers.
- `src/pages/` contains route-level screens.
- `src/components/` contains reusable UI, layout, listing cards, and modals.
- `src/hooks/` contains routing and local persistence hooks.
- `src/lib/` contains shared navigation and marketplace utilities.
- `src/data/marketplaceData.js` contains the current local seed data and storage keys.

## Backend Integration

The active Next.js app now reads and writes marketplace state through `/api/state` instead of relying on browser-only storage. The primary storage adapter uses Supabase PostgreSQL through Prisma, with `.data/prototype-state.json` kept as a local development fallback.

The frontend no longer ships demo listing data. Starter/demo records live in the server-only seed module and in Supabase once seeded.

Current backend-backed flows:

- listings and admin listing moderation
- saved cars and compare selections
- seller leads/enquiries
- saved search alerts
- seller KYC requests
- inspection requests
- warranty claims
- admin queue updates

The `.data`, `.env`, and `.env.local` files are ignored by git because they contain local runtime data and database credentials.

## Database

This project uses Prisma with Supabase PostgreSQL.

Required environment variable:

```bash
DATABASE_URL="postgresql://..."
```

Useful commands:

```bash
npm run db:generate
npm run db:push
```

Listings now live in relational `Listing` and `ListingMedia` tables. The `AppState` table remains as a bridge for non-listing modules like saved state, leads, KYC, inspections, notifications, articles, and finance partner data until those modules are normalized.

## Storage

Listing images upload through `/api/uploads/listing-images` into the public Supabase Storage bucket `listing-images`. The Sell page stores the returned public URLs on the submitted listing, so uploaded car photos appear on listing cards and detail pages after admin approval.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

The current local env files also support `PROJECT_URL` and `SECRET_KEY` aliases.

## Legacy Data Model

The older Vite-era frontend uses browser `localStorage` as a local backend so product flows are interactive without a server. The storage keys are defined in `src/data/marketplaceData.js`.

When backend work starts, the main replacement points are:

- listings
- saved cars
- compare list
- leads
- alerts
- inspection bookings
- dealer applications
- parts orders
- auction sheet checks

## Run Locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm run build
```
