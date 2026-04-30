/**
 * Warehouse Head Dashboard API
 * GET /api/dashboards/warehouse-head - Get aggregated dashboard data for warehouse head role
 * 
 * Aggregates inventory, orders, and warehouse metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/services/wms/inventoryService";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const warehouseId = searchParams.get("warehouseId") || "";

    // Build warehouse filter
    const warehouseWhere: any = { tenantId };
    if (warehouseId) {
      warehouseWhere.id = warehouseId;
    }

    // Fetch inventory overview with valuation
    const inventoryOverview = await InventoryService.getInventoryOverview(tenantId);

    // Filter by warehouse if specified
    let filteredInventory = inventoryOverview;
    if (warehouseId) {
      filteredInventory = inventoryOverview.filter((item) => {
        const binWarehouseId = item.bin?.warehouseId;
        return binWarehouseId === warehouseId;
      });
    }

    // Calculate inventory metrics
    const totalStockValue = filteredInventory.reduce(
      (sum, item) => sum + item.valuation,
      0,
    );
    const totalStockQuantity = filteredInventory.reduce(
      (sum, item) => sum + Number(item.quant.quantity),
      0,
    );

    // Group inventory by customer (if available) or material
    const stockByCustomer = new Map<string, { quantity: number; value: number }>();
    filteredInventory.forEach((item) => {
      // In real implementation, we'd get customerId from the quant or material
      // For now, we'll use a placeholder or derive from material
      const customerId = (item.quant as any).customerId || "default-customer";
      const existing = stockByCustomer.get(customerId) || { quantity: 0, value: 0 };
      stockByCustomer.set(customerId, {
        quantity: existing.quantity + Number(item.quant.quantity),
        value: existing.value + item.valuation,
      });
    });

    // Fetch sales orders
    const orderWhere: any = {
      tenantId,
      deletedAt: null,
    };
    if (warehouseId) {
      // Orders might have warehouseId in a different field
      // Adjust based on your schema
      orderWhere.warehouseId = warehouseId;
    }

    const orders = await prisma.salesOrder.findMany({
      where: orderWhere,
      include: {
        lines: true,
      },
      orderBy: { orderDate: "desc" },
      take: 100,
    });

    // Calculate order metrics
    const activeOrders = orders.filter(
      (o) =>
        o.status === "CREATED" ||
        o.status === "CONFIRMED" ||
        o.status === "PICK_RELEASED" ||
        o.status === "PICKING" ||
        o.status === "PICKED" ||
        o.status === "READY_FOR_DISPATCH",
    ).length;

    // Map orders to dashboard format
    const mappedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerNumber: order.customerId || "",
      customerName: order.customerName || "",
      orderDate: order.orderDate.toISOString(),
      status: order.status,
      totalValue: Number(order.totalAmount || order.subtotal || 0),
      totalItems: order.lines?.length || 0,
      totalQuantity: order.lines?.reduce(
        (sum, line) => sum + Number(line.quantity || 0),
        0,
      ) || 0,
    }));

    // Map inventory to dashboard format
    const mappedStock = filteredInventory.map((item) => ({
      materialNumber: item.quant.sku,
      materialDescription: item.material?.description || "",
      quantity: Number(item.quant.quantity),
      unit: item.material?.baseUnit || "EA",
      valuation: item.valuation,
      storageLocation: item.bin?.code || "",
      warehouseId: item.bin?.warehouseId || "",
    }));

    return NextResponse.json({
      success: true,
      data: {
        inventory: {
          items: mappedStock,
          totalValue: totalStockValue,
          totalQuantity: totalStockQuantity,
          byCustomer: Array.from(stockByCustomer.entries()).map(
            ([customerId, data]) => ({
              customerId,
              customerName: `Customer ${customerId.split("-").pop()}`,
              quantity: data.quantity,
              value: data.value,
            }),
          ),
        },
        orders: {
          items: mappedOrders,
          total: orders.length,
          active: activeOrders,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching warehouse head dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard data",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.dashboard",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
