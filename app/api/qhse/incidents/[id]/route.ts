/**
 * QHSE Incident by ID API Route
 * Handles single incident operations
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseIncidentService } from "@/lib/services/qhse";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// GET - Get incident by ID
async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const incident = await qhseIncidentService.getIncident(params.id);

    if (!incident) {
      return NextResponse.json(
        { success: false, error: "Incident not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    console.error("Error fetching incident:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch incident",
      },
      { status: 500 },
    );
  }
}

// PUT - Update incident
async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    const updated = await qhseIncidentService.updateIncident(params.id, {
      ...body,
      updatedBy: body.updatedBy,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating incident:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update incident",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete incident
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    await qhseIncidentService.deleteIncident(params.id);

    return NextResponse.json({
      success: true,
      message: "Incident deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting incident:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete incident",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.incidents",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "qhse",
  featureId: "qhse.incidents",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "qhse",
  featureId: "qhse.incidents",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
