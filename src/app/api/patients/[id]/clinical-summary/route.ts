import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logPatientAccess } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole, ClinicalStatus } from "@prisma/client";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// GET /api/patients/[id]/clinical-summary - Get patient's clinical data for chart sidebar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!hasPermission(session.user.role as UserRole, "clinical:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: patientId } = await params;
    if (!isValidId(patientId)) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }

    // Verify patient exists AND belongs to caller's clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Fetch all clinical data in parallel
    const [
      allergies,
      medications,
      diagnoses,
      supplements,
      recentVitals,
      socialHistory,
      familyHistory,
      recentInjections,
    ] = await Promise.all([
      // Active allergies
      prisma.patientAllergy.findMany({
        where: { patientId, status: ClinicalStatus.ACTIVE },
        orderBy: { severity: "desc" },
      }),
      // Active medications
      prisma.patientMedication.findMany({
        where: { patientId, status: ClinicalStatus.ACTIVE },
        orderBy: { name: "asc" },
      }),
      // Active diagnoses (primary first)
      prisma.patientDiagnosis.findMany({
        where: { patientId, status: ClinicalStatus.ACTIVE },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      }),
      // Active supplements
      prisma.patientSupplement.findMany({
        where: { patientId, status: ClinicalStatus.ACTIVE },
        orderBy: { name: "asc" },
      }),
      // Most recent vitals (one of each type)
      prisma.objectiveData.findMany({
        where: { patientId },
        orderBy: { measuredAt: "desc" },
        take: 10,
        distinct: ["type"],
      }),
      // Social history
      prisma.patientSocialHistory.findUnique({
        where: { patientId },
      }),
      // Family history
      prisma.patientFamilyHistory.findMany({
        where: { patientId },
        orderBy: { relationship: "asc" },
      }),
      // Recent injections (last 5)
      prisma.patientInjection.findMany({
        where: { patientId },
        include: { administeredBy: { select: { id: true, name: true } } },
        orderBy: { administeredAt: "desc" },
        take: 5,
      }),
    ]);

    await logPatientAccess(patientId, "VIEW", "ClinicalSummary");

    return NextResponse.json({
      patient,
      allergies,
      medications,
      diagnoses,
      supplements,
      vitals: recentVitals,
      socialHistory,
      familyHistory,
      recentInjections,
    });
  } catch (error) {
    console.error("Clinical summary error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to get clinical summary" }, { status: 500 });
  }
}
