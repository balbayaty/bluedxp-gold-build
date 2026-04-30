/**
 * Marketplace Statistics API
 * GET - Get marketplace statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/lib/services/marketplace";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const stats = await marketplaceService.getMarketplaceStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Failed to get marketplace stats:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get stats" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.stats",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
