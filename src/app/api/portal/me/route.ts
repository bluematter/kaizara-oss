import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/patient-auth-server";

export async function GET() {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patient = await prisma.patient.findFirst({
    where: { id: session.patientId, clinicId: session.clinicId, portalEnabled: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      dateOfBirth: true,
      portalMustChangePassword: true,
      clinic: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ patient });
}
