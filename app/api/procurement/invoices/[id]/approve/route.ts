/**
 * Approve Invoice API
 * POST /api/procurement/invoices/[id]/approve
 */

import { NextRequest, NextResponse } from "next/server";
import { invoiceService } from "@/lib/services/procurement/invoiceService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const body = await request.json();
    const { comments } = body;
    const tenantId = context.tenantId;
    const approverId = context.userId;
    const id = nextContext?.params?.id;

    if (!tenantId)
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    if (!approverId)
      return NextResponse.json(
        { success: false, error: "User context required" },
        { status: 400 },
      );
    if (!id)
      return NextResponse.json(
        { success: false, error: "Missing invoice id" },
        { status: 400 },
      );

    const invoice = await invoiceService.approveInvoice(
      id,
      tenantId,
      approverId,
      comments,
    );

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error("Error approving invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to approve invoice",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.invoices.approve",
  action: "approve",
  requireAuth: true,
  rateLimit: true,
});
