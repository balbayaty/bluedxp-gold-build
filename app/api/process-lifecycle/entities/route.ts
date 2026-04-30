/**
 * Process Lifecycle - Entities API
 * Aggregates entities from multiple modules for lifecycle management
 * Fetches Sales Orders, Purchase Orders, ASNs, NCRs and enriches with lifecycle data
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { prisma } from "@/lib/services/database/prismaClient";
import { lifecycleService } from "@/lib/services/process-lifecycle";
import { getAsnService } from "@/lib/services/asn";
import type { EntityType } from "@/types/lifecycle";

/**
 * GET /api/process-lifecycle/entities
 * Get all entities with lifecycle data aggregated
 */
async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || "default";
    const entityType = searchParams.get("entityType") as EntityType | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);

    const entities: any[] = [];

    // Fetch Sales Orders
    if (!entityType || entityType === "SALES_ORDER") {
      const salesOrders = await prisma.salesOrder.findMany({
        where: {
          tenantId,
          deletedAt: null,
        },
        take: limit,
        orderBy: { orderDate: "desc" },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
      });

      for (const order of salesOrders) {
        // Get lifecycle data if exists
        const lifecycle = await lifecycleService
          .getLifecycle(order.id, "SALES_ORDER", tenantId)
          .catch(() => null);

        // Calculate progress based on status
        const statusProgress: Record<string, number> = {
          DRAFT: 0,
          CONFIRMED: 10,
          PICKING: 30,
          PICKED: 50,
          QC_IN_PROGRESS: 60,
          DISPATCHED: 75,
          IN_TRANSIT: 85,
          DELIVERED: 95,
          COMPLETED: 100,
        };

        const progress = lifecycle?.progress ?? statusProgress[order.status] ?? 0;

        // Calculate duration in hours
        const duration = order.orderDate
          ? Math.floor(
              (new Date().getTime() - new Date(order.orderDate).getTime()) /
                3600000,
            )
          : 0;

        // Calculate SLA status
        let slaStatus: "ON_TIME" | "AT_RISK" | "BREACHED" = "ON_TIME";
        if (order.promisedDeliveryDate) {
          const now = new Date();
          const promised = new Date(order.promisedDeliveryDate);
          const daysUntil = Math.floor(
            (promised.getTime() - now.getTime()) / 86400000,
          );
          if (daysUntil < 0) {
            slaStatus = "BREACHED";
          } else if (daysUntil < 2) {
            slaStatus = "AT_RISK";
          }
        }

        entities.push({
          id: order.id,
          type: "SALES_ORDER",
          name: `Sales Order ${order.orderNumber}`,
          status: order.status,
          description: `Order for ${order.customerName || "Customer"}`,
          icon: "ri-shopping-cart-2-line",
          href: `/sales-orders`,
          createdAt: order.orderDate || order.createdAt,
          lastUpdated: order.updatedAt,
          stage: order.status,
          progress,
          slaStatus,
          efficiency: progress > 0 ? Math.min(100, (progress / duration) * 100) : 0,
          duration,
        });
      }
    }

    // Fetch Purchase Orders
    if (!entityType || entityType === "PURCHASE_ORDER") {
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
          tenantId,
          deletedAt: null,
        },
        take: limit,
        orderBy: { orderDate: "desc" },
        include: {
          vendor: {
            select: {
              name: true,
            },
          },
        },
      });

      for (const order of purchaseOrders) {
        const lifecycle = await lifecycleService
          .getLifecycle(order.id, "PURCHASE_ORDER", tenantId)
          .catch(() => null);

        const statusProgress: Record<string, number> = {
          DRAFT: 0,
          CONFIRMED: 15,
          GR_POSTED: 100,
          PARTIALLY_RECEIVED: 50,
          CANCELLED: 0,
        };

        const progress = lifecycle?.progress ?? statusProgress[order.status] ?? 0;
        const duration = order.orderDate
          ? Math.floor(
              (new Date().getTime() - new Date(order.orderDate).getTime()) /
                3600000,
            )
          : 0;

        let slaStatus: "ON_TIME" | "AT_RISK" | "BREACHED" = "ON_TIME";
        if (order.expectedDeliveryDate) {
          const now = new Date();
          const expected = new Date(order.expectedDeliveryDate);
          const daysUntil = Math.floor(
            (expected.getTime() - now.getTime()) / 86400000,
          );
          if (daysUntil < 0) {
            slaStatus = "BREACHED";
          } else if (daysUntil < 2) {
            slaStatus = "AT_RISK";
          }
        }

        entities.push({
          id: order.id,
          type: "PURCHASE_ORDER",
          name: `Purchase Order ${order.orderNumber}`,
          status: order.status,
          description: `Order from ${order.vendorName || "Vendor"}`,
          icon: "ri-shopping-bag-line",
          href: `/orders`,
          createdAt: order.orderDate || order.createdAt,
          lastUpdated: order.updatedAt,
          stage: order.status,
          progress,
          slaStatus,
          efficiency: progress > 0 ? Math.min(100, (progress / duration) * 100) : 0,
          duration,
        });
      }
    }

    // Fetch ASNs
    if (!entityType || entityType === "ASN") {
      try {
        const asnService = getAsnService();
        const asnResult = await asnService.listAsns(
          {
            limit,
            page: 1,
            sortBy: "createdAt",
            sortOrder: "desc",
          },
          tenantId,
        );
        const asns = asnResult.data || asnResult.items || [];

        for (const asn of asns) {
        const lifecycle = await lifecycleService
          .getLifecycle(asn.id, "ASN", tenantId)
          .catch(() => null);

        const statusProgress: Record<string, number> = {
          pending: 0,
          confirmed: 20,
          in_transit: 40,
          arrived: 60,
          receiving: 75,
          received: 90,
          completed: 100,
        };

          const status = typeof asn.status === 'string' ? asn.status.toLowerCase() : 'pending';
          const progress = lifecycle?.progress ?? statusProgress[status] ?? 0;
          
          const expectedDate = asn.expectedArrivalDate 
            ? (asn.expectedArrivalDate instanceof Date ? asn.expectedArrivalDate : new Date(asn.expectedArrivalDate))
            : null;
          
          const duration = expectedDate
            ? Math.floor(
                (new Date().getTime() - expectedDate.getTime()) / 3600000,
              )
            : 0;

          let slaStatus: "ON_TIME" | "AT_RISK" | "BREACHED" = "ON_TIME";
          if (expectedDate) {
            const now = new Date();
            const daysUntil = Math.floor(
              (expectedDate.getTime() - now.getTime()) / 86400000,
            );
            if (daysUntil < 0) {
              slaStatus = "BREACHED";
            } else if (daysUntil < 1) {
              slaStatus = "AT_RISK";
            }
          }

          const createdAt = asn.createdAt instanceof Date ? asn.createdAt : new Date(asn.createdAt);
          const updatedAt = asn.updatedAt instanceof Date ? asn.updatedAt : new Date(asn.updatedAt);

          entities.push({
            id: asn.id,
            type: "ASN",
            name: `ASN ${asn.asnNumber || asn.id}`,
            status: status.toUpperCase(),
            description: `Advanced Shipping Notice from ${asn.supplierName || "Supplier"}`,
            icon: "ri-truck-line",
            href: `/inbound`,
            createdAt,
            lastUpdated: updatedAt,
            stage: status.toUpperCase(),
            progress,
            slaStatus,
            efficiency: progress > 0 && duration > 0 ? Math.min(100, (progress / duration) * 100) : 0,
            duration,
          });
        }
      } catch (error) {
        console.error("Error fetching ASNs:", error);
        // Continue with other entity types even if ASN fetch fails
      }
    }

    // Fetch NCRs
    if (!entityType || entityType === "NCR") {
      const ncrs = await prisma.iso_ims_ncrs.findMany({
        where: {
          tenantId,
          recordStatus: "ACTIVE",
        },
        take: limit,
        orderBy: { reportedDate: "desc" },
      });

      for (const ncr of ncrs) {
        const lifecycle = await lifecycleService
          .getLifecycle(ncr.id, "NCR", tenantId)
          .catch(() => null);

        const statusProgress: Record<string, number> = {
          DRAFT: 5,
          OPEN: 10,
          INVESTIGATING: 30,
          ROOT_CAUSE_IDENTIFIED: 50,
          CAPA_IN_PROGRESS: 70,
          RESOLVED: 90,
          CLOSED: 100,
        };

        const progress = lifecycle?.progress ?? statusProgress[ncr.status] ?? 0;
        const duration = ncr.reportedDate
          ? Math.floor(
              (new Date().getTime() - new Date(ncr.reportedDate).getTime()) /
                3600000,
            )
          : 0;

        let slaStatus: "ON_TIME" | "AT_RISK" | "BREACHED" = "ON_TIME";
        // Calculate SLA based on daysOpen or target resolution
        if (ncr.daysOpen !== null && ncr.daysOpen !== undefined) {
          if (ncr.daysOpen > 30) {
            slaStatus = "BREACHED";
          } else if (ncr.daysOpen > 20) {
            slaStatus = "AT_RISK";
          }
        }

        entities.push({
          id: ncr.id,
          type: "NCR",
          name: `NCR ${ncr.ncrNumber || ncr.id}`,
          status: ncr.status,
          description: ncr.description || ncr.subject || "Non-conformance report",
          icon: "ri-error-warning-line",
          href: `/ncr-management`,
          createdAt: ncr.reportedDate || ncr.createdAt,
          lastUpdated: ncr.updatedAt,
          stage: ncr.status,
          progress,
          slaStatus,
          efficiency: progress > 0 ? Math.min(100, (progress / duration) * 100) : 0,
          duration,
        });
      }
    }

    // Sort by last updated (most recent first)
    entities.sort((a, b) => {
      const dateA = new Date(a.lastUpdated).getTime();
      const dateB = new Date(b.lastUpdated).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      data: entities,
      count: entities.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/process-lifecycle/entities:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  requireAuth: true,
  requirePermissions: ["process-lifecycle:read"],
});
