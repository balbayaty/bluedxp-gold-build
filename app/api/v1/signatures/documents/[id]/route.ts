/**
 * Document Details API
 * GET /api/v1/signatures/documents/[id] - Get document details
 * GET /api/v1/signatures/documents/[id]/download - Download document
 * GET /api/v1/signatures/documents/[id]/download-signed - Download signed document
 */

import { NextRequest, NextResponse } from "next/server";
import { documentService } from "@/lib/services/digital-signature";
import {
  withSignatureAPIWithParams,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";
import { NotFoundError } from "@/lib/services/digital-signature/errorHandler";

export const GET = withSignatureAPIWithParams(
  async (
    request: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: { id: string } },
  ) => {
    const documentId = params.id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // 'download' or 'download-signed'

    const document = documentService.getDocument(documentId);
    if (!document) {
      throw new NotFoundError("Document", documentId);
    }

    if (action === "download") {
      const downloadUrl = await documentService.generateDownloadUrl(
        documentId,
        false,
      );
      return NextResponse.json({
        success: true,
        data: {
          downloadUrl,
          document,
        },
      });
    }

    if (action === "download-signed") {
      const downloadUrl = await documentService.generateDownloadUrl(
        documentId,
        true,
      );
      return NextResponse.json({
        success: true,
        data: {
          downloadUrl,
          document,
        },
      });
    }

    // Return document details
    return NextResponse.json({
      success: true,
      data: document,
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
  },
);
