# BanglaWheels Engineering Documentation

BanglaWheels is a Bangladesh-first used-car marketplace built around seller identity, listing moderation, vehicle inspections, warranty workflows, financing guidance, and bilingual buyer education. This document is the source-level operating manual for engineers working on the repository. It describes what runs today, how requests move through the system, how authentication and roles work, how data is stored, and which parts are prototypes or production gaps.

> **Current status:** the active application is a Next.js 14 prototype backed by Supabase Auth, Supabase Storage, PostgreSQL, and Prisma. It has real authentication, role checks, relational persistence, listing moderation, and image upload. It is not yet production-ready; see [Production readiness and known gaps](#production-readiness-and-known-gaps).

## Table of contents

1. [System at a glance](#system-at-a-glance)
2. [Technology stack](#technology-stack)
3. [Repository map](#repository-map)
4. [Active application versus legacy application](#active-application-versus-legacy-application)
5. [Runtime architecture](#runtime-architecture)
6. [Local development](#local-development)
7. [Environment variables](#environment-variables)
8. [Supabase setup](#supabase-setup)
9. [Authentication and session lifecycle](#authentication-and-session-lifecycle)
10. [Roles and authorization](#roles-and-authorization)
11. [Routes and screens](#routes-and-screens)
12. [Core product workflows](#core-product-workflows)
13. [API reference](#api-reference)
14. [Database architecture](#database-architecture)
15. [Seed data and fallback persistence](#seed-data-and-fallback-persistence)
16. [Listing image storage](#listing-image-storage)
17. [Frontend state and navigation](#frontend-state-and-navigation)
18. [Internationalization](#internationalization)
19. [Motion and interaction system](#motion-and-interaction-system)
20. [Validation and quality checks](#validation-and-quality-checks)
21. [Deployment guide](#deployment-guide)
22. [Operational runbook](#operational-runbook)
23. [Troubleshooting](#troubleshooting)
24. [Production readiness and known gaps](#production-readiness-and-known-gaps)
25. [Engineering conventions](#engineering-conventions)

## System at a glance

BanglaWheels currently supports these connected workflows:

- Email/password account creation and login through Supabase Auth.
- Buyer, seller, dealer, and admin roles.
- Public browsing of approved vehicle listings.
- Search, filters, saved cars, and a three-car comparison list.
- Seller/dealer listing submission with mandatory images.
- Seller inventory tracking with pending, approved, and rejected states.
- Admin listing moderation, certification, rejection, restoration, and permanent deletion.
- Admin user-role management.
- Seller KYC submission and admin review.
- Inspection requests and admin queue management.
- Buyer enquiries, warranty claims, saved-search alerts, finance estimates, dealer directories, garage directories, articles, and BRTA guidance.
- English/Bangla UI messages and persisted locale preference.
- Responsive navigation, modals, drawers, status transitions, loading skeletons, and reduced-motion support.

The auction data model and UI components still exist, but auction routes and bid mutations are intentionally disabled. The parts page is a placeholder for a future module.

## Technology stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Application framework | Next.js 14 App Router | Page rendering, catch-all routing, API handlers, production build |
| UI | React 18 | Client state and interactive screens |
| Styling | Tailwind CSS 4 through PostCSS | Layout, responsive design, component styling |
| Motion | Framer Motion 12 and CSS transitions | Route, modal, drawer, list, toast, and control motion |
| Icons | Lucide React | Interface iconography |
| Internationalization | next-intl | English and Bangla message delivery |
| Authentication | Supabase Auth | Email/password signup, login, persistent browser sessions, JWTs |
| File storage | Supabase Storage | Public listing-image storage |
| Database | Supabase PostgreSQL | Persistent marketplace and account data |
| ORM | Prisma 6 | Schema definition, queries, transactions, and client generation |
| Static analysis | ESLint 10 | JavaScript and React Hooks linting |

The repository still contains Vite dependencies and configuration for the legacy frontend. They are not used by `npm run dev`, `npm run build`, or `npm start`.

## Repository map

```text
.
├── app/
│   ├── [[...slug]]/page.jsx          # Active catch-all page; mounts BanglaWheelApp
│   ├── api/state/route.js             # State read/mutation API
│   ├── api/uploads/listing-images/    # Listing-image upload API
│   ├── globals.css                    # Active global styles and CSS motion tokens
│   └── layout.jsx                     # Root metadata and providers
├── messages/
│   ├── en.json                        # English translations
│   └── bn.json                        # Bangla translations
├── prisma/schema.prisma               # Complete relational schema
├── public/                            # Static public icons and favicon
├── src/
│   ├── prototype/
│   │   ├── BanglaWheelApp.jsx         # Active UI, route selection, and client actions
│   │   ├── RootProviders.jsx          # Locale provider
│   │   ├── motion.js                  # Shared Framer Motion configuration
│   │   └── platformSeed.js            # Browser-safe constants; re-exports server seed data
│   ├── server/
│   │   ├── auth.js                    # JWT validation, profile sync, and permissions
│   │   ├── databaseStore.js           # Prisma persistence adapter
│   │   ├── platformSeed.js            # Server-side starter marketplace data
│   │   ├── prisma.js                  # Singleton Prisma client
│   │   ├── prototypeStore.js          # Local JSON fallback adapter
│   │   └── supabaseAdmin.js           # Server-only Supabase service-role client
│   ├── lib/supabaseBrowser.js         # Browser Supabase client
│   ├── services/mockServices.js       # In-memory service-shaped prototype helpers
│   ├── legacy/pages/                  # Legacy Vite pages; not mounted by Next.js
│   ├── App.jsx                        # Legacy Vite app
│   └── main.jsx                       # Legacy Vite entry point
├── .data/                             # Ignored local fallback state, created at runtime
├── BanglaWheel_Plan.pdf               # Product-planning artifact
├── Database.docx                      # Database-planning artifact
├── next.config.mjs
├── package.json
└── vite.config.js                     # Legacy-only configuration
```

Generated and private paths are ignored: `.next/`, `node_modules/`, `dist/`, `.env*`, `.data/`, coverage output, Vercel metadata, and common editor files.

## Active application versus legacy application

### Active Next.js application

The supported runtime starts at `app/[[...slug]]/page.jsx`, which renders `src/prototype/BanglaWheelApp.jsx`. Every public and protected URL is handled by that catch-all page. API calls go to Next.js route handlers under `app/api/`.

Use these commands for the active application:

```bash
npm run dev
npm run build
npm start
```

### Legacy Vite application

`src/App.jsx`, `src/main.jsx`, `src/components/`, `src/legacy/pages/`, `src/data/marketplaceData.js`, `src/hooks/`, `src/index.css`, `index.html`, and `vite.config.js` belong to an earlier browser-local implementation. That application persists data in `localStorage` and uses a different route model.

The legacy tree is retained as a feature reference. Engineers should not implement active product changes there unless the legacy app is deliberately being removed or revived. There is no Vite script in `package.json`, so it is not part of the normal runtime or build.

## Runtime architecture

```mermaid
flowchart LR
    Browser[React client] -->|Supabase SDK| Auth[Supabase Auth]
    Browser -->|GET/POST with optional Bearer JWT| StateAPI[/api/state]
    Browser -->|multipart form data| UploadAPI[/api/uploads/listing-images]
    StateAPI --> AuthGuard[Token validation and role checks]
    AuthGuard --> Prisma[Prisma adapter]
    Prisma --> Postgres[(Supabase PostgreSQL)]
    StateAPI -. read fallback; dev write fallback .-> JSON[.data/prototype-state.json]
    UploadAPI --> AdminClient[Supabase service-role client]
    AdminClient --> Storage[(Public listing-images bucket)]
```

### Initial page load

1. `RootProviders` initializes English, then restores `banglawheel:locale` from browser storage.
2. `BanglaWheelApp` asks the Supabase browser client for the persisted session.
3. The client requests `GET /api/state`; authenticated requests include `Authorization: Bearer <access_token>`.
4. The server validates the token with Supabase Auth.
5. For a valid user, the server finds or creates a `Profile` row linked by `authUserId`.
6. `databaseStore` reads marketplace collections in parallel and filters listing visibility by role.
7. The client merges the server response into its UI state without blanking the existing page.

### Mutation lifecycle

1. A UI action sets a stable `pendingAction` key for the affected operation or record.
2. The client sends `{ type, payload }` to `POST /api/state` with the current access token.
3. `requireActionPermission` returns `401` for guests and `403` for authenticated roles without permission.
4. The database adapter validates the payload and writes through Prisma, usually inside a transaction for multi-table changes.
5. The API returns the refreshed visible state and a user-facing message.
6. The client merges the returned state, clears the pending marker, and displays the centered toast.

## Local development

### Prerequisites

- Node.js 18.17 or newer; Node.js 20 LTS is recommended for this dependency set.
- npm.
- A Supabase project for authenticated, database-backed development.
- PostgreSQL credentials from that Supabase project.

### First-time installation

```bash
git clone git@github.com:ahnaftashfee/bangla_wheels.git
cd bangla_wheels
npm install
```

Create `.env.local` in the repository root using the variables described below. Do not commit it.

Generate the Prisma client and create/update the database tables:

```bash
npm run db:generate
npm run db:push
```

Start development:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port 3000 is occupied, Next.js selects another port and prints it in the terminal.

### Production-mode local test

```bash
npm run build
npm start
```

`npm start` requires a successful `.next` production build. `.next/` is generated and intentionally ignored by Git.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Compile, lint/type-check through Next.js, and generate the production build |
| `npm start` | Serve the production build |
| `npm run preview` | Alias for `next start` |
| `npm run lint` | Run ESLint over the repository |
| `npm run db:generate` | Generate `@prisma/client` from `prisma/schema.prisma` |
| `npm run db:push` | Push the current Prisma schema directly to the configured database |

There is currently no automated test script, migration script, seed script, or CI workflow.

## Environment variables

Use `.env.local` for local development and configure the same names in the deployment platform. Never expose service-role or database credentials through a `NEXT_PUBLIC_` variable.

```dotenv
# Prisma/PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres"

# Supabase project identity exposed to the browser
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."

# Server-only Supabase administration; never expose this in browser code
SUPABASE_SERVICE_ROLE_KEY="..."
```

| Variable | Required | Scope | Used by |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes for database mode | Server only | Prisma datasource |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes for Auth/Storage | Browser and server | Browser Auth client and server Storage client |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes for browser Auth unless anon key is used | Browser | Supabase browser client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alternative to publishable key | Browser | Supabase browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for image uploads and server token validation | Server only | Supabase admin client |
| `NEXT_PUBLIC_PROJECT_URL` | Supported alias | Browser | Browser Supabase URL fallback |
| `PROJECT_URL` | Supported alias | Server; browser bundling should not be relied upon | Browser/server URL fallback |
| `SECRET_KEY` | Supported legacy alias | Server only | Service-role key fallback |

`PUBLIC_KEY` may exist in older local environment files but is not consumed by the current source code.

## Supabase setup

### 1. Create or select a project

From the Supabase dashboard, collect:

- Project URL.
- Publishable key or legacy anonymous key.
- Service-role key.
- PostgreSQL connection string.

The publishable key is intended for browser use. The service-role key and `DATABASE_URL` are secrets.

### 2. Configure email/password Auth

The UI calls `signUp`, `signInWithPassword`, and `signOut`. Enable email/password authentication in Supabase. Decide whether email confirmation is required:

- If confirmation is enabled, a new user must confirm the email before a normal login/session is available.
- If confirmation is disabled, signup can establish a session immediately.

Site URL and redirect URLs should include the local URL and every deployed application origin used for authentication.

### 3. Create the database schema

```bash
npm run db:generate
npm run db:push
```

`db:push` synchronizes the schema without creating migration history. It is appropriate for the current prototype. Before multiple environments or production releases, replace this workflow with committed Prisma migrations.

### 4. Let the application seed initial data

The first successful database state read calls `ensureDatabaseState`. If either `Listing` count or `Profile` count is zero, the server imports starter state from the local seed/fallback file and populates the relational tables.

This is automatic; there is no standalone seed command. See [Seed data and fallback persistence](#seed-data-and-fallback-persistence) before using an empty production database.

### 5. Storage bucket

The upload API attempts to create `listing-images` on first upload using the service-role client. The bucket is public. It is configured for images up to 8 MiB and allows JPEG, PNG, WebP, and GIF at bucket creation time.

For controlled production provisioning, create the bucket explicitly in infrastructure/setup and verify its public-access policy rather than depending on request-time creation.

## Authentication and session lifecycle

### Browser session

`src/lib/supabaseBrowser.js` creates one browser client with:

- `persistSession: true`
- `autoRefreshToken: true`
- `detectSessionInUrl: true`

Supabase stores and refreshes the session in the browser. `BanglaWheelApp` subscribes to `onAuthStateChange`, so login, signup, logout, and token refresh update application state without a full page reload.

### Server authentication

The application does not trust browser role values. For each state API request:

1. `getAuthContext` extracts the Bearer token.
2. The server-only Supabase client calls `auth.getUser(token)`.
3. Invalid or missing tokens become the `guest` role.
4. Valid users are linked to `Profile.authUserId`.
5. The profile is upserted with current email, phone, display name, verification state, language, and role.

Display name precedence is `user_metadata.name`, then `user_metadata.full_name`, then the email prefix.

### Role resolution

Role precedence is:

1. Existing `Profile.role` in PostgreSQL.
2. Valid `user.app_metadata.role` from Supabase Auth.
3. `buyer` as the default for a newly authenticated user.

Because the database profile wins after it exists, changing only Auth metadata will not change an established user's role. Use the Admin Users screen or update the `Profile` row.

### Creating the first admin

1. Create the user through the application or Supabase Auth.
2. Sign in once so the application creates the linked `Profile` row.
3. In the Supabase SQL editor, find the Auth user's UUID and run:

```sql
update "Profile"
set
  role = 'admin',
  data = jsonb_set(coalesce(data, '{}'::jsonb), '{role}', '"admin"'::jsonb, true)
where "authUserId" = 'SUPABASE_AUTH_USER_UUID';
```

4. Sign out and sign in again, or refresh the session-backed state.

After an admin exists, role changes can be made under `/admin/users`.

## Roles and authorization

### Role capabilities

| Capability | Guest | Buyer | Seller | Dealer | Admin |
| --- | :---: | :---: | :---: | :---: | :---: |
| Browse approved listings | Yes | Yes | Yes | Yes | Yes |
| Save and compare cars | No | Yes | Yes | Yes | Yes |
| Send seller enquiries | No | Yes | Yes | Yes | Yes |
| Create search alerts | No | Yes | Yes | Yes | Yes |
| Request inspections | No | Yes | Yes | Yes | Yes |
| Submit warranty claims | No | Yes | Yes | Yes | Yes |
| Edit own profile | No | Yes | Yes | Yes | Yes |
| Submit seller KYC | No | No | Yes | Yes | Yes |
| Create vehicle listings | No | No | Yes | Yes | Yes |
| View own pending/rejected listings | No | No | Yes | Yes | Yes |
| Moderate/delete listings | No | No | No | No | Yes |
| Review KYC and inspections | No | No | No | No | Yes |
| View users and assign roles | No | No | No | No | Yes |
| Restore demo data | No | No | No | No | Yes |

### Server permission map

`src/server/auth.js` authorizes these mutation types:

- Buyer, seller, dealer, admin: `toggleSave`, `toggleCompare`, `submitLead`, `createAlert`, `addInspection`, `addClaim`, `updateProfile`.
- Seller, dealer, admin: `addListing`, `addKyc`.
- Admin only: `deleteListing`, `updateItem`, `updateRole`, `reset`.

Unauthorized actions return JSON with status `401` or `403`.

### Visibility rules

- Admins receive all listings and all user profiles.
- Non-admin authenticated users receive approved listings plus listings where `listing.sellerId` matches their profile ID.
- Guests receive approved listings only.
- The `users` collection is empty for every non-admin response.

Route protection is rendered client-side after session hydration; mutation protection is enforced server-side. There is no Next.js middleware guard.

## Routes and screens

All routes are rendered by the catch-all page. Unknown paths currently fall back to the home page rather than returning a dedicated 404.

| Route | Access | Screen and behavior |
| --- | --- | --- |
| `/` | Public | Home, search entry, recommendations, nearby approved cars |
| `/cars` | Public | Approved listing search and filters; supports query parameters |
| `/cars/:slug` | Public | Approved listing detail, gallery, specs, inspection/warranty context, enquiry CTA |
| `/cars/:id` | Public | Alternate listing-detail lookup by approved listing ID |
| `/sell` | Seller, dealer, admin | Multi-step vehicle listing wizard and image upload |
| `/dealers` | Public | Dealer directory |
| `/dealers/:slug` | Public | Dealer profile and inventory |
| `/certified` | Public | Approved certified inventory |
| `/garages` | Public | Partner garage directory |
| `/inspect?listing=:id` | Public view; login to submit | Inspection information and booking form |
| `/warranty` | Public view; login to claim | Warranty products and claim submission |
| `/financing` | Public | Loan calculator and finance partner data |
| `/paperwork` | Public | BRTA ownership-transfer checklist and estimate |
| `/learn` | Public | Buyer education articles |
| `/learn/:slug` | Public | Bilingual article detail |
| `/compare` | Public view; login to persist selections | Up to three selected vehicles side by side |
| `/account` | Authenticated | Saved cars, notifications, warranty overview |
| `/account/listings` | Authenticated | Seller inventory with all/pending/approved/rejected filters |
| `/account/warranty` | Authenticated | Warranty records and claims |
| `/account/documents` | Authenticated | Seller KYC submission |
| `/account/settings` | Authenticated | Name, phone, language, budget, and division preferences |
| `/admin` | Admin | Operations overview |
| `/admin/users` | Admin | Profiles and role assignment |
| `/admin/listings` | Admin | Pending, approved, and rejected moderation tabs |
| `/admin/sellers` | Admin | Seller/dealer KYC queue |
| `/admin/inspections` | Admin | Inspection queue |
| `/admin/analytics` | Admin | Prototype operational metrics |
| `/privacy-policy` | Public | Privacy copy |
| `/terms-of-service` | Public | Terms copy |
| `/data-deletion` | Public | Data-deletion request form UI |
| `/about` | Public | About page |
| `/parts` | Public | Future-module placeholder |

Auction list/detail routes and the account bids tab are commented out. Do not advertise them as active until bid authorization, race conditions, payments, anti-sniping, audit history, and realtime behavior are implemented.

## Core product workflows

### Buyer workflow

1. Browse approved listings.
2. Create an account or log in to save, compare, enquire, create alerts, request an inspection, or submit a warranty claim.
3. Saved and compare state is scoped by `Profile.id` in relational join tables.
4. Compare retains at most three cars; adding a fourth removes the oldest selection.
5. Sending an enquiry creates an `Enquiry` and increments the listing's view count in its JSON data.

### Seller/dealer listing workflow

1. An admin assigns the user `seller` or `dealer`; admins can also post.
2. The user opens `/sell` and completes the listing wizard.
3. Images upload first to `/api/uploads/listing-images`.
4. The returned public URLs are included in `addListing`.
5. The server requires `model`, `chassis`, `phone`, and at least one image URL.
6. The server overrides `sellerId` and `sellerName` from the authenticated profile.
7. The listing is saved with `status: "pending"` regardless of client input.
8. It appears in `/account/listings` as “Pending admin review” and is hidden from public inventory.
9. Admin approval changes the status to `approved` and marks the seller verified for that listing.
10. Rejection hides the listing from public inventory but keeps it in the seller and admin records.

### Admin moderation workflow

The Listings tab separates records into pending, approved, and rejected states:

- **Approve & publish:** sets `status: approved` and `verifiedSeller: true`.
- **Reject:** sets `status: rejected`.
- **Return to review:** moves a rejected listing back to `pending`.
- **Certify listing:** available only when the stored inspection report has an overall score of 70 or higher.
- **Delete permanently:** removes the listing and dependent marketplace rows in a database transaction.

Permanent deletion removes related warranty claims, warranties, auctions, inspections, enquiries, saved selections, compare selections, listing media through cascade, and the listing itself. Uploaded Supabase Storage objects are not currently deleted, so storage cleanup must be handled separately.

### Seller KYC workflow

1. Seller/dealer submits name, phone, NID, date of birth, type, and expected documents from `/account/documents`.
2. Server forces `sellerId` to the authenticated profile.
3. Request is created with `pending` status.
4. Admin approves or rejects it under `/admin/sellers`.

The current UI records document labels and form data; it does not upload or securely vault KYC document files.

### Inspection and certification workflow

1. A logged-in user submits an inspection request for a listing and preferred garage/date.
2. Admin updates the request status in `/admin/inspections`.
3. Certification is allowed only when `listing.data.inspectionReport.overall >= 70`.
4. Certification sets the relational `certified` flag and mirrors it into the listing JSON payload.

There is no current garage login, report-authoring workflow, or immutable inspection audit record.

### User-role management

Profiles appear under `/admin/users` after the user has authenticated and triggered profile creation. Admin can assign `buyer`, `seller`, `dealer`, or `admin`. The update changes both the scalar `Profile.role` and `Profile.data.role`.

### Restore demo data

The admin “Restore demo data” action is destructive. It rewrites marketplace tables from local starter state. It deletes and recreates listings and most operational collections, while existing profile rows are not globally deleted. Never expose this action in a production admin console without an environment guard, explicit backup, and stronger confirmation.

## API reference

### `GET /api/state`

Returns the visible application state. It accepts an optional Bearer token.

```http
Authorization: Bearer <supabase_access_token>
```

Response shape:

```json
{
  "profile": {},
  "listings": [],
  "dealers": [],
  "garages": [],
  "auctions": [],
  "warranties": [],
  "financePartners": [],
  "articles": [],
  "enquiries": [],
  "alerts": [],
  "kycRequests": [],
  "inspections": [],
  "notifications": [],
  "saved": [],
  "compare": [],
  "users": []
}
```

The response is dynamic and sent with no client cache in the active UI.

### `POST /api/state`

All state mutations use one action endpoint:

```json
{
  "type": "toggleSave",
  "payload": { "id": "bw-1001" }
}
```

Successful response:

```json
{
  "state": {},
  "message": "Saved to your account."
}
```

Supported actions:

| Type | Important payload | Result |
| --- | --- | --- |
| `toggleSave` | `{ id }` | Adds/removes a `SavedListing` |
| `toggleCompare` | `{ id }` | Adds/removes a `CompareSelection`; maximum three |
| `submitLead` | `{ lead }` | Creates enquiry and increments listing views |
| `createAlert` | `{ alert }` | Creates active search alert |
| `addListing` | `{ listing }` | Creates authenticated seller listing as pending |
| `addKyc` | `{ kyc }` | Creates authenticated seller KYC request as pending |
| `addInspection` | `{ inspection }` | Creates inspection request |
| `addClaim` | `{ claim }` | Adds claim to an existing warranty for the listing |
| `updateProfile` | `{ patchValue }` | Updates allowed profile preferences |
| `updateItem` | `{ collection, id, patchValue }` | Admin updates listing/KYC/inspection/enquiry/alert/notification state |
| `updateRole` | `{ profileId, role }` | Admin changes a profile role |
| `deleteListing` | `{ id }` | Admin permanently deletes listing dependencies and listing |
| `reset` | `{}` | Admin restores starter data |

Error responses use `{ "error": "..." }` with:

- `401` when login is required.
- `403` when the authenticated role lacks permission.
- `400` for database/action validation failures from `/api/state`.
- `500` for upload/storage failures from the upload endpoint.

### `POST /api/uploads/listing-images`

Accepts `multipart/form-data`:

| Field | Type | Rules |
| --- | --- | --- |
| `images` | One or more files | 1-12 files, images only, maximum 8 MiB each |
| `listingDraftId` | String, optional | Groups objects under a draft path; random UUID when omitted |

Response:

```json
{
  "images": [
    {
      "path": "listings/draft-id/timestamp-uuid-file.jpg",
      "url": "https://PROJECT.supabase.co/storage/v1/object/public/listing-images/...",
      "name": "file.jpg",
      "size": 123456,
      "type": "image/jpeg"
    }
  ]
}
```

## Database architecture

The Prisma schema uses a hybrid model:

- Frequently queried fields are typed relational columns and indexed.
- Each main record also retains a `data` JSON column for richer prototype fields not yet normalized.
- UI objects are reconstructed by merging relational scalars over JSON data.

This supports rapid iteration but creates duplicate values. Any write path that changes a duplicated field must update both the scalar and JSON representation, as `databaseStore` currently does for supported mutations.

### Tables

| Prisma model/table | Purpose | Important constraints and relationships |
| --- | --- | --- |
| `AppState` | Singleton migration/bridge marker | Default ID `singleton`; JSON payload |
| `Listing` | Vehicle inventory | Unique `slug`; indexed status, make, city, price, year; has many media |
| `ListingMedia` | Ordered listing images | Belongs to listing; cascades on listing deletion; indexed `listingId` |
| `Profile` | Application identity and role | Optional unique `authUserId`; role, locale, verification, JSON preferences |
| `Dealer` | Dealer directory | Unique slug; indexed city and verification |
| `Garage` | Inspection garage directory | Indexed city |
| `Auction` | Deferred auction state | References listing by ID value, but no Prisma foreign key |
| `Warranty` | Listing warranty/escrow state | Has many claims; indexed listing and status |
| `WarrantyClaim` | Warranty claim history | Optional warranty relation with cascade; indexed listing/status/warranty |
| `FinancePartner` | Finance product directory | Indexed bank and type |
| `Article` | Bilingual educational content | Unique slug; JSON title/body |
| `Enquiry` | Buyer-to-seller leads | Indexed listing and status |
| `SearchAlert` | Saved search definitions | JSON filters; indexed active state |
| `KycRequest` | Seller/dealer verification requests | Indexed seller and status |
| `InspectionRequest` | Inspection bookings | Indexed listing, garage, and status |
| `Notification` | In-app/SMS-style notification data | Indexed status |
| `SavedListing` | Profile-to-listing saved relation | Unique profile/listing pair; no Prisma foreign keys |
| `CompareSelection` | Profile comparison list | Unique profile/listing pair; ordered by position |

### Listing representation

Typed listing columns include identity, slug, title, make/model/year, price, location, mileage, drivetrain descriptors, seller contact/type, moderation status, trust badges, timestamps, and media relation. Extended fields such as chassis, registration, features, inspection report, warranty metadata, geolocation, and description live in `Listing.data`.

### Transactions

Prisma transactions protect:

- Full starter-state replacement.
- Listing creation plus media replacement.
- Lead creation plus view increment.
- Permanent listing deletion and dependent-row cleanup.

### Schema changes

For the current prototype:

```bash
# Edit prisma/schema.prisma
npm run db:generate
npm run db:push
```

For production, create and commit Prisma migrations rather than relying on `db:push`. There is currently no `prisma/migrations/` directory.

### Database access model

Prisma connects directly with `DATABASE_URL`. Application data authorization is implemented in the Next.js server, not through Supabase browser database queries. Supabase Row Level Security is therefore not the primary control for Prisma requests. Database credentials must remain server-only and should use the deployment-appropriate Supabase connection endpoint/pooler.

## Seed data and fallback persistence

### Server seed

`src/server/platformSeed.js` contains starter records for:

- Profile and approved listings.
- Dealers and garages.
- Auctions and warranties.
- Finance partners and bilingual articles.
- KYC and notification examples.
- Vehicle makes, cities, body types, fuel types, transmissions, features, inspection sections, and legal copy.

Media in seed listings uses remote image URLs assembled by the seed module.

### Local JSON fallback

`src/server/prototypeStore.js` persists fallback state to:

```text
.data/prototype-state.json
```

The directory is created automatically and ignored by Git.

Behavior differs by request type:

- Database read failure: `GET /api/state` logs the error and serves filtered local fallback state in all environments.
- Database mutation failure in development: `POST /api/state` attempts the local JSON mutation adapter.
- Database mutation failure in production: returns an error and does not write fallback state.

Fallback listing visibility still limits guests/non-admins to approved listings plus the authenticated seller's own listings. Fallback users are visible only to admins.

### Automatic relational import

When either the relational listing count or profile count is zero, `ensureDatabaseState` imports fallback/seed state with a full-table replacement transaction. This is convenient for development but too implicit for mature production operations. Replace it with explicit, idempotent deployment seeding before launch.

## Listing image storage

- Bucket: `listing-images`.
- Visibility: public.
- Path format: `listings/{listingDraftId}/{timestamp}-{uuid}-{safeFileName}`.
- Files per request: maximum 12.
- File size: maximum 8 MiB each.
- Upload cache control: one year.
- Client stores returned public URLs in `ListingMedia` through listing creation.

The upload route sanitizes file names and creates collision-resistant object paths. Current gaps include no authenticated role check on the upload endpoint, no image decoding/content inspection, no resizing/optimization pipeline, no quota, and no orphan cleanup when a draft is abandoned or a listing is deleted.

## Frontend state and navigation

### State ownership

`useBackendPrototype` owns the active application state. Server-backed collections are merged with transient UI state:

- `authOpen`, `authUser`, `authReady`, and `authPending`.
- `contactListing`.
- `pendingAction`.
- `toast`.
- Cookie-banner acceptance.

Each successful mutation replaces server-backed state with the fresh API response while preserving those transient UI fields.

### Navigation

Navigation is client-managed with `window.history.pushState` and a `popstate` listener. This avoids full document reloads while keeping browser back/forward behavior. The Next.js `usePathname` and `useSearchParams` values initialize the client location.

Route selection is a conditional switch inside `BanglaWheelApp`, not a directory of separate App Router pages. Adding a route requires:

1. Add or reuse a screen component.
2. Add a pathname condition in `BanglaWheelApp`.
3. Add navigation entry points where appropriate.
4. Add access/hydration handling for protected routes.
5. Update this route table.

### Browser-local preferences

- `banglawheel:locale`: `en` or `bn`.
- `banglawheel:prototype:v2`: currently stores the cookie-banner accepted marker.
- Supabase maintains its own persisted Auth session keys.

Saved cars and comparison selections are not sourced from browser storage in the active application; they are profile-scoped database rows.

## Internationalization

`RootProviders` loads `messages/en.json` and `messages/bn.json` into `NextIntlClientProvider` with timezone `Asia/Dhaka`.

- Initial locale is English to keep server/client output stable.
- Locale is restored after mount from local storage.
- The `<html lang>` value and `bn-font` class update when locale changes.
- Account settings also persist the language preference to `Profile`, but locale restoration currently reads browser storage, not the profile value.
- Admin copy is intentionally English-only in V1.
- Many active screen strings remain inline English; only shared brand/navigation/home/action messages are fully message-file driven.

When adding translated copy, update both locale files with identical key structure and use `useTranslations` in client components.

## Motion and interaction system

Shared Framer Motion variants live in `src/prototype/motion.js`; shared CSS behavior lives in `app/globals.css`.

### Tokens

| Token | Duration |
| --- | --- |
| Instant | 180 ms |
| Fast | 200 ms |
| Base | 280 ms |
| Slow | 380 ms |

Easing curves:

- Standard: `[0.2, 0, 0, 1]`
- Enter: `[0.16, 1, 0.3, 1]`
- Exit: `[0.4, 0, 1, 1]`

Springs:

- Responsive: stiffness 360, damping 34, mass 0.82.
- Gentle: stiffness 280, damping 30, mass 0.9.

### Usage

- CSS `.motion-control` handles button hover/press/focus transitions.
- `.motion-field` handles form focus state.
- `.motion-card` handles restrained card hover.
- Framer variants handle pages, panels, popovers, drawers, modals, list items, backdrops, and centered toasts.
- `AnimatePresence` is used only where exits matter.
- Auth loading uses layout-matched skeletons.
- List moderation/filter changes use layout animation without blanking the entire page.
- `MotionConfig reducedMotion="user"` and CSS `prefers-reduced-motion` rules respect operating-system preferences.

Prefer `transform` and `opacity`; avoid adding layout-heavy animation unless the interaction requires it.

## Validation and quality checks

Run before opening or merging a pull request:

```bash
npm run lint
npm run build
git diff --check
git status --short
```

The build checks compilation and Next.js validity. ESLint reports unused variables as warnings and enforces recommended JavaScript and React Hooks rules.

There is currently no unit, integration, end-to-end, accessibility, visual-regression, or load-test suite. Manual verification should cover at least:

1. Guest approved-listing visibility.
2. Signup, email confirmation behavior, login, refresh, and logout.
3. Buyer save, compare, enquiry, inspection, alert, and claim actions.
4. Seller/dealer listing upload and pending status.
5. Admin approval, rejection, restore-to-pending, certification, deletion, KYC, inspection, and role changes.
6. Unauthorized direct visits and unauthorized API mutations.
7. English/Bangla switching.
8. Desktop and mobile navigation/modals.
9. Reduced-motion mode.
10. Database failure and upload failure messaging.

## Deployment guide

The repository has no committed provider-specific deployment configuration. A typical Next.js deployment must provide Node.js server execution because the app uses Node route handlers, Prisma, filesystem fallback code, and server-side Supabase administration.

### Deployment sequence

1. Provision the Supabase project and production database.
2. Configure Auth URLs and email policy.
3. Provision/verify the public `listing-images` bucket.
4. Set all production environment variables.
5. Apply the database schema using a controlled migration process.
6. Seed required reference data explicitly.
7. Run `npm ci`.
8. Run `npm run lint` and `npm run build`.
9. Deploy the Next.js server.
10. Smoke-test guest, buyer, seller, dealer, and admin workflows.

### Build and start commands

```bash
npm ci
npm run db:generate
npm run build
npm start
```

### Environment considerations

- `.data` filesystem persistence is not reliable on serverless or ephemeral hosts. Production should not depend on fallback writes.
- Prisma connections must be configured for the host's concurrency and Supabase's supported connection method.
- The service-role key must be available only to server runtime code.
- The application metadata currently hard-codes `https://banglawheel.com`; update `app/layout.jsx` if the canonical production domain differs.
- The home hero currently loads an external Unsplash image through CSS.
- Seed listing images may reference remote image URLs.

## Operational runbook

### Approve a listing

1. Log in as admin.
2. Open `/admin/listings`.
3. Select **Pending approval**.
4. Review listing fields and media.
5. Choose **Approve & publish**.
6. Confirm it leaves the pending list, appears under approved listings, and opens publicly.

### Reject or restore a listing

- Reject from the pending tab; it moves to rejected and is hidden publicly.
- From rejected, choose **Return to review** to move it back to pending.

### Certify a listing

The listing must be approved and contain `inspectionReport.overall` of at least 70. Otherwise the UI links to inspection and the API rejects direct certification attempts.

### Permanently delete a listing

Use the delete control in any moderation status. Confirm the destructive browser prompt. Verify related database records are removed. Then remove uploaded Storage objects manually until storage lifecycle cleanup is implemented.

### Promote a user

1. User signs in at least once.
2. Admin opens `/admin/users`.
3. Change role to buyer, seller, dealer, or admin.
4. User refreshes or signs in again to receive role-appropriate UI.

### Database backup and recovery

Use Supabase's database backup facilities before destructive administration, schema pushes, or seed restoration. The application does not implement its own backup or rollback system.

## Troubleshooting

### “Supabase auth is missing the public key in env”

Set both the project URL and a browser key, then restart the dev server:

```dotenv
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

Next.js reads environment variables at server startup/build time; changing them requires a restart.

### Login succeeds in Supabase but the app shows buyer access

Check the linked `Profile.role`. Existing database role overrides Auth app metadata. Confirm `Profile.authUserId` matches the Supabase Auth UUID.

### User does not appear in Admin Users

The user must authenticate and trigger `/api/state` so `getAuthContext` can upsert the profile. Supabase Auth users are not bulk-imported into `Profile` by the current app.

### Admin route briefly shows loading

Protected routes wait for Supabase session hydration and backend state. The app should show a skeleton rather than unauthorized content. Persistent delays usually indicate slow Auth validation or database reads.

### Database errors fall back to demo data

Inspect the server console for `Database read failed, using local fallback`. Verify `DATABASE_URL`, network access, Prisma schema, and table presence. Do not mistake fallback data for a healthy production database.

### Prisma client/schema mismatch

```bash
npm run db:generate
npm run db:push
```

Restart the server afterward.

### Listing image upload fails

Verify:

- `NEXT_PUBLIC_SUPABASE_URL` or `PROJECT_URL` is set server-side.
- `SUPABASE_SERVICE_ROLE_KEY` or `SECRET_KEY` is valid.
- The bucket can be created or already exists.
- There are no more than 12 files.
- Each file is an image and at most 8 MiB.

### Listing is submitted but not public

This is expected. New listings are always `pending`. The seller can see them under `/account/listings`; an admin must approve them.

### Certification fails

The listing needs a stored inspection report with `overall >= 70`. A UI badge alone is not sufficient.

### Changes do not appear on GitHub

```bash
git status --short --branch
git log -3 --oneline --decorate
git fetch origin
```

No diff is expected when changes have already been committed and local `main` matches `origin/main`.

## Production readiness and known gaps

The current application is a functional prototype, not a completed public marketplace. These items are important engineering work, not optional polish.

### Security and privacy

- The image upload endpoint does not currently require authentication or a seller/dealer role.
- `GET /api/state` filters listings and users, but other operational collections such as enquiries, KYC requests, inspections, notifications, and warranties are not comprehensively scoped per user. Do not expose the current API publicly with real personal data.
- KYC values are stored in general JSON data without dedicated encryption, retention, redaction, or document-vault controls.
- No rate limiting, abuse prevention, CAPTCHA, upload quota, malware/content scanning, or audit log exists.
- Server authorization is action-based; there is no resource-ownership policy layer for every collection.
- Public Storage URLs and orphaned objects require lifecycle controls.
- Data deletion is a UI request flow, not a complete verified deletion process.

### Data and operations

- Prisma migrations are not committed; only `db:push` is available.
- Automatic seed import can replace broad marketplace state when key table counts are zero.
- Admin demo reset is available without an environment kill switch.
- JSON and scalar duplicate fields can drift if new write paths do not update both.
- Several ID references are strings without database foreign keys.
- No background jobs, queues, email/SMS delivery, scheduled alert matching, or notification delivery exists.
- No Storage deletion is performed when a listing is permanently deleted.
- Analytics include prototype calculations and should not be treated as audited business metrics.

### Product integrations

- Auction routes and bidding are deferred.
- Payments, escrow, warranty providers, banks, BRTA, dealer subscriptions, maps, WhatsApp, SMS, and transactional email are not live integrations.
- `mockServices.js` exposes service-shaped in-memory helpers, including a prototype OTP of `123456`; it is not the active authentication path and must never become production authentication.
- KYC document upload and garage inspection-report authoring are incomplete.
- The parts marketplace is not active.
- CMS content is stored in PostgreSQL/seed JSON; no external CMS is connected.

### Quality and delivery

- No automated tests exist.
- No GitHub Actions/CI pipeline exists.
- No error monitoring, structured logging, tracing, uptime checks, or performance telemetry exists.
- No formal accessibility audit, browser matrix, load test, or security review has been completed.
- No dedicated 404/error boundaries are implemented for catch-all routes.
- No provider-specific deployment/IaC configuration is committed.

### Recommended launch order

1. Close API data-isolation and upload-authorization gaps.
2. Introduce committed database migrations and explicit production seeding.
3. Add unit tests for permissions/store logic and end-to-end tests for critical roles.
4. Add CI for lint, build, tests, and migration validation.
5. Remove or isolate destructive demo/fallback behavior from production.
6. Add rate limiting, audit logs, monitoring, backups, and incident procedures.
7. Implement Storage lifecycle cleanup and private KYC handling.
8. Complete required third-party integrations and legal/privacy review.
9. Run accessibility, mobile, browser, performance, and penetration testing.
10. Perform a staged launch with production smoke tests and rollback procedures.

## Engineering conventions

- Treat `src/prototype/BanglaWheelApp.jsx` as the active frontend until routes are deliberately decomposed.
- Keep server secrets out of `NEXT_PUBLIC_` variables and browser imports.
- Enforce authorization in server code even when the UI hides a control.
- Use Prisma transactions for multi-table mutations.
- Preserve listing status rules: new submissions are pending; only admins publish.
- Keep seller identity derived from the authenticated profile, not request payloads.
- Update relational scalar and JSON mirror fields together.
- Use shared motion variants and CSS tokens instead of one-off animation values.
- Respect `prefers-reduced-motion` and avoid layout-heavy animation.
- Add English and Bangla message keys together when using message-based copy.
- Do not commit `.env`, `.data`, `.next`, `dist`, coverage, or `node_modules`.
- Run lint and production build before merging.
- Update this document whenever routes, environment variables, roles, actions, tables, operational behavior, or launch readiness changes.
