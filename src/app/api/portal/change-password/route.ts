import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { signPortalSession, validatePasswordPolicy } from "@/lib/patient-auth";
import {
  getPortalSession,
  hashPassword,
  setPortalSessionCookie,
  verifyPassword,
} from "@/lib/patient-auth-server";

export async function POST(req: NextRequest) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password required." }, { status: 400 });
  }

  const policy = validatePasswordPolicy(newPassword);
  if (!policy.ok) {
    return NextResponse.json({ error: policy.reason }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "New password must differ from current password." }, { status: 400 });
  }

  const patient = await prisma.patient.findFirst({
    where: { id: session.patientId, clinicId: session.clinicId, portalEnabled: true },
  });
  if (!patient || !patient.portalPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ok = await verifyPassword(currentPassword, patient.portalPassword);
  if (!ok) {
    await logAudit({
      action: "PORTAL_LOGIN_FAILED",
      resource: "Patient",
      resourceId: patient.id,
      patientId: patient.id,
      description: "Password change rejected: current password incorrect",
    });
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const hashed = await hashPassword(newPassword);
  await prisma.patient.update({
    where: { id: patient.id },
    data: {
      portalPassword: hashed,
      portalPasswordSetAt: new Date(),
      portalMustChangePassword: false,
      portalTempPasswordExpiresAt: null,
      portalFailedLoginCount: 0,
      portalLockedUntil: null,
    },
  });

  // Rotate session with updated mustChangePassword flag
  const token = await signPortalSession({
    patientId: patient.id,
    clinicId: patient.clinicId,
    mustChangePassword: false,
  });
  await setPortalSessionCookie(token);

  await logAudit({
    action: "PORTAL_PASSWORD_CHANGED",
    resource: "Patient",
    resourceId: patient.id,
    patientId: patient.id,
    description: "Patient changed portal password",
  });

  return NextResponse.json({ ok: true });
}
