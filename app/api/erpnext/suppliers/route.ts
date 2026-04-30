/**
 * ERPNext Suppliers API Route
 * Returns list of suppliers from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET() {
  try {
    const result = await erpNextAPI.getSuppliers();

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        suppliers: result.data,
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      suppliers: [
        {
          name: "SUP-001",
          supplier_name: "ABC Chemical Suppliers",
          supplier_type: "Raw Material",
          territory: "Saudi Arabia",
        },
        {
          name: "SUP-002",
          supplier_name: "XYZ Logistics Partners",
          supplier_type: "Service Provider",
          territory: "UAE",
        },
        {
          name: "SUP-003",
          supplier_name: "Global Packaging Solutions",
          supplier_type: "Packaging",
          territory: "Kuwait",
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch suppliers" },
      { status: 500 },
    );
  }
}
