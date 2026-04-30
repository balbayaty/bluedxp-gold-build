/**
 * Warehouse Network Analytics API
 * GET - Get network analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const networkId = searchParams.get("networkId") || "network-1";

    const analytics =
      await warehouseNetworkService.getNetworkAnalytics(networkId);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error("Failed to get analytics:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get analytics" },
      { status: 500 },
    );
  }
}
