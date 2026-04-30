/**
 * ERPNext NCRs API Route
 * Returns list of NCRs (Non-Conformance Reports) from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get("assigned_to");
    const status = searchParams.get("status");

    const result = await erpNextAPI.getNCRs();

    if (result.success && result.data) {
      let ncrs = result.data;

      // Filter by assigned_to if provided
      if (assignedTo) {
        ncrs = ncrs.filter(
          (ncr: any) =>
            ncr.assigned_to === assignedTo ||
            ncr.owner === assignedTo ||
            ncr.email === assignedTo,
        );
      }

      // Filter by status if provided
      if (status) {
        ncrs = ncrs.filter((ncr: any) => ncr.status === status);
      }

      return NextResponse.json({
        success: true,
        ncrs: ncrs,
        data: ncrs, // Also include 'data' for backward compatibility
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      ncrs: [
        {
          name: "NCR-2025-001",
          subject: "Chemical Storage Non-Conformance",
          status: "Open",
          priority: "High",
          creation: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          assigned_to: assignedTo || "b.albayaty@scsflex.com",
        },
        {
          name: "NCR-2025-002",
          subject: "Documentation Issue",
          status: "In Progress",
          priority: "Medium",
          creation: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          assigned_to: assignedTo || "b.albayaty@scsflex.com",
        },
      ],
      data: [],
    });
  } catch (error) {
    console.error("Error fetching NCRs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch NCRs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await erpNextAPI.createNCR(body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        ncr: result.data,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error || "Failed to create NCR" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error creating NCR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create NCR" },
      { status: 500 },
    );
  }
}
