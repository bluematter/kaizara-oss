import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logPatientAccess } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole } from "@prisma/client";
import { getPortalSession } from "@/lib/patient-auth-server";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// Resolve who is asking and confirm they can touch this patient.
// Accepts either a staff session (scoped to clinic) or a portal session
// (scoped to self). Returns the rate-limit key to bucket by, or a Response
// to short-circuit with.
async function authorizeForPatient(
  patientId: string,
  requireWrite: boolean,
): Promise<{ ok: true; rateKey: string } | { ok: false; response: NextResponse }> {
  const staff = await auth();
  if (staff?.user?.clinicId) {
    const perm = requireWrite ? "patients:write" : "patients:read";
    if (!hasPermission(staff.user.role as UserRole, perm)) {
      return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: staff.user.clinicId },
      select: { id: true },
    });
    if (!patient) {
      return { ok: false, response: NextResponse.json({ error: "Patient not found" }, { status: 404 }) };
    }
    return { ok: true, rateKey: `api:${staff.user.id}` };
  }

  const portal = await getPortalSession();
  if (portal?.patientId === patientId) {
    return { ok: true, rateKey: `portal:${portal.patientId}` };
  }

  return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}

// GET /api/conversations?patientId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    if (!patientId || !isValidId(patientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }

    const authz = await authorizeForPatient(patientId, false);
    if (!authz.ok) return authz.response;

    const rate = checkRateLimit(authz.rateKey, RATE_LIMITS.api);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    await logPatientAccess(patientId, "VIEW", "Conversation");

    let conversation = await prisma.conversation.findFirst({
      where: { patientId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { patientId, title: "Health Assistant Chat" },
        include: { messages: true },
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Conversations API error:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Failed to get conversation" }, { status: 500 });
  }
}

// POST /api/conversations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, title } = body;
    if (!patientId || !isValidId(patientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }

    const authz = await authorizeForPatient(patientId, true);
    if (!authz.ok) return authz.response;

    const rate = checkRateLimit(authz.rateKey, RATE_LIMITS.api);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const sanitizedTitle = typeof title === "string" ? title.slice(0, 200).trim() : "Health Assistant Chat";
    await logPatientAccess(patientId, "CREATE", "Conversation");

    const conversation = await prisma.conversation.create({
      data: { patientId, title: sanitizedTitle },
      include: { messages: true },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
