import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole, EncounterType, ChartType } from "@prisma/client";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// GET /api/templates/[id]
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

    if (!hasPermission(session.user.role as UserRole, "templates:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const template = await prisma.encounterTemplate.findFirst({
      where: {
        id,
        OR: [
          { isDefault: true },
          { clinicId: session.user.clinicId || undefined },
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Get template error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to get template" }, { status: 500 });
  }
}

// PATCH /api/templates/[id]
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

    if (!hasPermission(session.user.role as UserRole, "templates:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    // Only allow editing clinic-owned templates (not system defaults)
    const existing = await prisma.encounterTemplate.findFirst({
      where: { id, clinicId: session.user.clinicId, isDefault: false },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template not found or cannot be edited" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, encounterType, chartType, subjective, objective, assessment, plan, macros, isActive } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name.trim().slice(0, 100);
    if (description !== undefined) updateData.description = description?.slice(0, 1000) || null;
    if (encounterType !== undefined) {
      updateData.encounterType = encounterType && Object.values(EncounterType).includes(encounterType) ? encounterType : null;
    }
    if (chartType !== undefined) {
      updateData.chartType = Object.values(ChartType).includes(chartType) ? chartType : "BRIEF";
    }
    if (subjective !== undefined) updateData.subjective = subjective;
    if (objective !== undefined) updateData.objective = objective;
    if (assessment !== undefined) updateData.assessment = assessment;
    if (plan !== undefined) updateData.plan = plan;
    if (macros !== undefined) updateData.macros = macros;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const template = await prisma.encounterTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Update template error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

// DELETE /api/templates/[id]
export async function DELETE(
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

    if (!hasPermission(session.user.role as UserRole, "templates:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    // Only allow deleting clinic-owned templates (not system defaults)
    const existing = await prisma.encounterTemplate.findFirst({
      where: { id, clinicId: session.user.clinicId, isDefault: false },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template not found or cannot be deleted" }, { status: 404 });
    }

    // Soft delete - set inactive
    await prisma.encounterTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
