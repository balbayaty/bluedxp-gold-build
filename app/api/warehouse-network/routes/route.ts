/**
 * Warehouse Network Routes API
 * GET - Get all routes for a network
 * POST - Create a new route
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const networkId = searchParams.get("networkId") || "network-1";

    const routes = await warehouseNetworkService.getNetworkRoutes(networkId);

    return NextResponse.json({
      success: true,
      data: routes,
      count: routes.length,
    });
  } catch (error: any) {
    console.error("Failed to get routes:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get routes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const route = await warehouseNetworkService.createRoute(body);

    return NextResponse.json({
      success: true,
      data: route,
    });
  } catch (error: any) {
    console.error("Failed to create route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create route" },
      { status: 500 },
    );
  }
}
