/**
 * SKU Customer Relationship Detail API Endpoints
 * Update and unlink customer-SKU relationships
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// PUT /api/wms/skus/[id]/customers/[relationshipId] - Update relationship
// ============================================================================

async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string; relationshipId: string } },
) {
  try {
    const { relationshipId } = params;
    const body = await request.json();

    const relationship = await skuService.updateCustomerSKURelationship(
      relationshipId,
      body,
    );

    return NextResponse.json(relationship, { status: 200 });
  } catch (error) {
    console.error("Error updating customer relationship:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update customer relationship",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// DELETE /api/wms/skus/[id]/customers/[relationshipId] - Unlink customer
// ============================================================================

async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string; relationshipId: string } },
) {
  try {
    const { relationshipId } = params;

    await skuService.unlinkCustomerSKU(relationshipId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error unlinking customer:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to unlink customer",
      },
      { status: 500 },
    );
  }
}

export const PUT = withAPIGateway(putHandler, {
  moduleId: "wms",
  featureId: "wms.skus.customers",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "wms",
  featureId: "wms.skus.customers",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
