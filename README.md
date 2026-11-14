# Kaizara

Kaizara is a clinic operating system for peptide, longevity and cash-pay wellness clinics. It covers patient records, SOAP charting, inventory with lot tracking, lab PDF parsing, a patient portal, messaging and tasks.

> **Warning: demo data only.** This repo ships with invented patients, a demo login and a seed script. Do not put real patient data in it until the items in "Before real patients" below are done.

## What works

- Staff login with roles (admin, provider, staff) and a 30 minute session
- Patients, encounters with SOAP notes, sign and co-sign flow, amendments
- Inventory, shipments, tasks, memberships, message threads
- Lab PDF upload and AI parsing, plus an AI chat about lab results (needs a fal.ai key)
- Patient portal with its own email and password login, lockout and forced first password change
- Audit log for sign-in and record access
- A public page for one CPT code (96372), with original write-up text

## What is rough

- The marketing page is a stub. There are no real screenshots or testimonials.
- Only one CPT code page exists. No AMA code descriptions are bundled.
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

You need Node 20+, npm and a Postgres database.

```bash
cp .env.example .env        # then edit it
npm install
npm run db:push             # create tables
ALLOW_SEED=true npm run db:seed   # demo data, dev databases only
npm run dev -- -p 3001
```

Open http://localhost:3001 and sign in with the demo account shown on the login page.

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run db:generate`, `npm run db:migrate`, `npm run db:studio`.

## Environment variables

| Name | Needed for |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Required. |
| `AUTH_SECRET` | Signs staff and portal sessions. Required. |
| `AUTH_URL` | Base URL of the app. |
| `FAL_KEY` | fal.ai key for AI chat and lab parsing. Optional. Without it those two features fail, the rest works. |
| `NEXT_PUBLIC_SITE_URL` | Public base URL for canonical links, sitemap and robots. Defaults to `http://localhost:3001`. |
| `NEXT_PUBLIC_DEMO_MODE` | Shows the demo login hint. |
| `ALLOW_SEED` | Must be `true` to run the seed script. |

## Stack

Next.js 16, React 19, Prisma 6 with Postgres, Auth.js (credentials), Tailwind CSS 4, Radix UI.

## License

AGPL-3.0. See `LICENSE`.

## Who built this

Michael Aubry, mja.sh.
