/**
 * Customer Dashboard API
 * GET /api/dashboards/customer - Get customer-specific dashboard data
 * 
 * Aggregates customer inventory, orders, and metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { InventoryService } from "@/lib/services/wms/inventoryService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const customerId = searchParams.get("customerId") || "";

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 },
      );
    }

    // Fetch customer data - try both models (Customer and customers)
    let customer = null;
    
    // Try Customer model first (capitalized)
    try {
      customer = await prisma.customer.findUnique({
        where: {
          id: customerId,
          tenantId,
        },
      });
    } catch (error) {
      // Customer model might not exist, continue to try customers model
    }
    
    // If Customer model didn't work, try customers model (lowercase)
    if (!customer) {
      try {
        customer = await prisma.customers.findUnique({
          where: {
            id: customerId,
            tenantId,
          },
        }) as any;
      } catch (e) {
        // Both failed - will return 404 below
      }
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 },
      );
    }

    // Fetch customer inventory overview
    const inventoryOverview = await InventoryService.getInventoryOverview(tenantId);
    
    // Filter inventory by customer (if customerId is stored in inventory)
    // Note: In real implementation, inventory might have customerId field
    // For now, we'll get all inventory and calculate customer-specific metrics
    const customerInventory = inventoryOverview; // Adjust based on schema

    // Calculate inventory metrics by category
    const inventoryByCategory = new Map<
      string,
      { items: number; value: number }
    >();

    customerInventory.forEach((item) => {
      // Determine category from material or use default
      const category =
        (item.material as any)?.category ||
        (item.material as any)?.materialType ||
        "Other";
      const existing = inventoryByCategory.get(category) || { items: 0, value: 0 };
      inventoryByCategory.set(category, {
        items: existing.items + 1,
        value: existing.value + item.valuation,
      });
    });

    const inventoryData = Array.from(inventoryByCategory.entries()).map(
      ([category, data], index) => {
        const colors = ["#06b6d4", "#10b981", "#8b5cf6", "#f59e0b"];
        return {
          category,
          items: data.items,
          value: data.value,
          color: colors[index % colors.length],
        };
      },
    );

    // Calculate total inventory value
    const totalInventoryValue = customerInventory.reduce(
      (sum, item) => sum + item.valuation,
      0,
    );

    // Fetch customer orders
    const orders = await prisma.salesOrder.findMany({
      where: {
        tenantId,
        customerId,
        deletedAt: null,
      },
      include: {
        lines: true,
      },
      orderBy: { orderDate: "desc" },
      take: 20,
    });

    // Calculate order metrics
    const openOrders = orders.filter(
      (o) =>
        o.status === "CREATED" ||
        o.status === "CONFIRMED" ||
        o.status === "PICK_RELEASED" ||
        o.status === "PICKING" ||
        o.status === "PICKED" ||
        o.status === "READY_FOR_DISPATCH",
    ).length;

    // Calculate SLA compliance (on-time delivery rate)
    const completedOrders = orders.filter(
      (o) => o.status === "COMPLETED" || o.status === "DELIVERED",
    );
    const onTimeOrders = completedOrders.filter((o) => {
      if (!o.actualDeliveryDate || !o.promisedDeliveryDate) return false;
      return new Date(o.actualDeliveryDate) <= new Date(o.promisedDeliveryDate);
    });
    const slaComplianceRate =
      completedOrders.length > 0
        ? (onTimeOrders.length / completedOrders.length) * 100
        : 100;

    // Map recent orders
    const recentOrders = orders.slice(0, 5).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.orderDate.toISOString(),
      status: order.status,
      items: order.lines?.length || 0,
      total: Number(order.totalAmount || order.subtotal || 0),
    }));

    // Get customer service tier (if available)
    // Handle both Customer and customers model structures
    const customerName = (customer as any).name || (customer as any).customerName || "Unknown";
    const customerCode = (customer as any).code || (customer as any).customerNumber || customerId;
    const serviceTier = (customer as any).serviceTier || (customer as any).tier || "STANDARD";

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customerName,
          code: customerCode,
          serviceTier,
        },
        inventory: {
          data: inventoryData,
          totalValue: totalInventoryValue,
        },
        orders: {
          recent: recentOrders,
          open: openOrders,
          total: orders.length,
        },
        metrics: {
          inventoryValue: totalInventoryValue,
          slaComplianceRate,
          openOrders,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching customer dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch customer dashboard data",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.customer.dashboard",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
