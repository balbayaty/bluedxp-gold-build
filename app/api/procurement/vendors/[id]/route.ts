/**
 * Vendor Detail API
 * GET /api/procurement/vendors/[id] - Get vendor
 */

import { NextRequest, NextResponse } from "next/server";
import { vendorService } from "@/lib/services/procurement/vendorService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    const vendor = await vendorService.getVendor(params.id, tenantId);

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error: any) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch vendor",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.vendors",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
