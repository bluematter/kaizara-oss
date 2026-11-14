import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEncounterEvent } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole, EncounterType, EncounterMode, ChartType, EncounterSignStatus, Prisma } from "@prisma/client";

// Validate ID format (CUID pattern)
function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// GET /api/encounters - List encounters with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!hasPermission(session.user.role as UserRole, "encounters:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const providerId = searchParams.get("providerId");
    const signStatus = searchParams.get("signStatus") as EncounterSignStatus | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Scope to clinic via provider's clinicId
    const where: Record<string, unknown> = {
      provider: { clinicId: session.user.clinicId },
    };
    if (patientId && isValidId(patientId)) where.patientId = patientId;
    if (providerId && isValidId(providerId)) where.providerId = providerId;
    if (signStatus && Object.values(EncounterSignStatus).includes(signStatus)) {
      where.signStatus = signStatus;
    }

    const [encounters, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          encounterType: true,
          encounterMode: true,
          chartType: true,
          chiefComplaint: true,
          signStatus: true,
          facility: true,
          createdAt: true,
          // Exclude JSON blobs (subjective, objective, assessment, plan)
          // Those are only needed on the encounter detail page
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          provider: {
            select: { id: true, name: true },
          },
          template: {
            select: { id: true, name: true },
          },
        },
        orderBy: { scheduledAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.consultation.count({ where }),
    ]);

    return NextResponse.json({ encounters, total, limit, offset });
  } catch (error) {
    console.error("Encounters list error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to list encounters" }, { status: 500 });
  }
}

// POST /api/encounters - Create a new encounter
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!hasPermission(session.user.role as UserRole, "encounters:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      patientId,
      scheduledAt,
      encounterType = "OFFICE_VISIT",
      encounterMode = "IN_PERSON",
      chartType = "BRIEF",
      templateId,
      facility,
      chiefComplaint,
    } = body;

    // Validate required fields
    if (!patientId || !isValidId(patientId)) {
      return NextResponse.json({ error: "Valid patientId is required" }, { status: 400 });
    }

    // Verify patient belongs to the same clinic
    if (session.user.clinicId) {
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, clinicId: session.user.clinicId },
        select: { id: true },
      });
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
    }

    // Validate enums
    if (!Object.values(EncounterType).includes(encounterType)) {
      return NextResponse.json({ error: "Invalid encounterType" }, { status: 400 });
    }
    if (!Object.values(EncounterMode).includes(encounterMode)) {
      return NextResponse.json({ error: "Invalid encounterMode" }, { status: 400 });
    }
    if (!Object.values(ChartType).includes(chartType)) {
      return NextResponse.json({ error: "Invalid chartType" }, { status: 400 });
    }

    // Load template if specified
    let templateData = null;
    if (templateId && isValidId(templateId)) {
      templateData = await prisma.encounterTemplate.findUnique({
        where: { id: templateId },
      });
    }

    const encounter = await prisma.consultation.create({
      data: {
        patientId,
        providerId: session.user.id,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        encounterType: encounterType as EncounterType,
        encounterMode: encounterMode as EncounterMode,
        chartType: chartType as ChartType,
        templateId: templateId || null,
        facility: facility?.slice(0, 200) || null,
        chiefComplaint: chiefComplaint?.slice(0, 500) || null,
        signStatus: "DRAFT",
        // Pre-fill from template if available (use Prisma.JsonNull for null JSON values)
        subjective: templateData?.subjective ?? Prisma.JsonNull,
        objective: templateData?.objective ?? Prisma.JsonNull,
        assessment: templateData?.assessment ?? Prisma.JsonNull,
        plan: templateData?.plan ?? Prisma.JsonNull,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
    });

    await logEncounterEvent(encounter.id, patientId, "CREATE", "Encounter created");

    return NextResponse.json(encounter, { status: 201 });
  } catch (error) {
    console.error("Create encounter error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to create encounter" }, { status: 500 });
  }
}
