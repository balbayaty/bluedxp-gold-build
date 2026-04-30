/**
 * Account Manager Dashboard API
 * GET /api/dashboards/account-manager - Get account manager dashboard data
 * 
 * Aggregates customer data, orders, SLA metrics, and issues
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { unifiedCRMService } from "@/lib/services/crm/integration/unifiedCRMService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const customerId = searchParams.get("customerId") || "";

    // Fetch customers
    const customerWhere: any = {
      tenantId,
      deletedAt: null,
    };

    const customers = await prisma.customers.findMany({
      where: customerWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Filter by customerId if specified
    let filteredCustomers = customers;
    if (customerId) {
      filteredCustomers = customers.filter((c) => c.id === customerId);
    }

    // Calculate customer metrics
    const totalCustomers = filteredCustomers.length;
    const activeCustomers = filteredCustomers.filter(
      (c) => c.status === "ACTIVE",
    ).length;

    // Get orders for customers
    const customerIds = filteredCustomers.map((c) => c.id);
    const orders = await prisma.salesOrder.findMany({
      where: {
        tenantId,
        customerId: { in: customerIds },
        deletedAt: null,
      },
      include: {
        lines: true,
      },
      orderBy: { orderDate: "desc" },
      take: 100,
    });

    // Calculate SLA compliance
    const completedOrders = orders.filter(
      (o) => o.status === "COMPLETED" || o.status === "DELIVERED",
    );
    const onTimeOrders = completedOrders.filter((o) => {
      if (!o.actualDeliveryDate || !o.promisedDeliveryDate) return false;
      return new Date(o.actualDeliveryDate) <= new Date(o.promisedDeliveryDate);
    });
    const averageSLA =
      completedOrders.length > 0
        ? (onTimeOrders.length / completedOrders.length) * 100
        : 100;

    // Calculate customer revenue
    const customerRevenue = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount || o.subtotal || 0),
      0,
    );

    // Get CRM data for opportunities and activities
    let crmData: any = null;
    try {
      crmData = await unifiedCRMService.getUnifiedCRMData(tenantId);
    } catch (error) {
      console.error("Error fetching CRM data:", error);
    }

    // Get opportunities for customers
    const opportunities = crmData?.opportunities || [];
    const customerOpportunities = opportunities.filter((opp: any) =>
      customerIds.includes(opp.accountId),
    );

    // Calculate critical risk customers (based on SLA and order issues)
    const criticalRiskCustomers = filteredCustomers.filter((c) => {
      const customerOrders = orders.filter((o) => o.customerId === c.id);
      const customerSLA = customerOrders.length > 0
        ? customerOrders.filter((o) => {
            if (!o.actualDeliveryDate || !o.promisedDeliveryDate) return false;
            return new Date(o.actualDeliveryDate) <= new Date(o.promisedDeliveryDate);
          }).length / customerOrders.length
        : 1;
      return customerSLA < 0.8; // Less than 80% SLA compliance
    });

    // Map customers to dashboard format
    const mappedCustomers = filteredCustomers.map((customer) => {
      const customerOrders = orders.filter((o) => o.customerId === customer.id);
      const customerSLA = customerOrders.length > 0
        ? customerOrders.filter((o) => {
            if (!o.actualDeliveryDate || !o.promisedDeliveryDate) return false;
            return new Date(o.actualDeliveryDate) <= new Date(o.promisedDeliveryDate);
          }).length / customerOrders.length
        : 1;

      return {
        id: customer.id,
        customerName: (customer as any).name || (customer as any).customerName || "Unknown",
        customerCode: (customer as any).code || (customer as any).customerNumber || customer.id,
        status: (customer as any).status || "ACTIVE",
        churnRisk:
          customerSLA < 0.8
            ? "CRITICAL"
            : customerSLA < 0.9
              ? "HIGH"
              : customerSLA < 0.95
                ? "MEDIUM"
                : "LOW",
        metrics: {
          slaComplianceRate: customerSLA * 100,
          monthlyRevenue: customerOrders.reduce(
            (sum, o) => sum + Number(o.totalAmount || o.subtotal || 0),
            0,
          ) / 12, // Estimate monthly
          totalOrders: customerOrders.length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        customers: mappedCustomers,
        metrics: {
          totalCustomers,
          activeCustomers,
          averageSLA,
          customerRevenue,
          criticalRisk: criticalRiskCustomers.length,
          totalOrders: orders.length,
          activeOpportunities: customerOpportunities.filter(
            (opp: any) =>
              opp.stage !== "CLOSED_WON" && opp.stage !== "CLOSED_LOST",
          ).length,
        },
        orders: orders.slice(0, 20).map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName || "",
          orderDate: order.orderDate.toISOString(),
          status: order.status,
          totalValue: Number(order.totalAmount || order.subtotal || 0),
          slaStatus:
            order.actualDeliveryDate && order.promisedDeliveryDate
              ? new Date(order.actualDeliveryDate) <=
                  new Date(order.promisedDeliveryDate)
                ? "ON_TIME"
                : "BREACHED"
              : "PENDING",
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching account manager dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch account manager dashboard data",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "crm",
  featureId: "crm.account-manager.dashboard",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
