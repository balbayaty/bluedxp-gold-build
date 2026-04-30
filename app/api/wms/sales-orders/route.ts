/**
 * WMS Sales Orders API
 * GET /api/wms/sales-orders - Get all sales orders
 * POST /api/wms/sales-orders - Create a new sales order
 * 
 * Uses Prisma SalesOrder model - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus, createEvent } from "@/lib/services/event-store";

/**
 * GET /api/wms/sales-orders - List sales orders
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const status = searchParams.get("status") || "";
    const customerId = searchParams.get("customerId") || "";

    // Build where clause
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          lines: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { orderDate: "desc" },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    // Map to expected format
    const mappedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      status: order.status,
      orderType: order.orderType,
      orderDate: order.orderDate,
      requestedDeliveryDate: order.requestedDeliveryDate,
      promisedDeliveryDate: order.promisedDeliveryDate,
      actualDeliveryDate: order.actualDeliveryDate,
      currency: order.currency,
      subtotal: order.subtotal ? Number(order.subtotal) : 0,
      taxAmount: order.taxAmount ? Number(order.taxAmount) : 0,
      shippingCost: order.shippingCost ? Number(order.shippingCost) : 0,
      discountAmount: order.discountAmount ? Number(order.discountAmount) : 0,
      totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
      paymentTerms: order.paymentTerms,
      paymentStatus: order.paymentStatus,
      priority: order.priority,
      salesRep: order.salesRep,
      warehouseId: order.warehouseId,
      notes: order.notes,
      lines: order.lines.map((line) => ({
        id: line.id,
        lineNumber: line.lineNumber,
        sku: line.sku,
        description: line.description,
        quantity: Number(line.quantity),
        unit: line.unit,
        unitPrice: Number(line.unitPrice),
        lineTotal: Number(line.lineTotal),
        status: line.status,
        shippedQty: Number(line.shippedQty),
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: mappedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/sales-orders - Create sales order
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId || body.tenantId || "default";

    // Generate order number if not provided
    const orderNumber = body.orderNumber || `SO-${Date.now().toString().slice(-8)}`;

    // Calculate totals from lines if provided
    let subtotal = 0;
    let totalAmount = 0;
    
    if (body.lines && Array.isArray(body.lines)) {
      subtotal = body.lines.reduce((sum: number, line: any) => {
        const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
        return sum + lineTotal;
      }, 0);
      totalAmount = subtotal + (body.taxAmount || 0) + (body.shippingCost || 0) - (body.discountAmount || 0);
    }

    const order = await prisma.salesOrder.create({
      data: {
        id: `so-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        tenantId,
        orderNumber,
        customerId: body.customerId || null,
        customerName: body.customerName || null,
        status: body.status || "DRAFT",
        orderType: body.orderType || "STANDARD",
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        requestedDeliveryDate: body.requestedDeliveryDate ? new Date(body.requestedDeliveryDate) : null,
        currency: body.currency || "SAR",
        subtotal,
        taxAmount: body.taxAmount || 0,
        shippingCost: body.shippingCost || 0,
        discountAmount: body.discountAmount || 0,
        totalAmount,
        paymentTerms: body.paymentTerms || null,
        priority: body.priority || "MEDIUM",
        salesRep: body.salesRep || null,
        warehouseId: body.warehouseId || null,
        notes: body.notes || null,
        createdBy: body.createdBy || null,
        shippingAddress: body.shippingAddress || null,
        billingAddress: body.billingAddress || null,
        lines: body.lines && body.lines.length > 0 ? {
          create: body.lines.map((line: any, index: number) => ({
            id: `sol-${Date.now()}-${index}`,
            lineNumber: line.lineNumber || index + 1,
            sku: line.sku || line.materialNumber,
            description: line.description || line.materialDescription,
            quantity: line.quantity || 0,
            unit: line.unit || "EA",
            unitPrice: line.unitPrice || 0,
            discount: line.discount || 0,
            taxRate: line.taxRate || 0,
            lineTotal: (line.quantity || 0) * (line.unitPrice || 0),
            warehouseId: line.warehouseId || null,
          })),
        } : undefined,
      },
      include: {
        lines: true,
      },
    });

    // Publish event to Event Bus
    try {
      const event = createEvent(
        "wms.sales_order.created",
        order.id,
        "SALES_ORDER",
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          tenantId,
          customerId: order.customerId,
          totalAmount: Number(order.totalAmount),
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
      console.error("Error publishing sales order creation event:", error);
      // Don't throw - creation should succeed even if event publishing fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: Number(order.totalAmount),
          linesCount: order.lines.length,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating sales order:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Order with this number already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create sales order" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.sales-orders",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.sales-orders",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
