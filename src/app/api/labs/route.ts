import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!hasPermission(session.user.role as UserRole, "labs:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    if (!patientId) {
      return NextResponse.json(
        { error: "patientId query param is required" },
        { status: 400 },
      );
    }

    // Verify patient belongs to caller's clinic before returning PHI
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const panels = await prisma.labPanel.findMany({
      where: { patientId },
      include: {
        markers: { orderBy: { name: "asc" } },
      },
      orderBy: { collectedAt: "desc" },
    });

    await logAudit({
      action: "VIEW",
      resource: "LabPanel",
      patientId,
      description: `Viewed ${panels.length} lab panel(s)`,
    });

    return NextResponse.json({ panels });
  } catch (error) {
    console.error("Lab fetch error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Failed to fetch lab results" }, { status: 500 });
  }
}
