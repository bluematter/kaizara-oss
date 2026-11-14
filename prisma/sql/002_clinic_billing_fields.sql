-- Migration: Clinic billing fields
-- Date: 2026-04-22
-- Safe to run: all changes are additions. No data loss possible.
--   - New enum type created fresh (no conflict)
--   - New columns are nullable or defaulted
--   - billingCustomerId unique index allows multiple NULLs (Postgres treats NULLs as distinct)
-- Backfill: existing clinics get plan = FREE_TRIAL (matches default).
--
-- Naming: provider-agnostic. Whether we end up on Stripe, Whop, or another
-- processor, these columns don't care. See memory/billing_constraints.md.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClinicPlan') THEN
    CREATE TYPE "ClinicPlan" AS ENUM ('FREE_TRIAL', 'STARTER', 'PRO', 'CANCELED');
  END IF;
END$$;

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "plan" "ClinicPlan" NOT NULL DEFAULT 'FREE_TRIAL';

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "billingProvider" TEXT;

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "billingCustomerId" TEXT;

-- Unique index on billingCustomerId (nulls are distinct in Postgres by default)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Clinic_billingCustomerId_key'
  ) THEN
    ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_billingCustomerId_key" UNIQUE ("billingCustomerId");
  END IF;
END$$;
