import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logInjectionAdministration, logPatientAccess } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole, InjectionRoute } from "@prisma/client";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// GET /api/patients/[id]/injections - List patient injection history
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

    if (!hasPermission(session.user.role as UserRole, "injections:read")) {
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const medication = searchParams.get("medication");

    const where: Record<string, unknown> = { patientId };
    if (medication) {
      where.medication = { contains: medication, mode: "insensitive" };
    }

    const [injections, total] = await Promise.all([
      prisma.patientInjection.findMany({
        where,
        include: {
          administeredBy: { select: { id: true, name: true } },
          encounter: { select: { id: true, scheduledAt: true } },
          inventoryItem: { select: { id: true, name: true, lotNumber: true } },
        },
        orderBy: { administeredAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.patientInjection.count({ where }),
    ]);

    await logPatientAccess(patientId, "VIEW", "Injections");

    return NextResponse.json({ injections, total, limit, offset });
  } catch (error) {
    console.error("List injections error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to list injections" }, { status: 500 });
  }
}

// POST /api/patients/[id]/injections - Record an injection administration
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

    if (!hasPermission(session.user.role as UserRole, "injections:write")) {
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
    const {
      medication,
      dose,
      unit,
      concentration,
      route = "SUBCUTANEOUS",
      site,
      lotNumber,
      expirationDate,
      manufacturer,
      administeredAt,
      encounterId,
      inventoryItemId,
      patientResponse,
      notes,
    } = body;

    // Validate required fields
    if (!medication || typeof medication !== "string" || medication.trim().length < 2) {
      return NextResponse.json({ error: "Medication is required" }, { status: 400 });
    }

    if (!dose || typeof dose !== "string") {
      return NextResponse.json({ error: "Dose is required" }, { status: 400 });
    }

    // Validate route enum
    if (!Object.values(InjectionRoute).includes(route)) {
      return NextResponse.json({ error: "Invalid injection route" }, { status: 400 });
    }

    // Create injection record
    const injection = await prisma.patientInjection.create({
      data: {
        patientId,
        medication: medication.trim().slice(0, 200),
        dose: dose.trim().slice(0, 50),
        unit: unit?.trim().slice(0, 20) || null,
        concentration: concentration?.trim().slice(0, 50) || null,
        route: route as InjectionRoute,
        site: site?.trim().slice(0, 100) || null,
        lotNumber: lotNumber?.trim().slice(0, 100) || null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        manufacturer: manufacturer?.trim().slice(0, 200) || null,
        administeredAt: administeredAt ? new Date(administeredAt) : new Date(),
        administeredById: session.user.id,
        encounterId: encounterId && isValidId(encounterId) ? encounterId : null,
        inventoryItemId: inventoryItemId && isValidId(inventoryItemId) ? inventoryItemId : null,
        patientResponse: patientResponse?.slice(0, 2000) || null,
        notes: notes?.slice(0, 2000) || null,
      },
      include: {
        administeredBy: { select: { id: true, name: true } },
        encounter: { select: { id: true, scheduledAt: true } },
        inventoryItem: { select: { id: true, name: true, lotNumber: true } },
      },
    });

    // Auto-deduct from inventory if linked
    if (inventoryItemId && isValidId(inventoryItemId)) {
      await prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { quantity: { decrement: 1 } },
      });
    }

    // Audit log for compliance
    await logInjectionAdministration(injection.id, patientId, {
      medication,
      dose,
      lotNumber: lotNumber || undefined,
      administeredById: session.user.id,
    });

    return NextResponse.json(injection, { status: 201 });
  } catch (error) {
    console.error("Create injection error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to record injection" }, { status: 500 });
  }
}
