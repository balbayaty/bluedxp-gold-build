/**
 * WMS Purchase Order Detail API
 * PATCH /api/wms/purchase-orders/[id] - Update purchase order (approve, update status, etc.)
 * 
 * Uses Prisma - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus, createEvent } from "@/lib/services/event-store";

/**
 * PATCH /api/wms/purchase-orders/[id] - Update purchase order
 */
async function patchHandler(
  request: NextRequest,
  context: APIRequestContext
) {
  try {
    const body = await request.json();
    // Extract ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];

    // Get existing order
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Purchase order not found" },
        { status: 404 }
      );
    }

    // Update order
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: body.status || existingOrder.status,
        approvedBy: body.status === "APPROVED" ? (body.approvedBy || context.userId || "system") : existingOrder.approvedBy,
        approvedAt: body.status === "APPROVED" ? new Date() : existingOrder.approvedAt,
        notes: body.notes !== undefined ? body.notes : existingOrder.notes,
        expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : existingOrder.expectedDeliveryDate,
      },
      include: {
        lines: true,
      },
    });

    // Publish event to Event Bus
    try {
      const event = createEvent(
        "wms.purchase_order.updated",
        orderId,
        "PURCHASE_ORDER",
        {
          orderId,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          tenantId: updatedOrder.tenantId,
          userId: context.userId || "system",
          updatedAt: new Date(),
        },
        1,
        {
          tenantId: updatedOrder.tenantId,
          userId: context.userId || "system",
        },
      );
      await eventBus.publish(event);
    } catch (error) {
      console.error("Error publishing purchase order update event:", error);
      // Don't throw - update should succeed even if event publishing fails
    }

    // Map to expected format
    const mappedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      vendorId: updatedOrder.vendorId,
      vendorName: updatedOrder.vendorName,
      status: updatedOrder.status,
      orderDate: updatedOrder.orderDate,
      expectedDeliveryDate: updatedOrder.expectedDeliveryDate,
      currency: updatedOrder.currency,
      subtotal: Number(updatedOrder.subtotal) || 0,
      totalAmount: Number(updatedOrder.totalAmount) || 0,
      approvedBy: updatedOrder.approvedBy,
      approvedAt: updatedOrder.approvedAt,
      lines: updatedOrder.lines.map((line) => ({
        id: line.id,
        sku: line.sku,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
      })),
    };

    return NextResponse.json({
      success: true,
      data: mappedOrder,
    });
  } catch (error: any) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update purchase order" },
      { status: 500 }
    );
  }
}

export const PATCH = withAPIGateway(patchHandler, {
  moduleId: "wms",
  featureId: "wms.purchase-orders",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
