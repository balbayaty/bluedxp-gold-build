/**
 * Vendors API
 * GET /api/procurement/vendors - List vendors
 * POST /api/procurement/vendors - Create vendor
 */

import { NextRequest, NextResponse } from "next/server";
import { vendorService } from "@/lib/services/procurement/vendorService";
import type { VendorCreateInput } from "@/types/vendor";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const status = searchParams.get("status")?.split(",") as any;
    const classification = searchParams
      .get("classification")
      ?.split(",") as any;
    const category = searchParams.get("category")?.split(",");
    const search = searchParams.get("search") || undefined;

    const vendors = await vendorService.listVendors({
      tenantId,
      status,
      classification,
      category,
      search,
    });

    return NextResponse.json({
      success: true,
      data: vendors,
      count: vendors.length,
    });
  } catch (error: any) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch vendors",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, userId, ...input } = body;

    const vendor = await vendorService.createVendor(
      input as VendorCreateInput,
      userId || "system",
    );

    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error: any) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create vendor",
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

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.vendors",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
