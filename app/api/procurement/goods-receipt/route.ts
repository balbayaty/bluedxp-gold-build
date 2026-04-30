/**
 * Goods Receipt API
 * GET /api/procurement/goods-receipt - List goods receipts
 * POST /api/procurement/goods-receipt - Create goods receipt
 */

import { NextRequest, NextResponse } from "next/server";
import { goodsReceiptService } from "@/lib/services/procurement/goodsReceiptService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const purchaseOrderId = searchParams.get("purchaseOrderId") || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;
    const status = searchParams.get("status")?.split(",") as any;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    const goodsReceipts = await goodsReceiptService.listGoodsReceipts(
      tenantId,
      {
        purchaseOrderId,
        vendorId,
        status,
      },
    );

    return NextResponse.json({
      success: true,
      data: goodsReceipts,
      count: goodsReceipts.length,
    });
  } catch (error: any) {
    console.error("Error fetching goods receipts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch goods receipts",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      purchaseOrderId,
      items,
      warehouseId,
      warehouseName,
      location,
      receivedBy,
    } = body;

    const tenantId = context.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    const goodsReceipt = await goodsReceiptService.createGoodsReceipt(
      tenantId,
      purchaseOrderId,
      items,
      warehouseId,
      warehouseName,
      location,
      receivedBy,
    );

    return NextResponse.json({
      success: true,
      data: goodsReceipt,
    });
  } catch (error: any) {
    console.error("Error creating goods receipt:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create goods receipt",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.goods-receipt",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.goods-receipt",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
