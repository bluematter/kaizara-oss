import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole, ShipmentStatus } from "@prisma/client";

function isValidId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// GET /api/shipments
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
    const status = searchParams.get("status") as ShipmentStatus | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
    };
    if (status && Object.values(ShipmentStatus).includes(status)) {
      where.status = status;
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: {
            include: {
              inventoryItem: { select: { id: true, name: true, lotNumber: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.shipment.count({ where }),
    ]);

    return NextResponse.json({ shipments, total });
  } catch (error) {
    console.error("Shipments list error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to list shipments" }, { status: 500 });
  }
}

// POST /api/shipments
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role as UserRole, "inventory:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { patientId, addressLine1, addressLine2, city, state, zip, carrier, items } = body;

    if (!patientId || !isValidId(patientId)) {
      return NextResponse.json({ error: "Valid patientId required" }, { status: 400 });
    }
    if (!addressLine1 || !city || !state || !zip) {
      return NextResponse.json({ error: "Address fields required" }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item required" }, { status: 400 });
    }

    // Verify patient belongs to clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const shipment = await prisma.shipment.create({
      data: {
        patientId,
        clinicId: session.user.clinicId,
        addressLine1: addressLine1.slice(0, 200),
        addressLine2: addressLine2?.slice(0, 200) || null,
        city: city.slice(0, 100),
        state: state.slice(0, 2),
        zip: zip.slice(0, 10),
        carrier: carrier || "USPS",
        items: {
          create: items.map((item: { inventoryItemId: string; quantity: number }) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            inventoryItem: { select: { id: true, name: true, lotNumber: true } },
          },
        },
      },
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error("Create shipment error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to create shipment" }, { status: 500 });
  }
}
