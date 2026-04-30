import { NextRequest, NextResponse } from "next/server";
import { InventoryItem } from "@/types/warehouse-management";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string; itemId: string } },
) {
  try {
    const warehouseId = params.id;
    const itemId = params.itemId;

    // In a real implementation, fetch from database
    const item: InventoryItem = {
      id: itemId,
      sku: "SKU-001",
      name: "Product A",
      category: "Electronics",
      quantity: 150,
      unit: "units",
      location: "A-01-02-03",
      value: 15000,
      supplier: "Supplier A",
      lastMoved: new Date("2024-01-20"),
      hazardClass: "Class 3",
      temperature: 23.5,
      expiryDate: new Date("2025-12-31"),
    };

    // Mock movement history
    const movementHistory = [
      {
        id: "mov-001",
        date: new Date("2024-01-20"),
        type: "IN",
        quantity: 50,
        fromLocation: "Receiving Dock",
        toLocation: "A-01-02-03",
        reason: "Goods receipt",
        performedBy: "User A",
      },
      {
        id: "mov-002",
        date: new Date("2024-01-15"),
        type: "OUT",
        quantity: 25,
        fromLocation: "A-01-02-03",
        toLocation: "Shipping Dock",
        reason: "Order fulfillment",
        performedBy: "User B",
      },
      {
        id: "mov-003",
        date: new Date("2024-01-10"),
        type: "IN",
        quantity: 100,
        fromLocation: "Receiving Dock",
        toLocation: "A-01-02-03",
        reason: "Goods receipt",
        performedBy: "User A",
      },
    ];

    return NextResponse.json({
      success: true,
      item,
      movementHistory,
    });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory item" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.inventory",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
