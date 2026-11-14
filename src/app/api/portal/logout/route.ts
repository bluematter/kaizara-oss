import { NextResponse } from "next/server";
import { clearPortalSessionCookie, getPortalSession } from "@/lib/patient-auth-server";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await getPortalSession();
  await clearPortalSessionCookie();
  if (session) {
    await logAudit({
      action: "PORTAL_LOGOUT",
      resource: "Patient",
      resourceId: session.patientId,
      patientId: session.patientId,
      description: "Portal logout",
    });
  }
  return NextResponse.json({ ok: true });
}
