/**
 * ISO-IMS Training by ID API Route
 * Handles single Training operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { trainingService } from "@/lib/services/iso-ims/trainingService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const updateTrainingSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z
    .enum([
      "PLANNED",
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "POSTPONED",
    ])
    .optional(),
  scheduledDate: z
    .string()
    .or(z.date())
    .transform((val) => (val ? new Date(val) : undefined))
    .optional(),
  startDate: z
    .string()
    .or(z.date())
    .transform((val) => (val ? new Date(val) : undefined))
    .optional(),
  endDate: z
    .string()
    .or(z.date())
    .transform((val) => (val ? new Date(val) : undefined))
    .optional(),
  content: z.string().optional(),
  materials: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
});

// GET - Get Training by ID
async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;
    const training = await trainingService.getTraining(params.id, tenantId);

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: training,
    });
  } catch (error) {
    console.error("Error fetching Training:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch Training",
      },
      { status: 500 },
    );
  }
}

// PUT - Update Training
async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId;

    const body = await request.json();
    const validatedData = updateTrainingSchema.safeParse(body);

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

    const updated = await trainingService.updateTraining(
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
    console.error("Error updating Training:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update Training",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete Training
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId;

    // Note: Training deletion implemented as cancellation
    const result = await trainingService.updateTraining(
      params.id,
      { status: "CANCELLED" as any },
      tenantId,
      userId,
    );

    return NextResponse.json({
      success: true,
      message: "Training cancelled successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error deleting Training:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete Training",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.training",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.training",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.training",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
