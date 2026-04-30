/**
 * Purchase Orders API
 * GET /api/procurement/purchase-orders - List purchase orders
 * POST /api/procurement/purchase-orders - Create purchase order
 */

import { NextRequest, NextResponse } from "next/server";
import { purchaseOrderService } from "@/lib/services/procurement/purchaseOrderService";
import type { PurchaseOrderCreateInput } from "@/types/purchaseOrder";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const status = searchParams.get("status")?.split(",") as any;
    const type = searchParams.get("type")?.split(",") as any;
    const vendorId = searchParams.get("vendorId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const search = searchParams.get("search") || undefined;

    const purchaseOrders = await purchaseOrderService.listPurchaseOrders({
      tenantId,
      status,
      type,
      vendorId,
      projectId,
      search,
    });

    return NextResponse.json({
      success: true,
      data: purchaseOrders,
      count: purchaseOrders.length,
    });
  } catch (error: unknown) {
    logger.error("Error fetching purchase orders", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "procurement-purchase-orders", action: "fetch", tenantId },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch purchase orders",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, userId, ...input } = body;

    const purchaseOrder = await purchaseOrderService.createPurchaseOrder(
      input as PurchaseOrderCreateInput,
      userId || "system",
    );

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error: unknown) {
    logger.error("Error creating purchase order", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "procurement-purchase-orders", action: "create", tenantId },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create purchase order",
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

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.purchase-orders",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
