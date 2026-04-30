/**
 * Freight Audit API
 *
 * Automated freight invoice auditing
 */

import { NextRequest, NextResponse } from "next/server";
import { freightAuditService } from "@/lib/services/transportation";
import type { FreightInvoice } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function postHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body: FreightInvoice = await request.json();

    if (
      !body.id ||
      !body.invoiceNumber ||
      !body.carrierId ||
      !body.shipmentId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: id, invoiceNumber, carrierId, shipmentId",
        },
        { status: 400 },
      );
    }

    const result = await freightAuditService.auditInvoice(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error auditing invoice:", error);
    return NextResponse.json(
      {
        error: "Failed to audit invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function getHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const searchParams = request.nextUrl.searchParams;
    const carrierId = searchParams.get("carrierId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateRange =
      from && to
        ? {
            from: new Date(from),
            to: new Date(to),
          }
        : undefined;

    const stats = await freightAuditService.getAuditStatistics(
      carrierId || undefined,
      dateRange,
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting audit statistics:", error);
    return NextResponse.json(
      {
        error: "Failed to get audit statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(postHandler, {
  featureId: "freight",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withTransportationAPI(getHandler, {
  featureId: "freight",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
