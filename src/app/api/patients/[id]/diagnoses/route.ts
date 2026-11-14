import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logClinicalDataChange, logPatientAccess } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole, ClinicalStatus } from "@prisma/client";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// GET /api/patients/[id]/diagnoses - List patient diagnoses (problem list)
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

    const patientInClinic = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
      select: { id: true },
    });
    if (!patientInClinic) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: Record<string, unknown> = { patientId };
    if (!includeInactive) {
      where.status = ClinicalStatus.ACTIVE;
    }

    const diagnoses = await prisma.patientDiagnosis.findMany({
      where,
      orderBy: [{ isPrimary: "desc" }, { description: "asc" }],
    });

    await logPatientAccess(patientId, "VIEW", "Diagnoses");

    return NextResponse.json(diagnoses);
  } catch (error) {
    console.error("List diagnoses error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to list diagnoses" }, { status: 500 });
  }
}

// POST /api/patients/[id]/diagnoses - Add a new diagnosis
export async function POST(
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

    if (!hasPermission(session.user.role as UserRole, "clinical:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: patientId } = await params;
    if (!isValidId(patientId)) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }

    const patientInClinic = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
      select: { id: true },
    });
    if (!patientInClinic) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await request.json();
    const { icd10Code, description, isPrimary = false, onsetDate, notes } = body;

    if (!description || typeof description !== "string" || description.trim().length < 2) {
      return NextResponse.json({ error: "Diagnosis description is required" }, { status: 400 });
    }

    // If setting as primary, unset other primary diagnoses
    if (isPrimary) {
      await prisma.patientDiagnosis.updateMany({
        where: { patientId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const diagnosis = await prisma.patientDiagnosis.create({
      data: {
        patientId,
        icd10Code: icd10Code?.trim().slice(0, 20) || null,
        description: description.trim().slice(0, 500),
        isPrimary: Boolean(isPrimary),
        status: ClinicalStatus.ACTIVE,
        onsetDate: onsetDate ? new Date(onsetDate) : null,
        notes: notes?.slice(0, 2000) || null,
      },
    });

    const displayName = icd10Code ? `${description} [${icd10Code}]` : description;
    await logClinicalDataChange(patientId, "Diagnosis", "CREATE", diagnosis.id, `Added diagnosis: ${displayName}`);

    return NextResponse.json(diagnosis, { status: 201 });
  } catch (error) {
    console.error("Create diagnosis error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to create diagnosis" }, { status: 500 });
  }
}
