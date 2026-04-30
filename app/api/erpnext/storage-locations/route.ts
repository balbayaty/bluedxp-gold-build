/**
 * ERPNext Storage Locations API Route
 * Returns list of storage locations from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get("warehouse");

    // Storage locations might be in a custom doctype or as part of warehouse
    // For now, return mock data that can be integrated with ERPNext later

    return NextResponse.json({
      success: true,
      storageLocations: [
        {
          name: "LOC-001",
          location_code: "WH-A-01-01-01",
          warehouse: warehouse || "WH-001",
          zone: "Zone A",
          aisle: "Aisle 01",
          rack: "Rack 01",
          level: "Level 01",
          location_type: "Storage",
          capacity: 1000,
          current_stock: 750,
          status: "OCCUPIED",
        },
        {
          name: "LOC-002",
          location_code: "WH-A-01-01-02",
          warehouse: warehouse || "WH-001",
          zone: "Zone A",
          aisle: "Aisle 01",
          rack: "Rack 01",
          level: "Level 02",
          location_type: "Storage",
          capacity: 1000,
          current_stock: 0,
          status: "AVAILABLE",
        },
      ],
      data: [],
    });
  } catch (error) {
    console.error("Error fetching storage locations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch storage locations" },
      { status: 500 },
    );
  }
}
