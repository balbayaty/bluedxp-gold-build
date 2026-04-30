/**
 * emdha Status API
 * GET /api/v1/signatures/emdha/status/[sessionId]
 */

import { NextRequest, NextResponse } from "next/server";
import { emdhaService } from "@/lib/services/digital-signature";
import {
  withSignatureAPIWithParams,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";

export const GET = withSignatureAPIWithParams(
  async (
    request: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: { sessionId: string } },
  ) => {
    const sessionId = params.sessionId;

    const session = await emdhaService.checkSigningStatus(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        status: session.status,
        completedAt: session.completedAt,
        signerCertificatePEM: session.signerCertificatePEM,
        signatureValue: session.signatureValue,
      },
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
    maxRequests: 60,
  },
);
