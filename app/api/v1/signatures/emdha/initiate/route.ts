/**
 * emdha Initiation API
 * POST /api/v1/signatures/emdha/initiate
 */

import { NextRequest, NextResponse } from "next/server";
import { emdhaService } from "@/lib/services/digital-signature";
import {
  withSignatureAPI,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";
import {
  validateNationalID,
  validateUUID,
} from "@/lib/services/digital-signature/validation";

export const POST = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const body = await request.json();
    const { documentId, userId, nationalId } = body;

    if (!documentId || !nationalId) {
      return NextResponse.json(
        { success: false, error: "documentId and nationalId are required" },
        { status: 400 },
      );
    }

    if (!validateUUID(documentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid documentId format" },
        { status: 400 },
      );
    }

    if (!validateNationalID(nationalId)) {
      return NextResponse.json(
        { success: false, error: "Invalid national ID format" },
        { status: 400 },
      );
    }

    const session = await emdhaService.initiateQESSigning({
      documentId,
      userId: userId || context.userId || "current-user",
      nationalId,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        transactionId: session.transactionId,
        signingUrl: session.signingUrl,
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
