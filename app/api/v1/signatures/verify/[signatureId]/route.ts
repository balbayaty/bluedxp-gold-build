/**
 * Signature Verification API
 * GET /api/v1/signatures/verify/[signatureId]
 */

import { NextRequest, NextResponse } from "next/server";
import { signatureService } from "@/lib/services/digital-signature";
import {
  withSignatureAPIWithParams,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";

export const GET = withSignatureAPIWithParams(
  async (
    request: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: { signatureId: string } },
  ) => {
    const signatureId = params.signatureId;

    if (!signatureId) {
      return NextResponse.json(
        { success: false, error: "signatureId is required" },
        { status: 400 },
      );
    }

    const verificationResult =
      await signatureService.verifySignature(signatureId);

    return NextResponse.json({
      success: true,
      data: verificationResult,
    });
  },
  {
    requireAuth: false, // Public verification
    rateLimit: true,
    maxRequests: 100,
  },
);
