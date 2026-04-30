/**
 * Warehouse Network Optimization API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { aiOptimizationService } from "@/lib/services/warehouse-network/aiOptimizationService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...params } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Optimization type is required" },
        { status: 400 },
      );
    }

    let result;
    if (type === "ROUTE") {
      result = await aiOptimizationService.optimizeRoute(params);
    } else if (type === "INVENTORY") {
      result = await aiOptimizationService.optimizeInventoryAllocation(params);
    } else if (type === "NETWORK") {
      result = await aiOptimizationService.optimizeNetwork(params);
    } else {
      return NextResponse.json(
        { error: "Invalid optimization type" },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Optimization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform optimization" },
      { status: 500 },
    );
  }
}
