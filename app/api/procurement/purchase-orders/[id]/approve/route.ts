/**
 * Approve Purchase Order API
 * POST /api/procurement/purchase-orders/[id]/approve
 */

import { NextRequest, NextResponse } from "next/server";
import { purchaseOrderService } from "@/lib/services/procurement/purchaseOrderService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const body = await request.json();
    const { approverName, approverRole, comments } = body;
    const tenantId = context.tenantId;
    const approverId = context.userId;
    const id = nextContext?.params?.id;

    if (!tenantId)
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    if (!approverId)
      return NextResponse.json(
        { success: false, error: "User context required" },
        { status: 400 },
      );
    if (!id)
      return NextResponse.json(
        { success: false, error: "Missing purchase order id" },
        { status: 400 },
      );

    const purchaseOrder = await purchaseOrderService.approvePurchaseOrder(
      id,
      tenantId,
      approverId,
      approverName,
      approverRole,
      comments,
    );

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error: any) {
    console.error("Error approving purchase order:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to approve purchase order",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.purchase-orders.approve",
  action: "approve",
  requireAuth: true,
  rateLimit: true,
});
