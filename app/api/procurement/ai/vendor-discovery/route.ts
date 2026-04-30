/**
 * AI Vendor Discovery API
 * POST /api/procurement/ai/vendor-discovery
 */

import { NextRequest, NextResponse } from "next/server";
import { aiSourcingService } from "@/lib/services/procurement/aiSourcingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { requirements } = body;
    const tenantId = context.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    const recommendations = await aiSourcingService.discoverVendors(
      tenantId,
      requirements,
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error("Error discovering vendors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to discover vendors",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.ai.vendor-discovery",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
