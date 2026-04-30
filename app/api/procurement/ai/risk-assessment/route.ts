/**
 * AI Risk Assessment API
 * POST /api/procurement/ai/risk-assessment
 */

import { NextRequest, NextResponse } from "next/server";
import { aiSourcingService } from "@/lib/services/procurement/aiSourcingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { vendorId } = body;
    const tenantId = context.tenantId;

    if (!vendorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor ID is required",
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

    const riskAssessment = await aiSourcingService.assessVendorRisk(
      vendorId,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      data: riskAssessment,
    });
  } catch (error: any) {
    console.error("Error assessing vendor risk:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to assess vendor risk",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.ai.risk-assessment",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
