/**
 * ERPNext Risks API Route
 * Returns list of risk assessments from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    // Risk assessments might be in a custom doctype or as Issues
    // For now, return mock data that can be integrated with ERPNext later

    let risks = [
      {
        name: "RISK-2025-001",
        title: "Chemical Storage Risk",
        category: "Safety",
        likelihood: 3,
        severity: 4,
        risk_score: 12,
        risk_level: "High",
        mitigation: "Implement proper storage procedures and training",
        status: "Open",
        owner: "b.albayaty@scsflex.com",
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
      {
        name: "RISK-2025-002",
        title: "Quality Control Risk",
        category: "Quality",
        likelihood: 2,
        severity: 3,
        risk_score: 6,
        risk_level: "Medium",
        mitigation: "Enhance quality checkpoints",
        status: "Mitigated",
        owner: "b.albayaty@scsflex.com",
        due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
    ];

    // Filter by status if provided
    if (status) {
      risks = risks.filter((r) => r.status === status);
    }

    // Filter by category if provided
    if (category) {
      risks = risks.filter((r) => r.category === category);
    }

    return NextResponse.json({
      success: true,
      risks: risks,
      data: risks,
    });
  } catch (error) {
    console.error("Error fetching risks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch risks" },
      { status: 500 },
    );
  }
}
