/**
 * Business Development Dashboard API
 * GET /api/dashboards/business-development - Get business development dashboard data
 * 
 * Aggregates revenue, SLA, churn, and profitability metrics
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

    // Fetch customers
    const customers = await prisma.customers.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get orders for all customers
    const customerIds = customers.map((c) => c.id);
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
    });

    // Calculate customer metrics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status === "ACTIVE")
      .length;

    // Calculate revenue metrics
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount || o.subtotal || 0),
      0,
    );
    const mrr = totalRevenue / 12; // Monthly recurring revenue estimate
    const averageRevenue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // Calculate SLA metrics
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

    // Calculate churn risk
    const atRiskCustomers = customers.filter((c) => {
      const customerOrders = orders.filter((o) => o.customerId === c.id);
      if (customerOrders.length === 0) return true; // No orders = at risk
      const customerSLA = customerOrders.filter((o) => {
        if (!o.actualDeliveryDate || !o.promisedDeliveryDate) return false;
        return new Date(o.actualDeliveryDate) <= new Date(o.promisedDeliveryDate);
      }).length / customerOrders.length;
      return customerSLA < 0.9; // Less than 90% SLA
    });

    // Get CRM data for opportunities
    let crmData: any = null;
    try {
      crmData = await unifiedCRMService.getUnifiedCRMData(tenantId);
    } catch (error) {
      console.error("Error fetching CRM data:", error);
    }

    const opportunities = crmData?.opportunities || [];
    const activeOpportunities = opportunities.filter(
      (opp: any) =>
        opp.stage !== "CLOSED_WON" && opp.stage !== "CLOSED_LOST",
    );
    const pipelineValue = activeOpportunities.reduce(
      (sum, opp: any) => sum + (opp.value || 0),
      0,
    );

    // Calculate revenue by customer
    const revenueByCustomer = customers.map((customer) => {
      const customerOrders = orders.filter((o) => o.customerId === customer.id);
      const customerRevenue = customerOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount || o.subtotal || 0),
        0,
      );
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
        revenue: customerRevenue,
        slaCompliance: customerSLA * 100,
        churnRisk:
          customerSLA < 0.8
            ? "CRITICAL"
            : customerSLA < 0.9
              ? "HIGH"
              : customerSLA < 0.95
                ? "MEDIUM"
                : "LOW",
        monthlyRevenue: customerRevenue / 12,
      };
    });

    // Calculate profitability (estimate based on revenue)
    const profitability = revenueByCustomer.reduce(
      (sum, c) => sum + c.revenue * 0.3, // Assume 30% margin
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        customers: revenueByCustomer,
        metrics: {
          totalCustomers,
          activeCustomers,
          atRiskCustomers: atRiskCustomers.length,
          totalRevenue,
          mrr,
          averageRevenue,
          averageSLA,
          pipelineValue,
          activeOpportunities: activeOpportunities.length,
          profitability,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching business development dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch business development dashboard data",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "crm",
  featureId: "crm.business-development.dashboard",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
