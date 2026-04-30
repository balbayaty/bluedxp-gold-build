/**
 * BI Dashboard API
 * GET /api/business-intelligence/dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedBIService } from "@/lib/services/business-intelligence/unifiedBIService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    const biData = await unifiedBIService.getUnifiedBIData(tenantId);

    return NextResponse.json({
      success: true,
      data: biData,
    });
  } catch (error: any) {
    console.error("Error fetching BI dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch BI dashboard",
      },
      { status: 500 },
    );
  }
}
