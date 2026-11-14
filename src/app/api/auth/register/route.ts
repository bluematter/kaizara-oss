import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const rateLimitResult = checkRateLimit(`register:${ip}`, RATE_LIMITS.auth);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { email, password, name, clinicName } = body;

    // Validate required fields
    if (!email || !password || !name || !clinicName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate name and clinic name are non-empty strings
    if (name.trim().length === 0 || clinicName.trim().length === 0) {
      return NextResponse.json(
        { error: "Name and clinic name cannot be empty" },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate unique clinic slug
    let slug = slugify(clinicName);
    let slugSuffix = 0;
    while (await prisma.clinic.findUnique({ where: { slug } })) {
      slugSuffix++;
      slug = `${slugify(clinicName)}-${slugSuffix}`;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 14-day free trial starts at signup
    const TRIAL_DAYS = 14;
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    // Create clinic and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName.trim(),
          slug,
          plan: "FREE_TRIAL",
          trialEndsAt,
        },
      });

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name.trim(),
          role: "ADMIN",
          clinicId: clinic.id,
        },
      });

      return { clinic, user };
    });

    // Audit log the registration
    try {
      await prisma.auditLog.create({
        data: {
          action: "CREATE",
          resource: "Registration",
          userId: result.user.id,
          userEmail: result.user.email,
          userName: result.user.name,
          description: `New clinic registered: ${result.clinic.name}`,
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      });
    } catch {
      // Don't fail registration if audit logging fails
    }

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Registration error:",
      error instanceof Error ? error.message : "Unknown"
    );
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
