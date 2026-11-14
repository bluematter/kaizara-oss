import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@prisma/client";

// GET /api/memberships - List all active membership tiers
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

    if (!hasPermission(session.user.role as UserRole, "inventory:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: Record<string, unknown> = {};
    if (!includeInactive) {
      where.active = true;
    }

    const memberships = await prisma.membership.findMany({
      where,
      include: {
        services: true,
      },
      orderBy: { price: "asc" },
    });

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error("Membership list error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to list memberships" }, { status: 500 });
  }
}

// POST /api/memberships - Create a new membership tier
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

    if (!hasPermission(session.user.role as UserRole, "inventory:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Membership name is required" },
        { status: 400 }
      );
    }

    const membership = await prisma.membership.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: price != null ? parseFloat(price) : null,
        active: true,
      },
    });

    await logAudit({
      action: "CREATE",
      resource: "Membership",
      resourceId: membership.id,
      description: `Created membership tier: ${membership.name}`,
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("Create membership error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to create membership" }, { status: 500 });
  }
}
