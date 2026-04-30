/**
 * WMS Order Confirmation API
 * GET /api/wms/order-confirmation - Get order confirmations
 * POST /api/wms/order-confirmation - Create order confirmation
 * 
 * Uses SalesOrder and PurchaseOrder models - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus, createEvent } from "@/lib/services/event-store";

/**
 * GET /api/wms/order-confirmation - Get order confirmations
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const orderType = searchParams.get("orderType") || "";

    // Get sales orders and purchase orders that need confirmation
    const [salesOrders, purchaseOrders] = await Promise.all([
      orderType !== "PURCHASE_ORDER" 
        ? prisma.salesOrder.findMany({
            where: {
              tenantId,
              status: { in: ["DRAFT", "CREATED", "PENDING"] },
              deletedAt: null,
            },
            include: { lines: true },
            orderBy: { orderDate: "desc" },
            take: 100,
          })
        : [],
      orderType !== "SALES_ORDER"
        ? prisma.purchaseOrder.findMany({
            where: {
              tenantId,
              status: { in: ["DRAFT", "PENDING"] },
              deletedAt: null,
            },
            include: { lines: true },
            orderBy: { orderDate: "desc" },
            take: 100,
          })
        : [],
    ]);

    // Map to confirmation format
    const confirmations = [
      ...salesOrders.map((order, index) => ({
        id: `OC-SO-${order.id}`,
        confirmationNumber: `OC-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        orderType: "SALES_ORDER" as const,
        customerNumber: order.customerId || "",
        customerName: order.customerName || "",
        orderDate: order.orderDate,
        confirmationDate: order.updatedAt || order.createdAt,
        confirmedBy: order.salesRep || "system",
        status: order.status === "DRAFT" ? "PENDING" as const :
                order.status === "CREATED" ? "CONFIRMED" as const : "PENDING" as const,
        totalValue: Number(order.totalAmount || order.subtotal || 0),
        currency: order.currency || "SAR",
        items: order.lines.map((line) => ({
          materialNumber: line.sku,
          materialDescription: line.description || "",
          quantity: Number(line.quantity),
          unit: line.unit,
          price: Number(line.unitPrice),
          confirmedQuantity: Number(line.quantity),
        })),
        confirmationMethod: "API" as const,
        createdAt: order.createdAt,
      })),
      ...purchaseOrders.map((order) => ({
        id: `OC-PO-${order.id}`,
        confirmationNumber: `OC-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        orderType: "PURCHASE_ORDER" as const,
        vendorNumber: order.vendorId || "",
        vendorName: order.vendorName || "",
        orderDate: order.orderDate,
        confirmationDate: order.updatedAt || order.createdAt,
        confirmedBy: order.buyer || "system",
        status: order.status === "DRAFT" ? "PENDING" as const :
                order.status === "PENDING" ? "PENDING" as const : "CONFIRMED" as const,
        totalValue: Number(order.totalAmount || order.subtotal || 0),
        currency: order.currency || "SAR",
        items: order.lines.map((line) => ({
          materialNumber: line.sku,
          materialDescription: line.description || "",
          quantity: Number(line.quantity),
          unit: line.unit,
          price: Number(line.unitPrice),
          confirmedQuantity: Number(line.quantity),
        })),
        confirmationMethod: "API" as const,
        createdAt: order.createdAt,
      })),
    ];

    return NextResponse.json({
      success: true,
      data: confirmations,
      count: confirmations.length,
    });
  } catch (error) {
    console.error("Error fetching order confirmations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order confirmations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/order-confirmation - Confirm order
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId || body.tenantId || "default";
    const userId = context.userId || body.userId || "system";

    if (!body.orderNumber || !body.orderType) {
      return NextResponse.json(
        { success: false, error: "orderNumber and orderType are required" },
        { status: 400 }
      );
    }

    // Update order status based on type
    if (body.orderType === "SALES_ORDER") {
      const order = await prisma.salesOrder.updateMany({
        where: {
          tenantId,
          orderNumber: body.orderNumber,
        },
        data: {
          status: body.status === "CONFIRMED" ? "CONFIRMED" : "DRAFT",
          updatedAt: new Date(),
        },
      });

      if (order.count === 0) {
        return NextResponse.json(
          { success: false, error: "Sales order not found" },
          { status: 404 }
        );
      }

      // Publish event
      try {
        const event = createEvent(
          "wms.sales_order.confirmed",
          body.orderNumber,
          "SALES_ORDER",
          {
            orderNumber: body.orderNumber,
            status: body.status,
            tenantId,
            confirmedBy: userId,
            confirmedAt: new Date(),
          },
          1,
          { tenantId, userId },
        );
        await eventBus.publish(event);
      } catch (error) {
        console.error("Error publishing confirmation event:", error);
      }
    } else if (body.orderType === "PURCHASE_ORDER") {
      const order = await prisma.purchaseOrder.updateMany({
        where: {
          tenantId,
          orderNumber: body.orderNumber,
        },
        data: {
          status: body.status === "CONFIRMED" ? "APPROVED" : "DRAFT",
          updatedAt: new Date(),
        },
      });

      if (order.count === 0) {
        return NextResponse.json(
          { success: false, error: "Purchase order not found" },
          { status: 404 }
        );
      }

      // Publish event
      try {
        const event = createEvent(
          "wms.purchase_order.confirmed",
          body.orderNumber,
          "PURCHASE_ORDER",
          {
            orderNumber: body.orderNumber,
            status: body.status,
            tenantId,
            confirmedBy: userId,
            confirmedAt: new Date(),
          },
          1,
          { tenantId, userId },
        );
        await eventBus.publish(event);
      } catch (error) {
        console.error("Error publishing confirmation event:", error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          confirmationNumber: `OC-${body.orderNumber}`,
          status: body.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error confirming order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm order" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.order_confirmation",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.order_confirmation",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
