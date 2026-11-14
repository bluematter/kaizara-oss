import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { TaskStatus, TaskPriority, UserRole } from "@prisma/client";

// Validate patientId and assignedToId (if provided) belong to the caller's clinic.
// Returns an error Response to short-circuit, or null if OK.
async function validateTaskRefs(
  patientId: string | null | undefined,
  assignedToId: string | null | undefined,
  clinicId: string,
): Promise<NextResponse | null> {
  if (patientId) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
  }
  if (assignedToId) {
    const user = await prisma.user.findFirst({
      where: { id: assignedToId, clinicId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Assigned user not found" }, { status: 404 });
    }
  }
  return null;
}

// GET /api/tasks
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TaskStatus | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);

    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
    };
    if (status && Object.values(TaskStatus).includes(status)) {
      where.status = status;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    // Fetch patient names for tasks that have patientId
    const patientIds = tasks.filter(t => t.patientId).map(t => t.patientId as string);
    const patients = patientIds.length > 0
      ? await prisma.patient.findMany({
          where: { id: { in: patientIds }, clinicId: session.user.clinicId },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const patientMap = Object.fromEntries(patients.map(p => [p.id, `${p.firstName} ${p.lastName}`]));

    const tasksWithPatientNames = tasks.map(t => ({
      ...t,
      patientName: t.patientId ? patientMap[t.patientId] || null : null,
    }));

    return NextResponse.json({ tasks: tasksWithPatientNames, total });
  } catch (error) {
    console.error("Tasks list error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to list tasks" }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!hasPermission(session.user.role as UserRole, "tasks:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, dueDate, priority, patientId, assignedToId } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (priority && !Object.values(TaskPriority).includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    const refError = await validateTaskRefs(patientId, assignedToId, session.user.clinicId);
    if (refError) return refError;

    const task = await prisma.task.create({
      data: {
        title: title.trim().slice(0, 200),
        description: description?.slice(0, 2000) || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        patientId: patientId || null,
        assignedToId: assignedToId || session.user.id,
        createdById: session.user.id,
        clinicId: session.user.clinicId,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// PATCH /api/tasks (bulk update - for status changes from drag & drop)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!hasPermission(session.user.role as UserRole, "tasks:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, description, dueDate, priority, status, patientId, assignedToId } = body;

    if (!id) {
      return NextResponse.json({ error: "Task id required" }, { status: 400 });
    }

    // Verify task belongs to clinic
    const existing = await prisma.task.findFirst({
      where: { id, clinicId: session.user.clinicId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (patientId !== undefined || assignedToId !== undefined) {
      const refError = await validateTaskRefs(patientId, assignedToId, session.user.clinicId);
      if (refError) return refError;
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim().slice(0, 200);
    if (description !== undefined) data.description = description?.slice(0, 2000) || null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority && Object.values(TaskPriority).includes(priority)) data.priority = priority;
    if (status && Object.values(TaskStatus).includes(status)) {
      data.status = status;
      if (status === "COMPLETED") data.completedAt = new Date();
      else data.completedAt = null;
    }
    if (patientId !== undefined) data.patientId = patientId || null;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Update task error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Task id required" }, { status: 400 });
    }

    const existing = await prisma.task.findFirst({
      where: { id, clinicId: session.user.clinicId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
