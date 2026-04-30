/**
 * Obligations Dashboard API
 * GET /api/obligations/dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { obligationMappingEngine } from "@/lib/services/obligations/obligationMappingEngine";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    const dashboard = await obligationMappingEngine.getDashboard(tenantId);

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
