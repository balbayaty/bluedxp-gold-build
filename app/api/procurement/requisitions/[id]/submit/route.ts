/**
 * Submit Requisition API
 * POST /api/procurement/requisitions/[id]/submit
 */

import { NextRequest, NextResponse } from "next/server";
import { requisitionService } from "@/lib/services/procurement/requisitionService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    await request.json().catch(() => ({}));
    const tenantId = context.tenantId;
    const userId = context.userId;
    const id = nextContext?.params?.id;

    if (!tenantId)
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    if (!userId)
      return NextResponse.json(
        { success: false, error: "User context required" },
        { status: 400 },
      );
    if (!id)
      return NextResponse.json(
        { success: false, error: "Missing requisition id" },
        { status: 400 },
      );

    const requisition = await requisitionService.submitForApproval(
      id,
      tenantId,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: requisition,
    });
  } catch (error: any) {
    console.error("Error submitting requisition:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit requisition",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.requisitions.submit",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
