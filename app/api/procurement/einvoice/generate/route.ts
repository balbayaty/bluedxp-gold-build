/**
 * E-Invoice Generation API
 * POST /api/procurement/einvoice/generate
 */

import { NextRequest, NextResponse } from "next/server";
import { eInvoicingService } from "@/lib/services/procurement/eInvoicingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, standard, invoiceData } = body;

    if (!tenantId || !standard || !invoiceData) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID, standard, and invoice data are required",
        },
        { status: 400 },
      );
    }

    let eInvoice;
    switch (standard) {
      case "ZATCA":
        eInvoice = await eInvoicingService.generateZATCAInvoice(
          tenantId,
          invoiceData,
        );
        break;
      case "PEPPOL":
        eInvoice = await eInvoicingService.generatePEPPOLInvoice(
          tenantId,
          invoiceData as any,
        );
        break;
      case "UBL":
        eInvoice = await eInvoicingService.generateUBLInvoice(
          tenantId,
          invoiceData as any,
        );
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid standard. Use: ZATCA, PEPPOL, or UBL",
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      data: eInvoice,
    });
  } catch (error: any) {
    console.error("Error generating e-invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate e-invoice",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.einvoice.generate",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
