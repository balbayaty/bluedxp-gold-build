/**
 * ISO-IMS Risk by ID API Route
 * Handles single Risk operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { riskService } from "@/lib/services/iso-ims/riskService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const updateRiskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z
    .enum(["IDENTIFIED", "ASSESSED", "TREATED", "MONITORED", "CLOSED"])
    .optional(),
  likelihood: z
    .number()
    .min(1)
    .max(5)
    .transform((val) => val as 1 | 2 | 3 | 4 | 5)
    .optional(),
  impact: z
    .number()
    .min(1)
    .max(5)
    .transform((val) => val as 1 | 2 | 3 | 4 | 5)
    .optional(),
  treatmentStrategy: z
    .enum(["AVOID", "MITIGATE", "TRANSFER", "ACCEPT"])
    .optional(),
  treatmentPlan: z.string().optional(),
  treatmentActions: z
    .array(
      z.object({
        action: z.string(),
        responsible: z.string(),
        dueDate: z
          .string()
          .or(z.date())
          .transform((val) => new Date(val)),
        status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "OVERDUE"]),
      }),
    )
    .optional(),
  assignedTo: z.string().optional(),
});

// GET - Get Risk by ID
async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;
    const risk = await riskService.getRisk(params.id, tenantId);

    if (!risk) {
      return NextResponse.json(
        { success: false, error: "Risk not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: risk,
    });
  } catch (error) {
    console.error("Error fetching Risk:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch Risk",
      },
      { status: 500 },
    );
  }
}

// PUT - Update Risk
async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId;

    const body = await request.json();
    const validatedData = updateRiskSchema.safeParse(body);

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

    const updated = await riskService.updateRisk(
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
    console.error("Error updating Risk:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update Risk",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete Risk
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;
    await riskService.deleteRisk(params.id, tenantId);

    return NextResponse.json({
      success: true,
      message: "Risk deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Risk:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete Risk",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.risk",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.risk",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.risk",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
