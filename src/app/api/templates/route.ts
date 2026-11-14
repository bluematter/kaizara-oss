import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole, EncounterType, ChartType } from "@prisma/client";

// GET /api/templates - List encounter templates
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const encounterType = searchParams.get("encounterType") as EncounterType | null;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: Record<string, unknown> = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (encounterType && Object.values(EncounterType).includes(encounterType)) {
      where.OR = [
        { encounterType },
        { encounterType: null }, // Include generic templates
      ];
    }

    // Include system templates and user's clinic templates
    where.OR = [
      { isDefault: true },
      { clinicId: session.user.clinicId || undefined },
    ];

    const templates = await prisma.encounterTemplate.findMany({
      where,
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Templates list error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to list templates" }, { status: 500 });
  }
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      description,
      encounterType,
      chartType = "BRIEF",
      subjective,
      objective,
      assessment,
      plan,
      macros,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    const template = await prisma.encounterTemplate.create({
      data: {
        name: name.trim().slice(0, 100),
        description: description?.slice(0, 1000) || null,
        encounterType: encounterType && Object.values(EncounterType).includes(encounterType)
          ? encounterType
          : null,
        chartType: Object.values(ChartType).includes(chartType) ? chartType : "BRIEF",
        subjective: subjective || null,
        objective: objective || null,
        assessment: assessment || null,
        plan: plan || null,
        macros: macros || null,
        isDefault: false,
        isActive: true,
        clinicId: session.user.clinicId || null,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
