/**
 * Load Design Optimization API
 *
 * POST /api/load-design/optimize
 *
 * Optimize load design with advanced algorithms
 */

import { NextRequest, NextResponse } from "next/server";
import { advancedLoadDesignService } from "@/lib/services/load-design/advancedLoadDesignService";
import type { LoadOptimizationRequest } from "@/types/load-design";

export async function POST(request: NextRequest) {
  try {
    const body: LoadOptimizationRequest = await request.json();

    // Validate request
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 },
      );
    }

    // Optimize load
    const result = await advancedLoadDesignService.optimizeLoad(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Load optimization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to optimize load" },
      { status: 500 },
    );
  }
}
