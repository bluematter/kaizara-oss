import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEncounterEvent } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole, EncounterSignStatus, Prisma } from "@prisma/client";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// POST /api/encounters/[id]/amend - Amend a signed encounter (HIPAA compliant)
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

    if (!hasPermission(session.user.role as UserRole, "encounters:amend")) {
      return NextResponse.json({ error: "Forbidden: cannot amend encounters" }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid encounter ID" }, { status: 400 });
    }

    const body = await request.json();
    const { reason, changes } = body;

    // Validate required fields
    if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Amendment reason is required (min 10 characters)" },
        { status: 400 }
      );
    }

    if (!changes || typeof changes !== "object") {
      return NextResponse.json(
        { error: "Changes object is required" },
        { status: 400 }
      );
    }

    // Scope encounter lookup by caller's clinic (via provider.clinicId)
    const encounter = await prisma.consultation.findFirst({
      where: { id, provider: { clinicId: session.user.clinicId } },
      select: {
        signStatus: true,
        patientId: true,
        subjective: true,
        objective: true,
        assessment: true,
        plan: true,
        chiefComplaint: true,
      },
    });

    if (!encounter) {
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    }

    // Can only amend SIGNED or AMENDED encounters
    if (encounter.signStatus !== EncounterSignStatus.SIGNED &&
        encounter.signStatus !== EncounterSignStatus.AMENDED) {
      return NextResponse.json(
        { error: "Only signed encounters can be amended" },
        { status: 400 }
      );
    }

    // Build the changes record for audit trail
    const changeRecord: Record<string, { before: unknown; after: unknown }> = {};
    const updateData: Record<string, unknown> = {};

    // Track changes to each field
    const allowedFields = ["subjective", "objective", "assessment", "plan", "chiefComplaint"];

    for (const field of allowedFields) {
      if (changes[field] !== undefined) {
        changeRecord[field] = {
          before: encounter[field as keyof typeof encounter],
          after: changes[field],
        };
        updateData[field] = changes[field];
      }
    }

    if (Object.keys(changeRecord).length === 0) {
      return NextResponse.json(
        { error: "No valid changes provided" },
        { status: 400 }
      );
    }

    // Use transaction to create amendment record and update encounter
    const [amendment, updatedEncounter] = await prisma.$transaction([
      // Create amendment record (immutable audit trail)
      prisma.encounterAmendment.create({
        data: {
          encounterId: id,
          amendedById: session.user.id,
          reason: reason.trim().slice(0, 2000),
          changes: changeRecord as Prisma.InputJsonValue,
        },
        include: {
          amendedBy: { select: { id: true, name: true } },
        },
      }),
      // Update encounter
      prisma.consultation.update({
        where: { id },
        data: {
          ...updateData,
          signStatus: EncounterSignStatus.AMENDED,
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          provider: { select: { id: true, name: true } },
          signedBy: { select: { id: true, name: true } },
          amendments: {
            include: { amendedBy: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

    await logEncounterEvent(id, encounter.patientId, "AMEND", "Encounter amended", {
      amendmentId: amendment.id,
      reason: reason.trim().slice(0, 200),
      fieldsChanged: Object.keys(changeRecord),
    });

    return NextResponse.json({
      amendment,
      encounter: updatedEncounter,
    });
  } catch (error) {
    console.error("Amend encounter error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to amend encounter" }, { status: 500 });
  }
}
