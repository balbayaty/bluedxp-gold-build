/**
 * ERPNext Inspections API Route
 * Returns list of inspections from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // Try to fetch from ERPNext (using Event doctype for inspections)
    const result = await erpNextAPI.getAudits(); // Reuse audits endpoint as inspections are similar

    if (result.success && result.data) {
      let inspections = result.data.filter(
        (item: any) =>
          item.event_type === "Inspection" ||
          item.type === "Inspection" ||
          item.subject?.toLowerCase().includes("inspection"),
      );

      // Filter by status if provided
      if (status) {
        inspections = inspections.filter((insp: any) => insp.status === status);
      }

      // Filter by type if provided
      if (type) {
        inspections = inspections.filter((insp: any) => insp.type === type);
      }

      return NextResponse.json({
        success: true,
        inspections: inspections,
        data: inspections,
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      inspections: [
        {
          name: "INS-2025-001",
          subject: "Monthly Safety Inspection - Warehouse A",
          status: "In Progress",
          type: "Safety Inspection",
          starts_on: new Date().toISOString().split("T")[0],
          ends_on: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          inspector: "b.albayaty@scsflex.com",
          location: "Warehouse A",
        },
        {
          name: "INS-2025-002",
          subject: "Quarterly Quality Audit",
          status: "Completed",
          type: "Internal Audit",
          starts_on: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          ends_on: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          inspector: "quality.manager@scsflex.com",
          location: "All Facilities",
        },
      ],
      data: [],
    });
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inspections" },
      { status: 500 },
    );
  }
}
