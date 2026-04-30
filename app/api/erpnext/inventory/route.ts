/**
 * ERPNext Inventory API Route
 *
 * API endpoint for inventory management
 */

import { NextRequest, NextResponse } from "next/server";
import { enhancedERPNextClient } from "@/lib/adapters/erpnext/enhancedClient";

export async function GET() {
  try {
    // Fetch from ERPNext
    const inventoryData = await enhancedERPNextClient.getInventory();

    // Transform ERPNext data to our format
    const inventory = (inventoryData?.data || []).map(
      (item: any, index: number) => ({
        id: `inv-${index}`,
        material: {
          materialName: item.item_code,
          unit: "units",
        },
        warehouse: item.warehouse,
        actualQty: item.actual_qty || 0,
      }),
    );

    return NextResponse.json({
      inventory,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}
