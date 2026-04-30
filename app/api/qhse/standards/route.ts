/**
 * Comprehensive QHSE Standards API Route
 * ISO, FDA, API, Food Safety, Business Continuity standards
 * Comprehensive validation and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { comprehensiveStandardsService } from "@/lib/services/qhse/standards/comprehensiveStandardsFramework";
import { QHSEErrorHandler } from "@/lib/services/qhse/utils/errorHandler";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const standardCode = searchParams.get("standardCode");
    const industry = searchParams.get("industry");
    const tenantId = searchParams.get("tenantId");

    if (action === "requirements") {
      if (!standardCode) {
        return NextResponse.json(
          { success: false, error: "standardCode required" },
          { status: 400 },
        );
      }
      const requirements =
        comprehensiveStandardsService.getStandardRequirements(standardCode);
      return NextResponse.json({ success: true, data: requirements });
    }

    if (action === "all-standards") {
      const standards = comprehensiveStandardsService.getAllStandards();
      return NextResponse.json({ success: true, data: standards });
    }

    if (action === "compliance-status") {
      if (!standardCode) {
        return NextResponse.json(
          { success: false, error: "standardCode required" },
          { status: 400 },
        );
      }
      const status = comprehensiveStandardsService.getComplianceStatus(
        standardCode,
        tenantId || undefined,
      );
      return NextResponse.json({ success: true, data: status });
    }

    if (action === "integrated-standards") {
      if (!industry) {
        return NextResponse.json(
          { success: false, error: "industry required" },
          { status: 400 },
        );
      }
      const integrated =
        comprehensiveStandardsService.getIntegratedStandards(industry);
      return NextResponse.json({ success: true, data: integrated });
    }

    if (action === "ir5-features") {
      const features = comprehensiveStandardsService.getIR5Features();
      return NextResponse.json({ success: true, data: features });
    }

    if (action === "ir6-features") {
      const features = comprehensiveStandardsService.getIR6Features();
      return NextResponse.json({ success: true, data: features });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    const qhseError = QHSEErrorHandler.handleError(error, "Standards API");
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.standards",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
