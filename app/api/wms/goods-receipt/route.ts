/**
 * WMS Goods Receipt API
 * GET /api/wms/goods-receipt - Get inbound deliveries
 * POST /api/wms/goods-receipt - Create new inbound delivery (ASN)
 * 
 * Uses InboundService with Prisma - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { InboundService } from "@/lib/services/wms/InboundService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus, createEvent } from "@/lib/services/event-store";

/**
 * GET /api/wms/goods-receipt - Get inbound deliveries
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId || "default";
    
    const deliveries = await InboundService.getInboundDeliveries(tenantId);
    
    // Map to expected format
    const mappedDeliveries = deliveries.map((delivery) => ({
      id: delivery.id,
      documentNumber: delivery.documentNumber,
      vendorId: delivery.vendorId,
      vendorName: delivery.vendorName,
      status: delivery.status,
      expectedDeliveryDate: delivery.expectedDeliveryDate,
      actualDeliveryDate: delivery.actualDeliveryDate,
      items: (delivery.items || []).map((item: any) => ({
        id: item.id,
        sku: item.sku,
        description: item.description,
        expectedQty: item.expectedQty,
        receivedQty: item.receivedQty,
        unit: item.unit,
      })),
      receipts: (delivery.receipts || []).map((receipt: any) => ({
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        status: receipt.status,
        receivedAt: receipt.receivedAt,
      })),
      appointment: delivery.appointment ? {
        id: delivery.appointment.id,
        scheduledStart: delivery.appointment.scheduledStart,
        scheduledEnd: delivery.appointment.scheduledEnd,
        carrier: delivery.appointment.carrier,
        status: delivery.appointment.status,
      } : null,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: mappedDeliveries,
      count: mappedDeliveries.length,
    });
  } catch (error) {
    console.error("Error fetching goods receipts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch goods receipts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/goods-receipt - Create inbound delivery (ASN)
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId || body.tenantId || "default";

    if (!body.documentNumber) {
      return NextResponse.json(
        { success: false, error: "documentNumber is required" },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one item is required" },
        { status: 400 }
      );
    }

    const delivery = await InboundService.createASN({
      documentNumber: body.documentNumber,
      vendorId: body.vendorId,
      vendorName: body.vendorName,
      expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : undefined,
      tenantId,
      items: body.items.map((item: any) => ({
        sku: item.sku || item.materialNumber,
        description: item.description || item.materialDescription,
        expectedQty: item.expectedQty || item.quantity,
        unit: item.unit || "EA",
      })),
    });

    // Publish event to Event Bus
    try {
      const event = createEvent(
        "wms.goods_receipt.created",
        delivery.id,
        "GOODS_RECEIPT",
        {
          deliveryId: delivery.id,
          documentNumber: delivery.documentNumber,
          vendorId: delivery.vendorId,
          vendorName: delivery.vendorName,
          status: delivery.status,
          tenantId,
          expectedDeliveryDate: delivery.expectedDeliveryDate,
          createdAt: new Date(),
        },
        1,
        {
          tenantId,
          userId: context.userId || "system",
        },
      );
      await eventBus.publish(event);
    } catch (error) {
      console.error("Error publishing goods receipt creation event:", error);
      // Don't throw - creation should succeed even if event publishing fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: delivery.id,
          documentNumber: delivery.documentNumber,
          status: delivery.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating goods receipt:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create goods receipt" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.goods-receipt",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.goods-receipt",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
