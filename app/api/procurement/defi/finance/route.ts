/**
 * DeFi Financing API
 * POST /api/procurement/defi/finance
 */

import { NextRequest, NextResponse } from "next/server";
import { defiIntegrationService } from "@/lib/services/procurement/defiIntegrationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      tenantId,
      type,
      invoiceId,
      purchaseOrderId,
      vendorId,
      amount,
      currency,
      protocol,
    } = body;

    if (!tenantId || !type) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and financing type are required",
        },
        { status: 400 },
      );
    }

    let result;
    if (type === "INVOICE" && invoiceId) {
      result = await defiIntegrationService.financeInvoice(
        tenantId,
        invoiceId,
        protocol,
      );
    } else if (type === "PURCHASE_ORDER" && purchaseOrderId) {
      result = await defiIntegrationService.financePurchaseOrder(
        tenantId,
        purchaseOrderId,
        protocol,
      );
    } else if (type === "VENDOR" && vendorId && amount && currency) {
      result = await defiIntegrationService.provideVendorFinancing(
        tenantId,
        vendorId,
        amount,
        currency,
        "WORKING_CAPITAL",
        protocol,
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid financing type or missing required parameters",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error financing via DeFi:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to finance via DeFi",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.defi.finance",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
