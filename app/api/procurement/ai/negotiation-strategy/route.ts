/**
 * AI Negotiation Strategy API
 * POST /api/procurement/ai/negotiation-strategy
 */

import { NextRequest, NextResponse } from "next/server";
import { aiSourcingService } from "@/lib/services/procurement/aiSourcingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { vendorId, currentQuote, marketData } = body;
    const tenantId = context.tenantId;

    if (!vendorId || !currentQuote) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor ID and current quote are required",
        },
        { status: 400 },
      );
    }
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    const strategy = await aiSourcingService.generateNegotiationStrategy(
      vendorId,
      tenantId,
      currentQuote,
      marketData,
    );

    return NextResponse.json({
      success: true,
      data: strategy,
    });
  } catch (error: any) {
    console.error("Error generating negotiation strategy:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate negotiation strategy",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.ai.negotiation-strategy",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
