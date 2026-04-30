/**
 * QHSE Custom Field API (by ID)
 * Update or delete a specific custom field
 */

import { NextRequest, NextResponse } from "next/server";
import { customFieldService } from "@/lib/services/qhse/custom-fields/customFieldService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// PATCH - Update custom field
async function patchHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const field = await customFieldService.updateCustomField(params.id, body);

    return NextResponse.json({
      success: true,
      data: field,
    });
  } catch (error: any) {
    console.error("Error updating custom field:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update custom field",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete custom field
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    await customFieldService.deleteCustomField(params.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error deleting custom field:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete custom field",
      },
      { status: 500 },
    );
  }
}

export const PATCH = withAPIGateway(patchHandler, {
  moduleId: "qhse",
  featureId: "qhse.custom-fields",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "qhse",
  featureId: "qhse.custom-fields",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
