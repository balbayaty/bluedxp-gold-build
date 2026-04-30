/**
 * TMS Quotes API
 * POST /api/procurement/integration/tms/quotes
 */

import { NextRequest, NextResponse } from "next/server";
import { tmsIntegrationService } from "@/lib/services/procurement/integration/tmsIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, requirement } = body;

    if (!tenantId || !requirement) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and requirement are required",
        },
        { status: 400 },
      );
    }

    const quotes = await tmsIntegrationService.getTransportationQuotes(
      tenantId,
      requirement,
    );

    return NextResponse.json({
      success: true,
      data: quotes,
    });
  } catch (error: any) {
    console.error("Error getting transportation quotes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get transportation quotes",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.integration.tms.quotes",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
