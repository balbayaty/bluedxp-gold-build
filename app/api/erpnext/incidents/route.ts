/**
 * ERPNext Incidents API Route
 * Returns list of incidents from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // Try to fetch from ERPNext (using Issue doctype for incidents)
    const result = await erpNextAPI.getNCRs(); // Reuse NCR endpoint as incidents are similar

    if (result.success && result.data) {
      let incidents = result.data.filter(
        (item: any) =>
          item.issue_type === "Incident" ||
          item.type === "Incident" ||
          item.subject?.toLowerCase().includes("incident"),
      );

      // Filter by status if provided
      if (status) {
        incidents = incidents.filter((inc: any) => inc.status === status);
      }

      // Filter by type if provided
      if (type) {
        incidents = incidents.filter((inc: any) => inc.type === type);
      }

      return NextResponse.json({
        success: true,
        incidents: incidents,
        data: incidents,
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      incidents: [
        {
          name: "INC-2025-001",
          subject: "Chemical Spill in Warehouse A",
          status: "Under Investigation",
          priority: "High",
          type: "Environmental",
          creation: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          location: "Warehouse A - Zone 3",
        },
        {
          name: "INC-2025-002",
          subject: "Equipment Malfunction",
          status: "Resolved",
          priority: "Medium",
          type: "Safety",
          creation: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          location: "Production Line 2",
        },
      ],
      data: [],
    });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch incidents" },
      { status: 500 },
    );
  }
}
