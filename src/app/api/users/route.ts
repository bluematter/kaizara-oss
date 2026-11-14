import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

// GET /api/users - List team members for clinic
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role as UserRole, "users:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { clinicId: session.user.clinicId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Users list error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}

// POST /api/users - Add a team member to clinic
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

    if (!hasPermission(session.user.role as UserRole, "users:write")) {
      return NextResponse.json({ error: "Forbidden - only admins can add team members" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Validate role
    const validRoles: UserRole[] = ["ADMIN", "PROVIDER", "STAFF"];
    const userRole = (role || "PROVIDER") as UserRole;
    if (!validRoles.includes(userRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // Generate a temporary password (user should reset on first login)
    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: userRole,
        password: hashedPassword,
        clinicId: session.user.clinicId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await logAudit({
      action: "CREATE",
      resource: "User",
      resourceId: user.id,
      description: `Added team member: ${user.name} (${user.email}) as ${user.role}`,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }
}
