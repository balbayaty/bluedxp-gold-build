/**
 * Contractor Matching API
 * POST /api/procurement/hr/contractor-match
 */

import { NextRequest, NextResponse } from "next/server";
import { hrIntegrationService } from "@/lib/services/procurement/integration/hrIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, skillRequirements } = body;

    if (!tenantId || !skillRequirements) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and skill requirements are required",
        },
        { status: 400 },
      );
    }

    const matches = await hrIntegrationService.findMatchingContractors(
      tenantId,
      skillRequirements,
    );

    return NextResponse.json({
      success: true,
      data: matches,
    });
  } catch (error: any) {
    console.error("Error finding contractors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to find contractors",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.hr.contractor-match",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
