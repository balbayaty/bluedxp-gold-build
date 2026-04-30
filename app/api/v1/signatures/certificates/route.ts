/**
 * Certificates API - Certificate management
 * GET /api/v1/signatures/certificates - List certificates
 * POST /api/v1/signatures/certificates - Request certificate
 */

import { NextRequest, NextResponse } from "next/server";
import { pkiService } from "@/lib/services/digital-signature";
import {
  withSignatureAPI,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";
import { validateSubjectDN } from "@/lib/services/digital-signature/validation";

export const GET = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const { searchParams } = new URL(request.url);
    const userId =
      searchParams.get("userId") || context.userId || "current-user";

    const certificates = pkiService.getUserCertificates(userId);

    return NextResponse.json({
      success: true,
      data: certificates,
      count: certificates.length,
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
  },
);

export const POST = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const body = await request.json();
    const { userId, subjectDN, certificateType, validityYears, keySize } = body;

    if (!subjectDN) {
      return NextResponse.json(
        { success: false, error: "subjectDN is required" },
        { status: 400 },
      );
    }

    if (!validateSubjectDN(subjectDN)) {
      return NextResponse.json(
        { success: false, error: "Invalid subjectDN format" },
        { status: 400 },
      );
    }

    const certificate = await pkiService.issueUserCertificate({
      userId: userId || context.userId || "current-user",
      subjectDN,
      certificateType: certificateType || "signing",
      validityYears: validityYears || 2,
      keySize: keySize || 2048,
    });

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
    maxRequests: 5,
  },
);
