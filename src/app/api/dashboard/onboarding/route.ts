import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = session.user.clinicId;

    const [
      patientCount,
      encounterCount,
      inventoryCount,
      providerCount,
      clinic,
    ] = await Promise.all([
      prisma.patient.count({ where: { clinicId } }),
      prisma.consultation.count({
        where: { provider: { clinicId } },
      }),
      prisma.inventoryItem.count({ where: { clinicId } }),
      prisma.user.count({
        where: { clinicId, role: { in: ["PROVIDER", "ADMIN"] } },
      }),
      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { address: true },
      }),
    ]);

    return NextResponse.json({
      hasPatient: patientCount > 0,
      hasEncounter: encounterCount > 0,
      hasInventory: inventoryCount > 0,
      hasProvider: providerCount > 1, // More than the registering admin
      hasClinicSetup: clinic?.address != null,
    });
  } catch (error) {
    console.error("Onboarding check error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to check onboarding" }, { status: 500 });
  }
}
