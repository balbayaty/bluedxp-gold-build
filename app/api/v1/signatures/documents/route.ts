/**
 * Documents API - Upload and manage documents
 * POST /api/v1/signatures/documents - Upload document
 * GET /api/v1/signatures/documents - List documents
 */

import { NextRequest, NextResponse } from "next/server";
import { documentService } from "@/lib/services/digital-signature";
import {
  validateFile,
  validateDocumentType,
  sanitizeInput,
} from "@/lib/services/digital-signature/validation";
import { handleError } from "@/lib/services/digital-signature/errorHandler";
import {
  withSignatureAPI,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";

export const POST = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const title = formData.get("title") as string;
    const titleAr = formData.get("titleAr") as string | null;
    const organizationId =
      (formData.get("organizationId") as string) ||
      context.organizationId ||
      "default-org";
    const createdByUserId =
      (formData.get("createdByUserId") as string) ||
      context.userId ||
      "current-user";

    // Validate file
    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 },
      );
    }

    const fileValidation = validateFile(file, 50); // 50MB max
    if (!fileValidation.valid) {
      return NextResponse.json(
        { success: false, error: fileValidation.error },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!documentType || !title) {
      return NextResponse.json(
        { success: false, error: "documentType and title are required" },
        { status: 400 },
      );
    }

    // Validate document type
    if (!validateDocumentType(documentType)) {
      return NextResponse.json(
        { success: false, error: "Invalid document type" },
        { status: 400 },
      );
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedTitleAr = titleAr ? sanitizeInput(titleAr) : undefined;

    const document = await documentService.uploadDocument(file, {
      organizationId,
      createdByUserId,
      documentType,
      title: sanitizedTitle,
      titleAr: sanitizedTitleAr,
    });

    return NextResponse.json({
      success: true,
      data: document,
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
    maxRequests: 50,
  },
);

export const GET = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const { searchParams } = new URL(request.url);
    const organizationId =
      searchParams.get("organizationId") ||
      context.organizationId ||
      "default-org";

    const documents = documentService.getOrganizationDocuments(organizationId);

    return NextResponse.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
  },
);
