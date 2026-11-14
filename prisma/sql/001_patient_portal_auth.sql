-- Migration: Patient portal authentication
-- Date: 2026-04-22
-- Safe to run: verified 0 duplicate (clinicId, email) pairs across 9 patients.
-- All column additions are nullable or defaulted. Enum additions are idempotent.

-- New Patient columns (all safe additions — no NOT NULL on new non-defaulted fields)
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "portalPassword" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "portalPasswordSetAt" TIMESTAMP(3);
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "portalMustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "portalTempPasswordExpiresAt" TIMESTAMP(3);
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "portalLastLoginAt" TIMESTAMP(3);
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "portalFailedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "portalLockedUntil" TIMESTAMP(3);

-- Composite unique constraint on (clinicId, email). Nulls are allowed (Postgres treats NULLs as distinct).
-- Guarded by a DO block so re-runs are safe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Patient_clinicId_email_key'
  ) THEN
    ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_email_key" UNIQUE ("clinicId", "email");
  END IF;
END$$;

-- New AuditAction enum values for portal events
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PORTAL_LOGIN';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PORTAL_LOGOUT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PORTAL_LOGIN_FAILED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PORTAL_PASSWORD_SET';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PORTAL_PASSWORD_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PORTAL_ACCOUNT_LOCKED';
