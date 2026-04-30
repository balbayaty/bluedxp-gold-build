/**
 * Get MSDS Data for Cross-Module Access
 * Used by Warehouse, Transportation, Compliance modules
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsDomainService } from "@/lib/services/chemical/msdsDomainService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("module"); // 'warehouse', 'transportation', 'compliance'
    const casNumber = searchParams.get("casNumber");
    const chemicalName = searchParams.get("chemicalName");
    const transportMode = searchParams.get("transportMode") as
      | "sea"
      | "rail"
      | "road"
      | "air"
      | null;
    const complianceType = searchParams.get("complianceType") as
      | "civil-defense"
      | "ministry-interior"
      | "import"
      | "export"
      | null;
    const tenantId = context.tenantId;

    if (!moduleId) {
      return NextResponse.json(
        { success: false, error: "Module parameter is required" },
        { status: 400 },
      );
    }

    if (
      moduleId !== "warehouse" &&
      moduleId !== "transportation" &&
      moduleId !== "compliance"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown module: ${moduleId}. Supported: warehouse, transportation, compliance`,
        },
        { status: 400 },
      );
    }

    const result = await msdsDomainService.getForModule({
      tenantId,
      moduleId,
      casNumber,
      chemicalName,
      transportMode,
      complianceType,
    });

    if (Array.isArray(result)) {
      return NextResponse.json({
        success: true,
        data: result,
        count: result.length,
      });
    }

    if (!result)
      return NextResponse.json(
        { success: false, error: "MSDS not found" },
        { status: 404 },
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[get-msds-for-module] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get MSDS data",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.get-for-module",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
