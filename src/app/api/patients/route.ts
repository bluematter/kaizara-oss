import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@prisma/client";

// GET /api/patients - List patients for clinic
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          portalSlug: true,
          portalEnabled: true,
          createdAt: true,
          memberships: {
            where: { status: "ACTIVE" },
            select: {
              status: true,
              membership: { select: { name: true } },
            },
            take: 1,
          },
          consultations: {
            where: { scheduledAt: { gte: new Date() } },
            select: { id: true, scheduledAt: true, status: true },
            orderBy: { scheduledAt: "asc" },
            take: 1,
          },
        },
        orderBy: { lastName: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.patient.count({ where }),
    ]);

    await logAudit({
      action: "LIST",
      resource: "Patient",
      description: `Listed patients (search: "${search}")`,
    });

    return NextResponse.json({ patients, total });
  } catch (error) {
    console.error("Patients list error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to list patients" }, { status: 500 });
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { firstName, lastName, email, phone, dateOfBirth } = body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        clinicId: session.user.clinicId,
      },
    });

    await logAudit({
      action: "CREATE",
      resource: "Patient",
      resourceId: patient.id,
      patientId: patient.id,
      description: `Created patient: ${patient.firstName} ${patient.lastName}`,
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Create patient error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}
