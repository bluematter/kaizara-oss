import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@prisma/client";

interface SaveRequest {
  patientId: string;
  panel: {
    collectedAt: string;
    reportedAt?: string;
    specimenId?: string;
    labProvider?: string;
    fasting?: boolean;
  };
  markers: {
    name: string;
    value: number;
    unit: string;
    referenceMin: number | null;
    referenceMax: number | null;
    category: string;
    status: "normal" | "low" | "high" | "critical";
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!hasPermission(session.user.role as UserRole, "labs:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: SaveRequest = await request.json();
    const { patientId, panel, markers } = body;
    if (!patientId || !panel || !markers || markers.length === 0) {
      return NextResponse.json(
        { error: "patientId, panel, and markers are required" },
        { status: 400 },
      );
    }

    // Verify patient belongs to caller's clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const labPanel = await prisma.$transaction(async (tx) => {
      return tx.labPanel.create({
        data: {
          patientId,
          collectedAt: new Date(panel.collectedAt),
          reportedAt: panel.reportedAt ? new Date(panel.reportedAt) : null,
          specimenId: panel.specimenId || null,
          labProvider: panel.labProvider || "Quest Diagnostics",
          fasting: panel.fasting ?? false,
          status: "COMPLETED",
          markers: {
            create: markers.map((m) => ({
              name: m.name,
              value: m.value,
              unit: m.unit,
              referenceMin: m.referenceMin,
              referenceMax: m.referenceMax,
              category: m.category,
              status: m.status.toUpperCase() as "NORMAL" | "LOW" | "HIGH" | "CRITICAL",
            })),
          },
        },
        include: { markers: true },
      });
    });

    await logAudit({
      action: "CREATE",
      resource: "LabPanel",
      resourceId: labPanel.id,
      patientId,
      description: `Saved lab panel with ${labPanel.markers.length} markers`,
    });

    return NextResponse.json({ panelId: labPanel.id, markerCount: labPanel.markers.length });
  } catch (error) {
    console.error("Lab save error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Failed to save lab results" }, { status: 500 });
  }
}
