/**
 * ISO-IMS Document by ID API Route
 * Handles single Document operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { documentService } from "@/lib/services/iso-ims/documentService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const updateDocumentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  status: z
    .enum(["DRAFT", "UNDER_REVIEW", "APPROVED", "OBSOLETE", "ARCHIVED"])
    .optional(),
  owner: z.string().optional(),
  reviewer: z.string().optional(),
  approver: z.string().optional(),
  nextReviewDate: z
    .string()
    .or(z.date())
    .transform((val) => (val ? new Date(val) : undefined))
    .optional(),
  isoStandards: z.array(z.string()).optional(),
  clauses: z.array(z.string()).optional(),
});

// GET - Get Document by ID
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

    const document = await documentService.getDocument(params.id, tenantId);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error fetching Document:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch Document",
      },
      { status: 500 },
    );
  }
}

// PUT - Update Document
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
    const validatedData = updateDocumentSchema.safeParse(body);

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

    const updated = await documentService.updateDocument(
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
    console.error("Error updating Document:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update Document",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete Document
async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const tenantId = context.tenantId;

    await documentService.deleteDocument(params.id, tenantId);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Document:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete Document",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.documents",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.documents",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.documents",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
