/**
 * Documents API
 * POST: Upload document
 * GET: List documents
 */

import { NextRequest, NextResponse } from "next/server";
import { documentService } from "@/lib/services/customs/documentService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const declarationId = formData.get("declarationId") as string;
    const type = formData.get("type") as string;

    if (!file || !declarationId) {
      return NextResponse.json(
        { success: false, error: "File and declarationId are required" },
        { status: 400 },
      );
    }

    // Convert File to Buffer for document service
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload document
    const document = await documentService.uploadDocument({
      declarationId,
      type: type as any,
      name: file.name,
      file: buffer,
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const declarationId = searchParams.get("declarationId");

    if (!declarationId) {
      return NextResponse.json(
        { success: false, error: "declarationId is required" },
        { status: 400 },
      );
    }

    const documents = documentService.getDocumentsForDeclaration(declarationId);

    return NextResponse.json({
      success: true,
      documents: documents || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
