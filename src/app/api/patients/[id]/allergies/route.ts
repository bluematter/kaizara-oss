import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logClinicalDataChange, logPatientAccess } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole, AllergySeverity, ClinicalStatus } from "@prisma/client";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// GET /api/patients/[id]/allergies - List patient allergies
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

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: Record<string, unknown> = { patientId };
    if (!includeInactive) {
      where.status = ClinicalStatus.ACTIVE;
    }

    const allergies = await prisma.patientAllergy.findMany({
      where,
      orderBy: [{ severity: "desc" }, { allergen: "asc" }],
    });

    await logPatientAccess(patientId, "VIEW", "Allergies");

    return NextResponse.json(allergies);
  } catch (error) {
    console.error("List allergies error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to list allergies" }, { status: 500 });
  }
}

// POST /api/patients/[id]/allergies - Add a new allergy
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

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await request.json();
    const { allergen, reaction, severity = "MODERATE", onsetDate, notes } = body;

    if (!allergen || typeof allergen !== "string" || allergen.trim().length < 2) {
      return NextResponse.json({ error: "Allergen is required" }, { status: 400 });
    }

    const allergy = await prisma.patientAllergy.create({
      data: {
        patientId,
        allergen: allergen.trim().slice(0, 200),
        reaction: reaction?.trim().slice(0, 500) || null,
        severity: Object.values(AllergySeverity).includes(severity) ? severity : "MODERATE",
        status: ClinicalStatus.ACTIVE,
        onsetDate: onsetDate ? new Date(onsetDate) : null,
        notes: notes?.slice(0, 2000) || null,
      },
    });

    await logClinicalDataChange(patientId, "Allergy", "CREATE", allergy.id, `Added allergy: ${allergen}`);

    return NextResponse.json(allergy, { status: 201 });
  } catch (error) {
    console.error("Create allergy error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to create allergy" }, { status: 500 });
  }
}
