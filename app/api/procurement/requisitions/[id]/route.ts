/**
 * Requisition Detail API
 * GET /api/procurement/requisitions/[id] - Get requisition
 * PUT /api/procurement/requisitions/[id] - Update requisition
 */

import { NextRequest, NextResponse } from "next/server";
import { requisitionService } from "@/lib/services/procurement/requisitionService";
import type { RequisitionUpdateInput } from "@/types/requisition";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const tenantId = context.tenantId;
    const id = nextContext?.params?.id;
    if (!tenantId)
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    if (!id)
      return NextResponse.json(
        { success: false, error: "Missing requisition id" },
        { status: 400 },
      );

    const requisition = await requisitionService.getRequisition(id, tenantId);

    if (!requisition) {
      return NextResponse.json(
        {
          success: false,
          error: "Requisition not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: requisition,
    });
  } catch (error: any) {
    console.error("Error fetching requisition:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch requisition",
      },
      { status: 500 },
    );
  }
}

async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const body = await request.json();
    const { ...input } = body;
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

    const requisition = await requisitionService.updateRequisition(
      id,
      tenantId,
      input as RequisitionUpdateInput,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: requisition,
    });
  } catch (error: any) {
    console.error("Error updating requisition:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update requisition",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.requisitions",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "procurement",
  featureId: "procurement.requisitions",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
