import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@prisma/client";

// GET /api/patients/[id] - Get patient detail
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

    if (!hasPermission(session.user.role as UserRole, "patients:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    await logAudit({
      action: "VIEW",
      resource: "Patient",
      resourceId: patient.id,
      patientId: patient.id,
      description: `Viewed patient: ${patient.firstName} ${patient.lastName}`,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Get patient error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to get patient" }, { status: 500 });
  }
}

// PATCH /api/patients/[id] - Update patient
export async function PATCH(
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

    if (!hasPermission(session.user.role as UserRole, "patients:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify patient belongs to clinic
    const existing = await prisma.patient.findFirst({
      where: { id, clinicId: session.user.clinicId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = [
      "firstName", "lastName", "email", "phone",
      "dateOfBirth", "address", "city", "state", "zip",
      "portalEnabled",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        if (field === "dateOfBirth" && body[field]) {
          data[field] = new Date(body[field]);
        } else {
          data[field] = body[field];
        }
      }
    }

    const patient = await prisma.patient.update({
      where: { id },
      data,
    });

    await logAudit({
      action: "UPDATE",
      resource: "Patient",
      resourceId: patient.id,
      patientId: patient.id,
      description: `Updated patient: ${patient.firstName} ${patient.lastName}`,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Update patient error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}
