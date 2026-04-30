/**
 * ISO-IMS NCR by ID API Route
 * Handles single NCR operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { ncrService } from "@/lib/services/iso-ims/ncrService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const updateNCRSchema = z.object({
  subject: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]).optional(),
  status: z
    .enum(["DRAFT", "OPEN", "IN_PROGRESS", "CLOSED", "CANCELLED"])
    .optional(),
  assignedTo: z.string().optional(),
  department: z.string().optional(),
  immediateAction: z.string().optional(),
  rootCause: z.string().optional(),
  containmentAction: z.string().optional(),
});

// GET - Get NCR by ID
async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    const ncr = await ncrService.getNCR(params.id, tenantId);

    if (!ncr) {
      return NextResponse.json(
        { success: false, error: "NCR not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: ncr,
    });
  } catch (error) {
    console.error("Error fetching NCR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch NCR",
      },
      { status: 500 },
    );
  }
}

// PUT - Update NCR
async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const userId = searchParams.get("userId") || "system";

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateNCRSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validatedData.error.format(),
        },
        { status: 400 },
      );
    }

    const updated = await ncrService.updateNCR(
      params.id,
      validatedData.data,
      tenantId,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating NCR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update NCR",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete NCR
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;

    const deleted = await ncrService.deleteNCR(params.id, tenantId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete NCR" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "NCR deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting NCR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete NCR",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.ncr",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.ncr",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.ncr",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
