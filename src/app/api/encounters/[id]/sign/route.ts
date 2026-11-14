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

// POST /api/encounters/[id]/sign - Sign or co-sign an encounter
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

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid encounter ID" }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body; // "sign" or "cosign"

    // Scope encounter lookup by caller's clinic (via provider.clinicId)
    const encounter = await prisma.consultation.findFirst({
      where: { id, provider: { clinicId: session.user.clinicId } },
      select: {
        signStatus: true,
        patientId: true,
        providerId: true,
        signedById: true,
      },
    });

    if (!encounter) {
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    }

    // Handle signing
    if (action === "sign") {
      if (!hasPermission(session.user.role as UserRole, "encounters:sign")) {
        return NextResponse.json({ error: "Forbidden: cannot sign encounters" }, { status: 403 });
      }

      // Can only sign DRAFT or UNSIGNED encounters
      if (encounter.signStatus !== EncounterSignStatus.DRAFT &&
          encounter.signStatus !== EncounterSignStatus.UNSIGNED) {
        return NextResponse.json(
          { error: `Cannot sign encounter with status: ${encounter.signStatus}` },
          { status: 400 }
        );
      }

      const updated = await prisma.consultation.update({
        where: { id },
        data: {
          signStatus: EncounterSignStatus.SIGNED,
          signedAt: new Date(),
          signedById: session.user.id,
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          provider: { select: { id: true, name: true } },
          signedBy: { select: { id: true, name: true } },
        },
      });

      await logEncounterEvent(id, encounter.patientId, "SIGN", "Encounter signed", {
        signedById: session.user.id,
        signedAt: updated.signedAt,
      });

      return NextResponse.json(updated);
    }

    // Handle co-signing
    if (action === "cosign") {
      if (!hasPermission(session.user.role as UserRole, "encounters:cosign")) {
        return NextResponse.json({ error: "Forbidden: cannot co-sign encounters" }, { status: 403 });
      }

      // Can only co-sign PENDING_COSIGN encounters
      if (encounter.signStatus !== EncounterSignStatus.PENDING_COSIGN) {
        return NextResponse.json(
          { error: `Cannot co-sign encounter with status: ${encounter.signStatus}` },
          { status: 400 }
        );
      }

      // Cannot co-sign your own encounter
      if (encounter.signedById === session.user.id) {
        return NextResponse.json(
          { error: "Cannot co-sign your own encounter" },
          { status: 400 }
        );
      }

      const updated = await prisma.consultation.update({
        where: { id },
        data: {
          signStatus: EncounterSignStatus.SIGNED,
          coSignedAt: new Date(),
          coSignedById: session.user.id,
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          provider: { select: { id: true, name: true } },
          signedBy: { select: { id: true, name: true } },
          coSignedBy: { select: { id: true, name: true } },
        },
      });

      await logEncounterEvent(id, encounter.patientId, "COSIGN", "Encounter co-signed", {
        coSignedById: session.user.id,
        coSignedAt: updated.coSignedAt,
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action. Use 'sign' or 'cosign'" }, { status: 400 });
  } catch (error) {
    console.error("Sign encounter error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to sign encounter" }, { status: 500 });
  }
}
