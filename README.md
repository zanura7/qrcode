# QR Code Management System

Generate, manage, track and analyse QR codes from a single centralised dashboard —
a self-hosted replacement for third-party QR platforms (no ads, no monthly fees,
no broken codes).

Built per the project PRD, Technical Specification and Sprint Plan.

## Features (Phase 1 MVP)

- **Authentication** — Supabase Auth, email/password login, protected dashboard.
- **Dashboard** — Total QR, Total Scans, Scans Today, Most Popular QR, Top QR list.
- **QR Management** — create, edit, delete, activate/deactivate, download PNG.
- **Dynamic QR** — every QR encodes a short link (`/r/{code}`); change the target
  any time **without reprinting** the QR.
- **QR types**
  - **URL** — redirect to any link.
  - **WhatsApp** — open a chat directly (`wa.me`), with an optional default message.
  - **Link Hub** — a public page (`/hub/{code}`) listing multiple platforms
    (Website, WhatsApp, Facebook, Instagram, TikTok, LinkedIn).
- **Analytics** — scan count, device & browser detection, last scan, per-QR totals.
- **Reporting** — Daily / Weekly / Monthly views with a scan log and **CSV export**.

## Tech Stack

| Layer       | Technology                                   |
| ----------- | -------------------------------------------- |
| Frontend    | Next.js 15 (App Router), TailwindCSS, shadcn/ui-style components |
| Backend     | Next.js Server Actions + Route Handlers      |
| Auth        | Supabase Auth                                |
| Database    | Supabase PostgreSQL                          |
| QR library  | `qrcode`                                     |
| Analytics   | Internal database logging                    |
| Hosting     | Vercel                                       |

## Architecture

```
Scan → /r/[code] → Analytics Logger → Target Resolver → Redirect
                                          ├─ url       → target_url
                                          ├─ whatsapp  → wa.me/<number>?text=...
                                          └─ link_hub  → /hub/<code>
```

## Getting Started

### 1. Create a Supabase project

1. Create a project at <https://supabase.com>.
2. Open the **SQL Editor** and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   This creates `qr_codes`, `qr_scans`, `link_hub_items`, the `updated_at`
   trigger, and Row Level Security policies.
3. Create an admin user under **Authentication → Users → Add user**
   (email + password). This is the account you log in with.

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, never exposed
NEXT_PUBLIC_APP_URL=http://localhost:3000         # used to build QR short links
```

> The **service-role key** is used only in trusted server code (redirect
> resolution, link-hub rendering, analytics logging) and bypasses RLS. It is
> never imported into a client component.

### 3. Install & run

```bash
npm install
npm run dev      # http://localhost:3000
```

Build & start for production:

```bash
npm run build
npm start
```

## Routes

| Route               | Purpose                                  | Access        |
| ------------------- | ---------------------------------------- | ------------- |
| `/login`            | Admin sign-in                            | Public        |
| `/dashboard`        | Statistics overview                      | Authenticated |
| `/qr`               | QR management list                       | Authenticated |
| `/qr/new`           | Create QR                                | Authenticated |
| `/qr/[id]`          | Edit QR, download PNG, manage hub links  | Authenticated |
| `/analytics`        | Scan analytics                           | Authenticated |
| `/reports`          | Daily/Weekly/Monthly reporting           | Authenticated |
| `/api/reports/export` | CSV export                             | Authenticated |
| `/hub/[slug]`       | Public Link Hub page                     | Public        |
| `/r/[code]`         | Dynamic redirect + scan logging          | Public        |

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the four environment variables above in **Project Settings → Environment
   Variables** (set `NEXT_PUBLIC_APP_URL` to your production domain, e.g.
   `https://qr.company.com`).
3. Deploy. Supabase requires no extra hosting — it is fully managed.

## Project Structure

```
src/
  app/
    (app)/                 # Authenticated dashboard (shared sidebar layout)
      dashboard/           # Stats overview
      qr/                  # QR CRUD + generator (actions.ts holds server actions)
      analytics/           # Device/browser breakdowns, per-QR scan totals
      reports/             # Daily/weekly/monthly + scan log
    api/reports/export/    # CSV export route handler
    auth/signout/          # Sign-out route handler
    hub/[slug]/            # Public Link Hub page
    login/                 # Login page + action
    r/[code]/              # Dynamic redirect + analytics logger
  components/              # UI primitives (button, card, table…) + shared widgets
  lib/
    supabase/              # browser / server / admin / middleware clients
    analytics.ts           # scan logging
    reports.ts             # range helpers + CSV builder
    user-agent.ts          # device/browser detection
    types.ts, utils.ts
supabase/migrations/       # Database schema
```

## Acceptance Criteria coverage

| Criterion                              | Status |
| -------------------------------------- | ------ |
| Admin can log in                       | ✅ Supabase Auth + protected routes |
| Admin can create QR                    | ✅ `/qr/new` |
| QR is usable                           | ✅ `/r/[code]` redirect |
| QR editable without reprinting         | ✅ Dynamic short code, editable target |
| Analytics recorded                     | ✅ `qr_scans` logging on every scan |
| Reporting available                    | ✅ `/reports` + CSV export |
| WhatsApp QR works                      | ✅ `wa.me` resolver with optional message |
| Link Hub works                         | ✅ `/hub/[slug]` public page |

## Notes on local builds

This project builds with **Turbopack** (`next build --turbopack`). If you run a
production build on certain Windows drives whose filesystem driver mishandles
`readlink` on regular files, the *build-trace* step may abort with
`EISDIR: ... readlink`. This is an OS/drive issue, not a code issue — the build
completes normally on standard NTFS volumes, on macOS/Linux, and on Vercel.
`npm run dev` works regardless. If you hit it locally, build from a normal volume
(e.g. `C:`) or deploy to Vercel.

## Out of Scope (Phase 2)

Subscription, payment, referral, multi-tenant, team management, folder
management, custom domain per user, CSV import, PDF export, geolocation analytics.
