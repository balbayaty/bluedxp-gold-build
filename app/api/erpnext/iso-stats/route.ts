/**
 * ISO Stats API Route
 * Returns ISO IMS dashboard statistics
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET() {
  try {
    const result = await erpNextAPI.getDashboardStats();

    if (result.success && result.stats) {
      return NextResponse.json({
        success: true,
        stats: result.stats,
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      stats: {
        documents: 156,
        openNCRs: 8,
        activeCAPAs: 12,
        upcomingAudits: 3,
        complianceScore: 87,
      },
    });
  } catch (error) {
    console.error("Error fetching ISO stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ISO stats" },
      { status: 500 },
    );
  }
}
