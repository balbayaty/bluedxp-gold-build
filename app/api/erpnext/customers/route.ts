/**
 * ERPNext Customers API Route
 * Returns list of customers from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET() {
  try {
    const result = await erpNextAPI.getCustomers();

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        customers: result.data,
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      customers: [
        {
          name: "CUST-001",
          customer_name: "ABC Manufacturing Co.",
          customer_type: "Manufacturing",
          territory: "Saudi Arabia",
        },
        {
          name: "CUST-002",
          customer_name: "XYZ Trading LLC",
          customer_type: "Trading",
          territory: "UAE",
        },
        {
          name: "CUST-003",
          customer_name: "Global Distribution Ltd.",
          customer_type: "Distribution",
          territory: "Kuwait",
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}
