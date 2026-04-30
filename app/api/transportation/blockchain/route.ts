/**
 * Blockchain API
 *
 * Record transactions, create smart contracts, verify traceability
 */

import { NextRequest, NextResponse } from "next/server";
import { transportationBlockchainService } from "@/lib/services/transportation";
import type { BlockchainTransaction } from "@/lib/services/transportation";
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

    const body = await request.json();
    const { action } = body;

    if (action === "record") {
      const { shipmentId, transactionType, data } = body;
      if (!shipmentId || !transactionType) {
        return NextResponse.json(
          { error: "Missing required fields: shipmentId, transactionType" },
          { status: 400 },
        );
      }

      const transaction =
        await transportationBlockchainService.recordTransaction(
          shipmentId,
          transactionType,
          data || {},
          { tenantId } as any,
        );

      return NextResponse.json(transaction, { status: 201 });
    }

    if (action === "contract") {
      const { shipmentId, type, conditions } = body;
      if (!shipmentId || !type || !conditions) {
        return NextResponse.json(
          { error: "Missing required fields: shipmentId, type, conditions" },
          { status: 400 },
        );
      }

      const contractId =
        await transportationBlockchainService.createSmartContract(
          shipmentId,
          type,
          conditions,
          { tenantId } as any,
        );

      return NextResponse.json({ contractId }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in blockchain operation:", error);
    return NextResponse.json(
      {
        error: "Operation failed",
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
    const shipmentId = searchParams.get("shipmentId");
    const documentId = searchParams.get("documentId");

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Missing shipmentId" },
        { status: 400 },
      );
    }

    if (documentId) {
      // Verify document
      const verification = await transportationBlockchainService.verifyDocument(
        shipmentId,
        documentId,
        { tenantId } as any,
      );
      return NextResponse.json(verification);
    } else {
      // Get traceability
      const traceability =
        await transportationBlockchainService.getTraceability(shipmentId, {
          tenantId,
        } as any);
      return NextResponse.json(traceability);
    }
  } catch (error) {
    console.error("Error getting blockchain data:", error);
    return NextResponse.json(
      {
        error: "Failed to get data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(postHandler, {
  featureId: "blockchain",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
export const GET = withTransportationAPI(getHandler, {
  featureId: "blockchain",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
