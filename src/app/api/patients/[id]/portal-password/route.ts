import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@prisma/client";
import { generateTempPassword, tempPasswordExpiry } from "@/lib/patient-auth";
import { hashPassword } from "@/lib/patient-auth-server";

// GET - return portal access status (without exposing the hash)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  if (!hasPermission(session.user.role as UserRole, "patients:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: session.user.clinicId },
    select: {
      id: true,
      email: true,
      portalEnabled: true,
      portalPasswordSetAt: true,
      portalLastLoginAt: true,
      portalMustChangePassword: true,
      portalTempPasswordExpiresAt: true,
      portalLockedUntil: true,
    },
  });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  return NextResponse.json({
    hasPassword: !!patient.portalPasswordSetAt,
    email: patient.email,
    portalEnabled: patient.portalEnabled,
    lastLoginAt: patient.portalLastLoginAt,
    mustChangePassword: patient.portalMustChangePassword,
    tempPasswordExpiresAt: patient.portalTempPasswordExpiresAt,
    locked: !!(patient.portalLockedUntil && patient.portalLockedUntil > new Date()),
  });
}

// POST - generate a new temp password (single-use, force change on first login)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  if (!hasPermission(session.user.role as UserRole, "patients:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: session.user.clinicId },
    select: { id: true, email: true, portalEnabled: true, firstName: true, lastName: true },
  });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  if (!patient.email) {
    return NextResponse.json(
      { error: "Patient must have an email before portal access can be granted." },
      { status: 400 },
    );
  }

  const tempPassword = generateTempPassword();
  const hashed = await hashPassword(tempPassword);

  await prisma.patient.update({
    where: { id: patient.id },
    data: {
      portalPassword: hashed,
      portalPasswordSetAt: new Date(),
      portalMustChangePassword: true,
      portalTempPasswordExpiresAt: tempPasswordExpiry(),
      portalEnabled: true,
      portalFailedLoginCount: 0,
      portalLockedUntil: null,
    },
  });

  await logAudit({
    action: "PORTAL_PASSWORD_SET",
    resource: "Patient",
    resourceId: patient.id,
    patientId: patient.id,
    description: `Staff generated portal password for ${patient.firstName} ${patient.lastName}`,
  });

  return NextResponse.json({
    ok: true,
    email: patient.email,
    tempPassword, // returned ONCE — staff must copy and give to patient
    expiresAt: tempPasswordExpiry(),
  });
}
