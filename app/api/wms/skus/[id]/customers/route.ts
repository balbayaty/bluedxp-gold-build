/**
 * SKU Customer Relationships API Endpoints
 * Manage customer-SKU linking
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { CustomerSKURelationship } from "@/types/sku";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET /api/wms/skus/[id]/customers - Get customer relationships for SKU
// ============================================================================

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const relationships = await skuService.getCustomerSKURelationships(id);

    return NextResponse.json(relationships, { status: 200 });
  } catch (error) {
    console.error("Error getting customer relationships:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get customer relationships",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/wms/skus/[id]/customers - Link customer to SKU
// ============================================================================

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!body.customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 },
      );
    }

    const relationship = await skuService.linkCustomerSKU(
      id,
      body.customerId,
      body,
    );

    return NextResponse.json(relationship, { status: 201 });
  } catch (error) {
    console.error("Error linking customer to SKU:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to link customer to SKU",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.skus.customers",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.skus.customers",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
