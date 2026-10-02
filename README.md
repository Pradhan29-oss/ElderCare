# Setu — Elder Care Platform (MVP)

A Next.js 16 + TypeScript + Tailwind + Prisma/Postgres web app with four
role-based dashboards (Family, Elder, Caregiver, Admin) covering the core
elder-care flows: SOS alerts, visit booking, medicine reminders, vitals,
and an admin overview.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Prisma ORM** → **PostgreSQL** (Neon / Supabase / Railway / Vercel Postgres — any of these work)
- **JWT session cookies** (httpOnly) for auth, passwords hashed with bcrypt
- **Tailwind CSS 4**

## 1. Local setup

```bash
cp .env.example .env
# edit .env and paste your real Postgres connection string + a random JWT_SECRET
npm install
npx prisma migrate dev --name init   # creates tables and the initial migration
npm run db:seed                       # optional: demo accounts (see below)
npm run dev
```

Open http://localhost:3000.

> If you ever hit a 404 after clicking a button, it's almost always a stale
> dev cache — stop the server, `rm -rf .next`, and `npm run dev` again.

## 2. Get a free Postgres database

Pick one (all have free tiers, all give you a `DATABASE_URL`):

- **Neon** — https://neon.tech (recommended, fastest to set up)
- **Supabase** — https://supabase.com
- **Railway** — https://railway.app
- **Vercel Postgres** — built into the Vercel dashboard, zero extra signup

Copy the connection string into `.env` as `DATABASE_URL`. Make sure it ends
with `?sslmode=require`.

## 3. Demo accounts (after `npm run db:seed`)

| Role      | Phone      | Password  |
|-----------|------------|-----------|
| Admin     | 9800000001 | admin123  |
| Family    | 9800000002 | family123 |
| Elder     | 9800000003 | elder123  |
| Caregiver | 9800000004 | care123   |

## 4. Deploy to Vercel

**Important**: run `npx prisma migrate dev --name init` locally first (step 1) and
commit the generated `prisma/migrations/` folder to git — Vercel's build only
runs `prisma migrate deploy`, which *applies* existing migration files, it
doesn't generate new ones. If migrations aren't committed, your tables won't
be created on deploy.

1. Push this repo to GitHub (make sure `prisma/migrations/` is included).
2. In Vercel: **New Project** → import the repo.
3. Add environment variables in the Vercel project settings:
   - `DATABASE_URL` — your Postgres connection string
   - `JWT_SECRET` — a long random string
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — from the Razorpay dashboard (Settings → API Keys)
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — from the Twilio console
4. Deploy. The build script (`prisma generate && prisma migrate deploy && next build`)
   applies your committed migrations automatically. Prisma 7 reads the database
   URL from `prisma.config.ts` and uses the PostgreSQL driver adapter at runtime.
5. Do not seed production with the public demo accounts. `npm run db:seed` is
   intended for local development only.

### Payments & SMS are optional at deploy time
Billing is disabled by default because this MVP does not yet provision the
advertised plan benefits. Keep `BILLING_ENABLED=false` until service fulfillment
and access entitlements are implemented. SOS attempts Twilio delivery to linked
family members when Twilio is configured; otherwise the app reports that no SMS
was sent. Add real keys only after verifying the target environment.

## What's in this build

- **Auth**: JWT session cookies, bcrypt-hashed passwords, rate-limited login/register (stops brute-force)
- **Validation**: every API route validates input with Zod before touching the database
- **Payments**: Razorpay checkout on the family dashboard, server-side signature verification (never trusts the client alone)
- **SMS**: SOS requests attempt delivery to linked family through Twilio when configured; delivery results are returned to the app
- **Authorization**: family members can only book visits / see data for elders actually linked to their account

## What's still an MVP, not the full spec

The original spec (mobile apps, Bhashini voice AI, ABDM/ABHA integration,
IoT device ingestion, Razorpay billing, SMS/WhatsApp, background GPS
check-in) is a multi-month, multi-service build. This repo covers the
**web core**: auth, role dashboards, visit booking, SOS alerts, medicine
tracking, and vitals — the foundation those bigger features would plug into.
Natural next slices, in order of impact: Razorpay checkout on the pricing
page, SMS notifications (Twilio/Exotel) on SOS trigger, and a caregiver
GPS check-in field on the visit model.
