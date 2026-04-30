/**
 * ERPNext Warehouses API Route
 * Returns list of warehouses from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET() {
  try {
    const result = await erpNextAPI.getWarehouses();

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        warehouses: result.data,
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      warehouses: [
        {
          name: "WH-001",
          warehouse_name: "Main Warehouse",
          company: "SCS Flex",
          is_group: 0,
        },
        {
          name: "WH-002",
          warehouse_name: "Distribution Center",
          company: "SCS Flex",
          is_group: 0,
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch warehouses" },
      { status: 500 },
    );
  }
}
