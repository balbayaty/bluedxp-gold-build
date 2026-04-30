/**
 * ISO-IMS CAPA by ID API Route
 * Handles single CAPA operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { capaService } from "@/lib/services/iso-ims/capaService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const updateCAPASchema = z.object({
  subject: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z
    .enum([
      "DRAFT",
      "OPEN",
      "IN_PROGRESS",
      "UNDER_REVIEW",
      "AWAITING_APPROVAL",
      "APPROVED",
      "IMPLEMENTED",
      "EFFECTIVENESS_REVIEW",
      "COMPLETED",
      "CLOSED",
      "CANCELLED",
    ])
    .optional(),
  assignedTo: z.string().optional(),
  department: z.string().optional(),
  owner: z.string().optional(),
  targetDate: z
    .string()
    .or(z.date())
    .transform((val) => (val ? new Date(val) : undefined))
    .optional(),
  rootCause: z.string().optional(),
  actionPlan: z.string().optional(),
  resourcesRequired: z.string().optional(),
  estimatedCost: z.number().optional(),
  updatedBy: z.string().min(1, "Updated by is required"),
});

// GET - Get CAPA by ID
async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;
    const capa = await capaService.getCAPA(params.id, tenantId);

    if (!capa) {
      return NextResponse.json(
        { success: false, error: "CAPA not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: capa,
    });
  } catch (error) {
    console.error("Error fetching CAPA:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch CAPA",
      },
      { status: 500 },
    );
  }
}

// PUT - Update CAPA
async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;
    const body = await request.json();

    // Override updatedBy from auth context for security
    body.updatedBy = context.userId;

    const validatedData = updateCAPASchema.safeParse(body);

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

    const updated = await capaService.updateCAPA(
      params.id,
      validatedData.data,
      tenantId,
      validatedData.data.updatedBy,
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating CAPA:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update CAPA",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete CAPA
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;
    await capaService.deleteCAPA(params.id, tenantId);

    return NextResponse.json({
      success: true,
      message: "CAPA deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting CAPA:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete CAPA",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.capa",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.capa",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.capa",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
