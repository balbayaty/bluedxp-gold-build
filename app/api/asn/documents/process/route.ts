/**
 * Document Processing API
 */

import { NextRequest, NextResponse } from "next/server";
import { getDocumentProcessingService } from "@/lib/services/asn";
import { authenticate } from "@/lib/auth";
import { validateTenant } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    await validateTenant(user.tenantId);

    const body = await req.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    const docService = getDocumentProcessingService();
    const result = await docService.processDocument(documentId, user.tenantId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Document processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process document" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticate(req);
    await validateTenant(user.tenantId);

    const body = await req.json();
    const { ediContent, format } = body;

    if (!ediContent || !format) {
      return NextResponse.json(
        { error: "EDI content and format are required" },
        { status: 400 },
      );
    }

    const docService = getDocumentProcessingService();
    const result = await docService.parseEDI(ediContent, format);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("EDI parsing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse EDI" },
      { status: 500 },
    );
  }
}
