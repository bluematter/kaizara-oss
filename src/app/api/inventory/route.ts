import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@prisma/client";

// GET /api/inventory - List inventory items for clinic
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
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { lotNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return NextResponse.json({ items, total });
  } catch (error) {
    console.error("Inventory list error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to list inventory" }, { status: 500 });
  }
}

// POST /api/inventory - Create a new inventory item
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
    const {
      name,
      sku,
      lotNumber,
      expirationDate,
      quantity,
      minStock,
      costPrice,
      unitPrice,
      supplier,
      category,
      storageTemp,
      notes,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    if (!expirationDate) {
      return NextResponse.json(
        { error: "Expiration date is required" },
        { status: 400 }
      );
    }

    // Auto-generate SKU from name if not provided (e.g. "BPC-157 5mg" → "BPC157-5MG-X7K2")
    const autoSku = sku?.trim() || `${name.trim().replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase()}-${Math.random().toString(36).slice(-4).toUpperCase()}`;

    // Auto-generate lot number if not provided
    const autoLot = lotNumber?.trim() || `LOT-${new Date().getFullYear()}-${Math.random().toString(36).slice(-6).toUpperCase()}`;

    const item = await prisma.inventoryItem.create({
      data: {
        name: name.trim(),
        sku: autoSku,
        lotNumber: autoLot,
        expirationDate: new Date(expirationDate),
        quantity: parseInt(quantity) || 0,
        minStock: parseInt(minStock) || 5,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        supplier: supplier?.trim() || null,
        category: category?.trim() || "Peptide",
        storageTemp: storageTemp?.trim() || "Refrigerated",
        notes: notes?.trim() || null,
        clinicId: session.user.clinicId,
      },
    });

    await logAudit({
      action: "CREATE",
      resource: "InventoryItem",
      resourceId: item.id,
      description: `Added inventory item: ${item.name} (${item.sku})`,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Create inventory error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
  }
}
