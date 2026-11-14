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

// GET /api/patients/[id]/medications - List patient medications
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

    const medications = await prisma.patientMedication.findMany({
      where,
      orderBy: { name: "asc" },
    });

    await logPatientAccess(patientId, "VIEW", "Medications");

    return NextResponse.json(medications);
  } catch (error) {
    console.error("List medications error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to list medications" }, { status: 500 });
  }
}

// POST /api/patients/[id]/medications - Add a new medication
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
    const { name, dosage, frequency, route, prescriber, startDate, endDate, notes } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Medication name is required" }, { status: 400 });
    }

    const medication = await prisma.patientMedication.create({
      data: {
        patientId,
        name: name.trim().slice(0, 200),
        dosage: dosage?.trim().slice(0, 100) || null,
        frequency: frequency?.trim().slice(0, 100) || null,
        route: route?.trim().slice(0, 50) || null,
        prescriber: prescriber?.trim().slice(0, 200) || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: ClinicalStatus.ACTIVE,
        notes: notes?.slice(0, 2000) || null,
      },
    });

    await logClinicalDataChange(patientId, "Medication", "CREATE", medication.id, `Added medication: ${name}`);

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error("Create medication error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to create medication" }, { status: 500 });
  }
}
