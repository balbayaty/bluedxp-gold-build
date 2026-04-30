/**
 * Purchase Order Detail API
 * GET /api/procurement/purchase-orders/[id] - Get purchase order
 */

import { NextRequest, NextResponse } from "next/server";
import { purchaseOrderService } from "@/lib/services/procurement/purchaseOrderService";
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

    const purchaseOrder = await purchaseOrderService.getPurchaseOrder(
      params.id,
      tenantId,
    );

    if (!purchaseOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "Purchase order not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error: any) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch purchase order",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.purchase-orders",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
