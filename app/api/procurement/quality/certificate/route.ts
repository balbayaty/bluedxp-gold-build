/**
 * Quality Certificate API
 * POST /api/procurement/quality/certificate
 */

import { NextRequest, NextResponse } from "next/server";
import { qualityComplianceIntegrationService } from "@/lib/services/procurement/integration/qualityComplianceIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, certificate } = body;

    if (!tenantId || !certificate) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and certificate are required",
        },
        { status: 400 },
      );
    }

    const registered =
      await qualityComplianceIntegrationService.registerCertificate(
        tenantId,
        certificate,
      );

    return NextResponse.json({
      success: true,
      data: registered,
    });
  } catch (error: any) {
    console.error("Error registering certificate:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to register certificate",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.quality.certificate",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
