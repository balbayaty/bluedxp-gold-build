/**
 * Nafath Initiation API
 * POST /api/v1/signatures/nafath/initiate
 */

import { NextRequest, NextResponse } from "next/server";
import { nafathService } from "@/lib/services/digital-signature";
import {
  withSignatureAPI,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";
import { validateNationalID } from "@/lib/services/digital-signature/validation";

export const POST = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const body = await request.json();
    const { nationalId, requestType } = body;

    if (!nationalId) {
      return NextResponse.json(
        { success: false, error: "nationalId is required" },
        { status: 400 },
      );
    }

    if (!validateNationalID(nationalId)) {
      return NextResponse.json(
        { success: false, error: "Invalid national ID format" },
        { status: 400 },
      );
    }

    const session = await nafathService.initiateVerification(
      nationalId,
      requestType || "signature",
    );

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        transactionId: session.transactionId,
        randomNumber: session.randomNumber,
        qrCode: session.responseData?.qrCode,
        expiresAt: session.expiresAt,
      },
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
    maxRequests: 20,
  },
);
