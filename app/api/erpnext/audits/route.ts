/**
 * ERPNext Audits API Route
 * Returns list of audits from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const auditor = searchParams.get("auditor");

    const result = await erpNextAPI.getAudits();

    if (result.success && result.data) {
      let audits = result.data;

      // Filter by status if provided
      if (status) {
        audits = audits.filter((audit: any) => audit.status === status);
      }

      // Filter by auditor if provided
      if (auditor) {
        audits = audits.filter(
          (audit: any) =>
            audit.auditor === auditor ||
            audit.auditor_name === auditor ||
            audit.owner === auditor,
        );
      }

      return NextResponse.json({
        success: true,
        audits: audits,
        data: audits, // Also include 'data' for backward compatibility
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      audits: [
        {
          name: "AUD-2025-001",
          subject: "Monthly Safety Audit",
          status: "Scheduled",
          starts_on: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          ends_on: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          auditor: auditor || "b.albayaty@scsflex.com",
        },
        {
          name: "AUD-2025-002",
          subject: "Quarterly Quality Audit",
          status: "Completed",
          starts_on: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          ends_on: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          auditor: auditor || "b.albayaty@scsflex.com",
        },
      ],
      data: [],
    });
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audits" },
      { status: 500 },
    );
  }
}
