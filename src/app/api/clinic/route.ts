import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole } from "@prisma/client";

// GET /api/clinic - Get current clinic details
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        createdAt: true,
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json(clinic);
  } catch (error) {
    console.error("Clinic fetch error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to fetch clinic" }, { status: 500 });
  }
}

// PATCH /api/clinic - Update clinic details
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!hasPermission(session.user.role as UserRole, "settings:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, phone, email } = body;

    const data: Record<string, string | null> = {};
    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Clinic name is required" }, { status: 400 });
      }
      data.name = name.trim().slice(0, 200);
    }
    if (address !== undefined) data.address = address?.slice(0, 500) || null;
    if (phone !== undefined) data.phone = phone?.slice(0, 20) || null;
    if (email !== undefined) data.email = email?.slice(0, 200) || null;

    const clinic = await prisma.clinic.update({
      where: { id: session.user.clinicId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
      },
    });

    return NextResponse.json(clinic);
  } catch (error) {
    console.error("Clinic update error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to update clinic" }, { status: 500 });
  }
}
