import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEncounterEvent } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole, EncounterSignStatus } from "@prisma/client";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// GET /api/encounters/[id] - Get a single encounter with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid encounter ID" }, { status: 400 });
    }

    const encounter = await prisma.consultation.findFirst({
      where: {
        id,
        provider: { clinicId: session.user.clinicId },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            email: true,
            phone: true,
          },
        },
        provider: { select: { id: true, name: true, email: true } },
        signedBy: { select: { id: true, name: true } },
        coSignedBy: { select: { id: true, name: true } },
        template: { select: { id: true, name: true, macros: true } },
        amendments: {
          include: { amendedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        injections: {
          include: { administeredBy: { select: { id: true, name: true } } },
          orderBy: { administeredAt: "desc" },
        },
        dispenseLogs: {
          include: { inventoryItem: { select: { id: true, name: true, lotNumber: true } } },
        },
        symptomEntries: {
          include: { symptomType: true },
        },
      },
    });

    if (!encounter) {
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    }

    await logEncounterEvent(id, encounter.patientId, "VIEW", "Encounter viewed");

    return NextResponse.json(encounter);
  } catch (error) {
    console.error("Get encounter error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to get encounter" }, { status: 500 });
  }
}

// PATCH /api/encounters/[id] - Update an encounter (only if not signed)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid encounter ID" }, { status: 400 });
    }

    // Check if encounter exists, belongs to clinic, and is editable
    const existing = await prisma.consultation.findFirst({
      where: { id, provider: { clinicId: session.user.clinicId } },
      select: { signStatus: true, patientId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    }

    const isSignedEncounter = existing.signStatus === EncounterSignStatus.SIGNED ||
        existing.signStatus === EncounterSignStatus.AMENDED;

    const body = await request.json();
    const {
      chiefComplaint,
      subjective,
      objective,
      assessment,
      plan,
      status,
      signStatus,
      duration,
      facility,
      transcription,
      aiSummary,
      providerNotes,
      isAmendment,
    } = body;

    // Signed encounters can only be amended (note content only)
    if (isSignedEncounter && !isAmendment) {
      return NextResponse.json(
        { error: "Signed encounters cannot be edited. Use amendment mode." },
        { status: 400 }
      );
    }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (isSignedEncounter) {
      // Amendment mode: only allow note content changes, not metadata
      if (subjective !== undefined) updateData.subjective = subjective;
      if (objective !== undefined) updateData.objective = objective;
      if (assessment !== undefined) updateData.assessment = assessment;
      if (plan !== undefined) updateData.plan = plan;
      if (providerNotes !== undefined) updateData.providerNotes = providerNotes;
      updateData.signStatus = EncounterSignStatus.AMENDED;
    } else {
      if (chiefComplaint !== undefined) updateData.chiefComplaint = chiefComplaint?.slice(0, 500);
      if (subjective !== undefined) updateData.subjective = subjective;
      if (objective !== undefined) updateData.objective = objective;
      if (assessment !== undefined) updateData.assessment = assessment;
      if (plan !== undefined) updateData.plan = plan;
      if (status !== undefined) updateData.status = status;
      if (duration !== undefined) updateData.duration = typeof duration === "number" ? duration : null;
      if (facility !== undefined) updateData.facility = facility?.slice(0, 200);
      if (transcription !== undefined) updateData.transcription = transcription;
      if (aiSummary !== undefined) updateData.aiSummary = aiSummary;
      if (providerNotes !== undefined) updateData.providerNotes = providerNotes;
    }

    // Allow changing sign status to UNSIGNED (ready for signing)
    if (signStatus === "UNSIGNED") {
      updateData.signStatus = EncounterSignStatus.UNSIGNED;
    }

    const encounter = await prisma.consultation.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
    });

    await logEncounterEvent(id, existing.patientId, "UPDATE", "Encounter updated");

    return NextResponse.json(encounter);
  } catch (error) {
    console.error("Update encounter error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to update encounter" }, { status: 500 });
  }
}
