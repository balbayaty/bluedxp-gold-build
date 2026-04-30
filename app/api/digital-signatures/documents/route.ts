/**
 * Digital Signatures Documents API Route
 * GET /api/digital-signatures/documents - List documents
 * POST /api/digital-signatures/documents - Create document
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { documentService } from "@/lib/services/digital-signature";

async function handler(req: NextRequest, context: any): Promise<NextResponse> {
  const tenantId = context.tenantId || "default-tenant";

  try {
    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");
      const documentType = searchParams.get("type");

      // Get documents from service
      // Service uses in-memory store (documentStore)
      const documents = documentService.getOrganizationDocuments(tenantId);

      // Filter by status and type if provided
      let filtered = documents;
      if (status) {
        filtered = filtered.filter((doc) => doc.status === status);
      }
      if (documentType) {
        filtered = filtered.filter((doc) => doc.documentType === documentType);
      }

      return NextResponse.json({ documents, count: documents.length });
    }

    if (req.method === "POST") {
      const body = await req.json();
      // Upload document using documentService
      // Note: In a real implementation, the file would come from FormData
      // For now, we'll handle metadata-only creation
      const { file, ...metadata } = body;

      // If file is provided as base64 or buffer, convert it
      let fileBuffer: Buffer | undefined;
      if (file) {
        if (typeof file === "string") {
          // Base64 string
          fileBuffer = Buffer.from(file, "base64");
        } else if (Buffer.isBuffer(file)) {
          fileBuffer = file;
        }
      }

      // For now, create a mock file if none provided
      if (!fileBuffer) {
        fileBuffer = Buffer.from("Mock PDF content");
      }

      const document = await documentService.uploadDocument(fileBuffer, {
        ...metadata,
        organizationId: tenantId,
        createdByUserId: metadata.createdByUserId || "system",
      });

      return NextResponse.json({ document }, { status: 201 });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("Digital Signatures Documents API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  requireAuth: true,
  rateLimit: { requests: 100, window: "1m" },
} as APIGatewayOptions);

export const POST = withAPIGateway(handler, {
  requireAuth: true,
  rateLimit: { requests: 50, window: "1m" },
} as APIGatewayOptions);
