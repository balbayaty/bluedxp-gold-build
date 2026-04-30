/**
 * QHSE Document Template API (by ID)
 * Update, delete, or use a specific template
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseDocumentTemplateService } from "@/lib/services/qhse/templates/qhseDocumentTemplateService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// GET - Get template by ID
async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const template = await qhseDocumentTemplateService.getTemplate(params.id);

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch template" },
      { status: 500 },
    );
  }
}

// PATCH - Update template
async function patchHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const template = await qhseDocumentTemplateService.updateTemplate(
      params.id,
      body,
    );

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update template" },
      { status: 500 },
    );
  }
}

// DELETE - Delete template
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    await qhseDocumentTemplateService.deleteTemplate(params.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete template" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.templates",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PATCH = withAPIGateway(patchHandler, {
  moduleId: "qhse",
  featureId: "qhse.templates",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "qhse",
  featureId: "qhse.templates",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
