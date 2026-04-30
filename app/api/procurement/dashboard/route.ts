/**
 * Procurement Dashboard API
 * GET /api/procurement/dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { requisitionService } from "@/lib/services/procurement/requisitionService";
import { purchaseOrderService } from "@/lib/services/procurement/purchaseOrderService";
import { vendorService } from "@/lib/services/procurement/vendorService";
import { invoiceService } from "@/lib/services/procurement/invoiceService";
import type { ProcurementMetrics } from "@/types/procurement";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    // Get all requisitions
    const requisitions = await requisitionService.listRequisitions({
      tenantId,
    });
    const pendingApprovals = requisitions.filter(
      (req) => req.status === "SUBMITTED" || req.status === "PENDING_APPROVAL",
    );

    // Get all POs
    const purchaseOrders = await purchaseOrderService.listPurchaseOrders({
      tenantId,
    });
    const openPOs = purchaseOrders.filter(
      (po) =>
        po.status !== "COMPLETED" &&
        po.status !== "CANCELLED" &&
        po.status !== "INVOICED",
    );

    // Calculate totals
    const totalSpend = purchaseOrders
      .filter((po) => po.status === "RECEIVED" || po.status === "COMPLETED")
      .reduce((sum, po) => sum + po.totalAmount, 0);

    const committedSpend = purchaseOrders
      .filter((po) => po.status !== "CANCELLED")
      .reduce((sum, po) => sum + po.totalAmount, 0);

    // Get vendors
    const vendors = await vendorService.listVendors({ tenantId });

    // Get invoices
    const invoices = await invoiceService.listInvoices(tenantId);
    const pendingInvoices = invoices.filter(
      (inv) =>
        inv.status === "PENDING_MATCHING" || inv.status === "PENDING_APPROVAL",
    );

    // Calculate average cycle time (simplified)
    const completedPOs = purchaseOrders.filter(
      (po) => po.status === "COMPLETED",
    );
    const cycleTimes = completedPOs
      .filter((po) => po.createdAt && po.approvedDate)
      .map((po) => {
        const created = new Date(po.createdAt);
        const approved = po.approvedDate
          ? new Date(po.approvedDate)
          : new Date();
        return (approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // Days
      });
    const averageCycleTime =
      cycleTimes.length > 0
        ? cycleTimes.reduce((sum, ct) => sum + ct, 0) / cycleTimes.length
        : 0;

    // Calculate cost savings (from discounts)
    const costSavings = purchaseOrders.reduce(
      (sum, po) => sum + (po.discountAmount || 0),
      0,
    );

    // Calculate budget variance (simplified)
    const budgetVariance = 0; // Would calculate from budget service

    const metrics: ProcurementMetrics = {
      totalRequisitions: requisitions.length,
      pendingApprovals: pendingApprovals.length,
      totalPurchaseOrders: purchaseOrders.length,
      openPurchaseOrders: openPOs.length,
      totalSpend,
      committedSpend,
      budgetVariance,
      vendorCount: vendors.length,
      averageCycleTime,
      costSavings,
    };

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: unknown) {
    logger.error("Error fetching procurement dashboard", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "procurement-dashboard", action: "fetch", tenantId },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch procurement dashboard",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.dashboard",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
