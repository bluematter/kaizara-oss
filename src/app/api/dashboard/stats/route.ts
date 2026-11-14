import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = checkRateLimit(`api:${session.user.id}`, RATE_LIMITS.api);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const clinicId = session.user.clinicId;

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get clinic user IDs for audit log filtering
    const clinicUserIds = await prisma.user
      .findMany({ where: { clinicId }, select: { id: true } })
      .then(users => users.map(u => u.id));

    const [
      patientCount,
      todayEncounters,
      inventoryItems,
      recentAuditLogs,
      recentPatients,
    ] = await Promise.all([
      prisma.patient.count({ where: { clinicId } }),
      prisma.consultation.findMany({
        where: {
          provider: { clinicId },
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          encounterType: true,
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.inventoryItem.findMany({
        where: { clinicId },
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          minStock: true,
          category: true,
        },
      }),
      prisma.auditLog.findMany({
        where: { userId: { in: clinicUserIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          resource: true,
          description: true,
          userName: true,
          createdAt: true,
        },
      }),
      prisma.patient.findMany({
        where: { clinicId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      }),
    ]);

    const encountersToday = todayEncounters.length;
    const encountersByStatus = {
      COMPLETED: todayEncounters.filter(e => e.status === "COMPLETED").length,
      IN_PROGRESS: todayEncounters.filter(e => e.status === "IN_PROGRESS").length,
      SCHEDULED: todayEncounters.filter(e => e.status === "SCHEDULED").length,
    };

    const lowStockItems = inventoryItems.filter(i => i.quantity <= i.minStock);

    return NextResponse.json({
      patientCount,
      encountersToday,
      encountersByStatus,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      totalInventoryItems: inventoryItems.length,
      totalInventoryUnits: inventoryItems.reduce((sum, i) => sum + i.quantity, 0),
      todayEncounters,
      recentActivity: recentAuditLogs,
      recentPatients,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to get dashboard stats" }, { status: 500 });
  }
}
