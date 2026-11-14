import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@prisma/client";

// PATCH /api/inventory/[id] - Update inventory item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify item belongs to clinic
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, clinicId: session.user.clinicId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = [
      "name", "quantity", "minStock", "costPrice", "unitPrice",
      "supplier", "category", "storageTemp", "notes",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        if (field === "quantity" || field === "minStock") {
          data[field] = parseInt(body[field]);
        } else if (field === "costPrice" || field === "unitPrice") {
          data[field] = body[field] != null ? parseFloat(body[field]) : null;
        } else {
          data[field] = body[field];
        }
      }
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    await logAudit({
      action: "UPDATE",
      resource: "InventoryItem",
      resourceId: item.id,
      description: `Updated inventory item: ${item.name}`,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update inventory error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 });
  }
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify item belongs to clinic
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, clinicId: session.user.clinicId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.inventoryItem.delete({ where: { id } });

    await logAudit({
      action: "DELETE",
      resource: "InventoryItem",
      resourceId: id,
      description: `Deleted inventory item: ${existing.name}`,
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete inventory error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 });
  }
}
