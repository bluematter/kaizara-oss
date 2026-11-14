# Kaizara

Kaizara is a clinic operating system for peptide, longevity and cash-pay wellness clinics. It covers patient records, SOAP charting, inventory with lot tracking, lab PDF parsing, a patient portal, messaging and tasks.

> **Warning: demo data only.** This repo ships with invented patients, a demo login and a seed script. Do not put real patient data in it until the items in "Before real patients" below are done.

## Why this exists

Clinics in this niche often stitch together five or six tools to run the day. Kaizara puts that work in one open codebase they can read, run and change.

## What works

- Staff login with roles (admin, provider, staff) and a 30 minute session
- Patients, encounters with SOAP notes, sign and co-sign flow, amendments
- Inventory, shipments, tasks and memberships, plus demo message threads
- Lab PDF upload and AI parsing, plus an AI chat about lab results (needs a fal.ai key)
- Patient portal with its own email and password login, lockout and forced first password change
- Audit log for sign-in and record access
- A page for one CPT code (96372), with original write-up text

## What is in the box

| Area | What it does | Where the code lives |
| --- | --- | --- |
| Staff access | Login with admin, provider and staff roles. | `src/lib/auth.ts`, `src/lib/rbac.ts`, `src/middleware.ts` |
| Patient charts | Patient records, SOAP notes, signing, co-signing and amendments. | `src/app/(dashboard)/patients/`, `src/components/encounters/` |
| Labs | PDF parsing, marker review and saved patient panels. The demo portal includes sample trends. | `src/components/labs/`, `src/app/(dashboard)/labs/`, `src/app/api/labs/` |
| Inventory and shipping | Quantities, lots, expiry dates, costs and shipment records. | `src/app/(dashboard)/inventory/`, `src/app/(dashboard)/shipping/` |
| Patient portal | Separate patient login with lockout and a required first password change. Includes demo lab and protocol views. | `src/app/p/`, `src/components/patients/portal-access-dialog.tsx` |
| Messaging | Staff and patient thread previews with simulated sending. A message API exists but is not connected to these screens. | `src/app/(dashboard)/messages/`, `src/components/messaging/`, `src/app/api/messages/` |
| Clinic work | Tasks and patient membership records. No payment processing. | `src/app/(dashboard)/tasks/`, `src/app/(dashboard)/patients/[id]/page.tsx` |
| Audit log | Records sign-in and record access events. | `src/lib/audit.ts` |
| CPT reference | Original content for code 96372 and a sample reviewer profile. | `src/app/codes/`, `src/lib/cpt/` |
| Demo data | Invented patients and clinic records for local development. | `prisma/seed.ts`, `src/lib/mock-data/` |

## What is rough

- The landing page uses drawn previews. There are no real screenshots or testimonials.
- Only one CPT code page exists. No AMA code descriptions are bundled. The CPT and author pages currently require staff login through the middleware.
- Staff and patient messaging screens use sample threads and simulate sending. Replies are not saved or delivered.
- Portal lab views and trend charts use sample history for the demo patient. They are not connected to uploaded lab results.
- No payments, no e-prescribing, no telemedicine.
- Rate limiting is in memory, so it resets on restart and does not work across servers.
- `/api/chat` and `/api/labs/parse` need a signed-in session and are rate limited per user, but the limit is in memory. Set spending limits on your fal.ai key.
- All names in the demo data and in `src/lib/cpt/` are invented. The CPT reviewer profile is sample content.

## Before real patients

- Sign a BAA with your database host and with the AI provider, or switch to one that offers it.
- Review the portal auth (password login exists, but it has had no security audit or pen test).
- Add patient consent tracking for AI features.
- Add patient data export and delete.
- Remove all demo and mock data, then get a security review.

## Run it

You need Node 20.9+, npm and Docker with Compose v2. These steps use a local Postgres 16 database. Start in a local copy of this repo.

1. Copy the environment file and generate an auth secret.

   ```bash
   cp .env.example .env
   openssl rand -base64 32
   ```

   Set `AUTH_SECRET` in `.env` to the generated value. Keep the local `DATABASE_URL` for the database below. Leave `FAL_KEY` empty unless you want to try AI chat or lab parsing.

2. Start Postgres and wait for it to be ready.

   ```bash
   docker compose up -d --wait
   ```

   `docker-compose.yml` binds Postgres to `127.0.0.1:5432` and stores data in a named volume. The database is `kaizara`; both the local user and password are `postgres`. These match `.env.example`. Port 5432 must be free.

3. Install dependencies, then create the tables and seed demo data.

   ```bash
   npm install
   npm run setup
   ```

   `setup` runs `npm run db:push`, then `ALLOW_SEED=true npm run db:seed`. The seed requires that exact opt-in value. Run setup only against a local demo database. Reruns replace some demo records, reset demo staff passwords and can add duplicate encounters.

4. Start the app on port 3001.

   ```bash
   npm run dev -- -p 3001
   ```

   Open http://localhost:3001, choose "Try the demo" and use the account shown on the login page.

To try the patient portal, open Jamie Rivera's patient chart as staff and use "Portal access" to generate a temporary password. Sign in at `/p/login` with `demo.patient@example.com` and that password. You will be asked to change it.

Stop the database with `docker compose down`. The named volume keeps its data.

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run db:generate`, `npm run db:migrate`, `npm run db:studio`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for small PRs and [SECURITY.md](SECURITY.md) for private security reports.

## Environment variables

| Name | Needed for |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Required. |
| `AUTH_SECRET` | Signs staff and portal sessions. Required. |
| `AUTH_URL` | Base URL of the app. |
| `FAL_KEY` | fal.ai key for AI chat and lab parsing. Optional. Without it those two features fail, the rest works. |
| `NEXT_PUBLIC_SITE_URL` | Public base URL for canonical links, sitemap and robots. Defaults to `http://localhost:3001`. |
| `NEXT_PUBLIC_DEMO_MODE` | Shows the demo login hint. |
| `ALLOW_SEED` | Must be `true` to run the seed script. `npm run setup` sets it for the seed command only. |

## Stack

Next.js 16, React 19, Prisma 6 with Postgres, Auth.js (credentials), Tailwind CSS 4, Radix UI.

## License

AGPL-3.0. See `LICENSE`.

## Who built this

Michael Aubry, [mja.sh](https://mja.sh).

## Need help with it

If you want this set up for your clinic, a new website, or a custom app, the author takes on that work: [mja.sh](https://mja.sh).
