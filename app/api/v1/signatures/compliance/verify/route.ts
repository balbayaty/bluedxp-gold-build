/**
 * Compliance Verification API
 * GET /api/v1/signatures/compliance/verify - Verify compliance
 */

import { NextRequest, NextResponse } from "next/server";
import { complianceService } from "@/lib/services/digital-signature";
import {
  signatureService,
  documentService,
} from "@/lib/services/digital-signature";
import {
  withSignatureAPI,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";

export const GET = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const { searchParams } = new URL(request.url);
    const signatureId = searchParams.get("signatureId");
    const documentId = searchParams.get("documentId");

    if (!signatureId && !documentId) {
      return NextResponse.json(
        { success: false, error: "signatureId or documentId is required" },
        { status: 400 },
      );
    }

    let complianceResult;

    if (signatureId) {
      const signature = signatureService.getSignature(signatureId);
      if (!signature) {
        return NextResponse.json(
          { success: false, error: "Signature not found" },
          { status: 404 },
        );
      }

      complianceResult =
        await complianceService.checkSignatureCompliance(signature);

      // Also check court admissibility
      const admissibility =
        await complianceService.verifyCourtAdmissibility(signature);

      return NextResponse.json({
        success: true,
        data: {
          compliance: complianceResult,
          admissibility,
        },
      });
    } else if (documentId) {
      const document = documentService.getDocument(documentId);
      if (!document) {
        return NextResponse.json(
          { success: false, error: "Document not found" },
          { status: 404 },
        );
      }

      complianceResult =
        await complianceService.checkDocumentCompliance(document);

      return NextResponse.json({
        success: true,
        data: {
          compliance: complianceResult,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  },
  {
    requireAuth: true,
    rateLimit: true,
  },
);
