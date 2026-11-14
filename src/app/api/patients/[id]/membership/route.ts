import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@prisma/client";

// GET /api/patients/[id]/membership - Get patient's active membership
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

    // Verify patient belongs to clinic
    const patient = await prisma.patient.findFirst({
      where: { id, clinicId: session.user.clinicId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const patientMembership = await prisma.patientMembership.findFirst({
      where: {
        patientId: id,
        status: "ACTIVE",
      },
      include: {
        membership: {
          include: {
            services: true,
          },
        },
        serviceUsages: true,
      },
    });

    if (!patientMembership) {
      return NextResponse.json({ patientMembership: null });
    }

    return NextResponse.json({ patientMembership });
  } catch (error) {
    console.error("Get patient membership error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to get patient membership" }, { status: 500 });
  }
}

// POST /api/patients/[id]/membership - Assign a membership to a patient
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

    if (!hasPermission(session.user.role as UserRole, "patients:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify patient belongs to clinic
    const patient = await prisma.patient.findFirst({
      where: { id, clinicId: session.user.clinicId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await request.json();
    const { membershipId } = body;

    if (!membershipId) {
      return NextResponse.json(
        { error: "membershipId is required" },
        { status: 400 }
      );
    }

    // Verify the membership exists and is active
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, active: true },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found or inactive" },
        { status: 404 }
      );
    }

    // Check if patient already has an ACTIVE membership for this same membershipId
    const existingSame = await prisma.patientMembership.findFirst({
      where: {
        patientId: id,
        membershipId,
        status: "ACTIVE",
      },
    });
    if (existingSame) {
      return NextResponse.json(
        { error: "Patient already has this active membership" },
        { status: 409 }
      );
    }

    // Cancel any other active memberships the patient has
    await prisma.patientMembership.updateMany({
      where: {
        patientId: id,
        status: "ACTIVE",
      },
      data: {
        status: "CANCELLED",
        endDate: new Date(),
      },
    });

    // Create the new membership assignment
    const patientMembership = await prisma.patientMembership.create({
      data: {
        patientId: id,
        membershipId,
        status: "ACTIVE",
        startDate: new Date(),
      },
      include: {
        membership: true,
      },
    });

    await logAudit({
      action: "CREATE",
      resource: "PatientMembership",
      resourceId: patientMembership.id,
      patientId: id,
      description: `Assigned membership "${membership.name}" to patient: ${patient.firstName} ${patient.lastName}`,
    });

    return NextResponse.json(patientMembership, { status: 201 });
  } catch (error) {
    console.error("Assign membership error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to assign membership" }, { status: 500 });
  }
}

// DELETE /api/patients/[id]/membership - Cancel patient's active membership
export async function DELETE(
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
    const patient = await prisma.patient.findFirst({
      where: { id, clinicId: session.user.clinicId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Find the active membership
    const activeMembership = await prisma.patientMembership.findFirst({
      where: {
        patientId: id,
        status: "ACTIVE",
      },
      include: {
        membership: true,
      },
    });

    if (!activeMembership) {
      return NextResponse.json(
        { error: "No active membership found" },
        { status: 404 }
      );
    }

    // Cancel the membership
    const cancelled = await prisma.patientMembership.update({
      where: { id: activeMembership.id },
      data: {
        status: "CANCELLED",
        endDate: new Date(),
      },
      include: {
        membership: true,
      },
    });

    await logAudit({
      action: "UPDATE",
      resource: "PatientMembership",
      resourceId: cancelled.id,
      patientId: id,
      description: `Cancelled membership "${activeMembership.membership.name}" for patient: ${patient.firstName} ${patient.lastName}`,
    });

    return NextResponse.json(cancelled);
  } catch (error) {
    console.error("Cancel membership error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to cancel membership" }, { status: 500 });
  }
}
