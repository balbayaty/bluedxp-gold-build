import { NextRequest, NextResponse } from "next/server";
import { invoiceService } from "@/lib/services/marketplace/invoiceService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const invoice = await invoiceService.getInvoice(id);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error("Failed to get invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get invoice" },
      { status: 500 },
    );
  }
}

async function patchHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, paymentId } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Missing status" },
        { status: 400 },
      );
    }

    const updatedInvoice = await invoiceService.updateInvoiceStatus(
      id,
      status,
      paymentId,
    );

    if (!updatedInvoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update invoice" },
      { status: 500 },
    );
  }
}
