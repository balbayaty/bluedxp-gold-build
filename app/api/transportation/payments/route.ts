/**
 * Payment Management API
 *
 * Process payments, get payment history, financial analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { financialManagementService } from "@/lib/services/transportation";
import type { PaymentRequest } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

async function postHandler(
  request: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body: PaymentRequest = await request.json();

    if (
      !body.invoiceId ||
      !body.shipmentId ||
      !body.amount ||
      !body.carrierId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: invoiceId, shipmentId, amount, carrierId",
        },
        { status: 400 },
      );
    }

    const payment = await financialManagementService.processPayment({
      ...(body as any),
      tenantId,
    } as any);

    // Persist (tenant-scoped, JSON)
    const paymentId = await transportationDatabaseAdapterInstance.storePayment(
      payment as any,
      {
        tenantId,
        createdBy: userId,
        invoiceId: body.invoiceId,
        shipmentId: body.shipmentId,
        carrierId: body.carrierId,
        amount: body.amount,
        currency: (body as any).currency,
        status: (payment as any)?.status || "PROCESSED",
      },
    );

    const evidence = await evidenceService.create({
      tenantId,
      type: "event",
      category: "financial",
      title: `Payment processed: ${paymentId}`,
      description: "Transportation payment processed",
      content: JSON.stringify(
        {
          paymentId,
          invoiceId: body.invoiceId,
          shipmentId: body.shipmentId,
          carrierId: body.carrierId,
          amount: body.amount,
        },
        null,
        2,
      ),
      createdBy: userId,
      metadata: {
        source: "transportation-api",
        capturedAt: new Date().toISOString(),
        capturedMethod: "api",
      },
      relatedEntities: [
        {
          entityId: paymentId,
          entityType: "payment",
          relationship: "subject",
          addedAt: new Date().toISOString(),
        },
      ],
      tags: ["tms", "transportation", "payment"],
    } as any);

    await eventBus.publish(
      createEvent(
        "transportation.payment.processed",
        paymentId,
        "Payment",
        {
          paymentId,
          invoiceId: body.invoiceId,
          shipmentId: body.shipmentId,
          carrierId: body.carrierId,
          amount: body.amount,
          evidenceId: evidence.id,
        },
        1,
        { tenantId, userId },
      ),
    );

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      {
        error: "Failed to process payment",
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

    // If requesting payment records, return persisted payment objects
    if (request.nextUrl.searchParams.get("action") === "records") {
      const searchParams = request.nextUrl.searchParams;
      const shipmentId = searchParams.get("shipmentId") || undefined;
      const invoiceId = searchParams.get("invoiceId") || undefined;
      const status = searchParams.get("status") || undefined;
      const limit = Math.min(
        500,
        Math.max(1, Number(searchParams.get("limit") || 200)),
      );
      const offset = Math.max(0, Number(searchParams.get("offset") || 0));

      const records = await transportationDatabaseAdapterInstance.listPayments({
        tenantId,
        shipmentId,
        invoiceId,
        status,
        limit,
        offset,
      });
      return NextResponse.json(records);
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const carrierId = searchParams.get("carrierId");
    const mode = searchParams.get("mode");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing required parameters: from, to" },
        { status: 400 },
      );
    }

    const analytics = await financialManagementService.getFinancialAnalytics(
      {
        from: new Date(from),
        to: new Date(to),
      },
      {
        carrierId: carrierId || undefined,
        mode: mode || undefined,
      },
      { tenantId } as any,
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error getting financial analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to get financial analytics",
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
