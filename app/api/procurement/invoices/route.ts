/**
 * Invoices API
 * GET /api/procurement/invoices - List invoices
 * POST /api/procurement/invoices - Receive invoice
 */

import { NextRequest, NextResponse } from "next/server";
import { invoiceService } from "@/lib/services/procurement/invoiceService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId!;
    const purchaseOrderId = searchParams.get("purchaseOrderId") || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;
    const status = searchParams.get("status")?.split(",") as any;

    const invoices = await invoiceService.listInvoices(tenantId, {
      purchaseOrderId,
      vendorId,
      status,
    });

    return NextResponse.json({
      success: true,
      data: invoices,
      count: invoices.length,
    });
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch invoices",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      purchaseOrderId,
      vendorInvoiceNumber,
      invoiceDate,
      items,
      paymentTerms,
      currency,
      receivedBy,
    } = body;

    const invoice = await invoiceService.receiveInvoice(
      context.tenantId!,
      purchaseOrderId,
      vendorInvoiceNumber,
      invoiceDate,
      items,
      paymentTerms,
      currency,
      receivedBy,
    );

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error("Error receiving invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to receive invoice",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.invoices",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.invoices",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
