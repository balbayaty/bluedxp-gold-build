/**
 * Nafath Status API
 * GET /api/v1/signatures/nafath/status/[transactionId]
 */

import { NextRequest, NextResponse } from "next/server";
import { nafathService } from "@/lib/services/digital-signature";
import {
  withSignatureAPIWithParams,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";

export const GET = withSignatureAPIWithParams(
  async (
    request: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: { transactionId: string } },
  ) => {
    const transactionId = params.transactionId;

    const session = await nafathService.checkVerificationStatus(transactionId);

    return NextResponse.json({
      success: true,
      data: {
        status: session.status,
        completedAt: session.completedAt,
        errorMessage: session.errorMessage,
      },
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
    maxRequests: 60,
  },
);
