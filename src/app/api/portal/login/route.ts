import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  signPortalSession,
  lockoutUntil,
  PORTAL_AUTH_CONSTANTS,
} from "@/lib/patient-auth";
import { verifyPassword, setPortalSessionCookie } from "@/lib/patient-auth-server";

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`portal-login:${ip}`, RATE_LIMITS.auth);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const patient = await prisma.patient.findFirst({
    where: { email, portalEnabled: true },
  });

  if (!patient || !patient.portalPassword) {
    await logAudit({
      action: "PORTAL_LOGIN_FAILED",
      resource: "Patient",
      description: `Portal login failed for email=${email}`,
    });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (patient.portalLockedUntil && patient.portalLockedUntil > new Date()) {
    return NextResponse.json({ error: "Account temporarily locked. Try again later." }, { status: 423 });
  }

  if (
    patient.portalTempPasswordExpiresAt &&
    patient.portalTempPasswordExpiresAt < new Date() &&
    patient.portalMustChangePassword
  ) {
    return NextResponse.json(
      { error: "Temporary password expired. Contact your clinic for a new one." },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(password, patient.portalPassword);
  if (!ok) {
    const nextFailedCount = patient.portalFailedLoginCount + 1;
    const shouldLock = nextFailedCount >= PORTAL_AUTH_CONSTANTS.MAX_FAILED_LOGINS;
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        portalFailedLoginCount: nextFailedCount,
        portalLockedUntil: shouldLock ? lockoutUntil() : null,
      },
    });
    await logAudit({
      action: shouldLock ? "PORTAL_ACCOUNT_LOCKED" : "PORTAL_LOGIN_FAILED",
      resource: "Patient",
      resourceId: patient.id,
      patientId: patient.id,
      description: shouldLock
        ? `Portal account locked after ${nextFailedCount} failed attempts`
        : `Portal login failed (attempt ${nextFailedCount})`,
    });
    return NextResponse.json(
      { error: shouldLock ? "Account temporarily locked. Try again later." : GENERIC_ERROR },
      { status: shouldLock ? 423 : 401 },
    );
  }

  await prisma.patient.update({
    where: { id: patient.id },
    data: {
      portalLastLoginAt: new Date(),
      portalFailedLoginCount: 0,
      portalLockedUntil: null,
    },
  });

  const token = await signPortalSession({
    patientId: patient.id,
    clinicId: patient.clinicId,
    mustChangePassword: patient.portalMustChangePassword,
  });
  await setPortalSessionCookie(token);

  await logAudit({
    action: "PORTAL_LOGIN",
    resource: "Patient",
    resourceId: patient.id,
    patientId: patient.id,
    description: "Portal login successful",
  });

  return NextResponse.json({
    ok: true,
    mustChangePassword: patient.portalMustChangePassword,
  });
}
