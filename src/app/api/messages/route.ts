import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole } from "@prisma/client";
import { getPortalSession } from "@/lib/patient-auth-server";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

function sanitizeString(str: string, maxLength: number): string {
  if (typeof str !== "string") return "";
  return str.slice(0, maxLength).trim();
}

// Look up the conversation, then authorize the caller against that
// conversation's patient. Accepts either staff (must be same clinic) or portal
// (must be the conversation's own patient).
async function authorizeForConversation(
  conversationId: string,
  requireWrite: boolean,
): Promise<
  | { ok: true; rateKey: string; patientId: string }
  | { ok: false; response: NextResponse }
> {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { patientId: true, patient: { select: { clinicId: true } } },
  });
  if (!conv) {
    return { ok: false, response: NextResponse.json({ error: "Conversation not found" }, { status: 404 }) };
  }

  const staff = await auth();
  if (staff?.user?.clinicId) {
    const perm = requireWrite ? "patients:write" : "patients:read";
    if (!hasPermission(staff.user.role as UserRole, perm)) {
      return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    if (conv.patient.clinicId !== staff.user.clinicId) {
      return { ok: false, response: NextResponse.json({ error: "Conversation not found" }, { status: 404 }) };
    }
    return { ok: true, rateKey: `api:${staff.user.id}`, patientId: conv.patientId };
  }

  const portal = await getPortalSession();
  if (portal?.patientId === conv.patientId) {
    return { ok: true, rateKey: `portal:${portal.patientId}`, patientId: conv.patientId };
  }

  return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, content, role, model, metadata } = body;

    if (!conversationId || !content || !role) {
      return NextResponse.json(
        { error: "conversationId, content, and role are required" },
        { status: 400 },
      );
    }
    if (!isValidId(conversationId)) {
      return NextResponse.json({ error: "Invalid conversationId format" }, { status: 400 });
    }
    const validRoles = ["USER", "ASSISTANT", "PROVIDER", "SYSTEM"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be USER, ASSISTANT, PROVIDER, or SYSTEM" },
        { status: 400 },
      );
    }

    const authz = await authorizeForConversation(conversationId, true);
    if (!authz.ok) return authz.response;

    const rate = checkRateLimit(authz.rateKey, RATE_LIMITS.api);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const sanitizedContent = sanitizeString(content, 50000);

    await logAudit({
      action: role === "ASSISTANT" ? "AI_RESPONSE" : "CREATE",
      resource: "Message",
      resourceId: conversationId,
      patientId: authz.patientId,
      description: role === "ASSISTANT" ? "AI response saved" : "Message saved",
    });

    const message = await prisma.message.create({
      data: {
        conversationId,
        content: sanitizedContent,
        role,
        model: model ? sanitizeString(model, 100) : null,
        metadata: metadata || null,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Save message error:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}

// GET /api/messages?conversationId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId || !isValidId(conversationId)) {
      return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });
    }

    const authz = await authorizeForConversation(conversationId, false);
    if (!authz.ok) return authz.response;

    const rate = checkRateLimit(authz.rateKey, RATE_LIMITS.api);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Get messages error:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 });
  }
}
