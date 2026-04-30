/**
 * Signature Request Details API
 * GET /api/v1/signatures/requests/[id] - Get request details
 * POST /api/v1/signatures/requests/[id]/decline - Decline signature request
 */

import { NextRequest, NextResponse } from "next/server";
import { workflowService } from "@/lib/services/digital-signature";
import {
  withSignatureAPIWithParams,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";
import { NotFoundError } from "@/lib/services/digital-signature/errorHandler";

export const GET = withSignatureAPIWithParams(
  async (
    request: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: { id: string } },
  ) => {
    const requestId = params.id;
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("token"); // For public access

    // Get request by ID or access token
    const signatureRequest = accessToken
      ? workflowService.getRequestByToken(accessToken)
      : workflowService.getRequest(requestId);

    if (!signatureRequest) {
      throw new NotFoundError("Signature request", requestId);
    }

    // Mark as viewed if accessed via token
    if (
      accessToken &&
      (signatureRequest.status === "pending" ||
        signatureRequest.status === "sent")
    ) {
      await workflowService.markRequestAsViewed(signatureRequest.id);
    }

    return NextResponse.json({
      success: true,
      data: signatureRequest,
    });
  },
  {
    requireAuth: false, // Public via token
    rateLimit: true,
  },
);

export const POST = withSignatureAPIWithParams(
  async (
    request: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: { id: string } },
  ) => {
    const requestId = params.id;
    const body = await request.json();
    const action = body.action; // 'decline'

    const signatureRequest = workflowService.getRequest(requestId);
    if (!signatureRequest) {
      throw new NotFoundError("Signature request", requestId);
    }

    if (action === "decline") {
      signatureRequest.status = "declined";
      signatureRequest.declineReason = body.reason || "Declined by signer";

      return NextResponse.json({
        success: true,
        message: "Signature request declined",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  },
  {
    requireAuth: false, // Public via token
    rateLimit: true,
  },
);
