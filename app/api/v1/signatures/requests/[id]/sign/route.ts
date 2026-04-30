/**
 * Sign Document API - Public endpoint for signing documents
 * POST /api/v1/signatures/requests/[id]/sign
 */

import { NextRequest, NextResponse } from "next/server";
import {
  workflowService,
  signatureService,
} from "@/lib/services/digital-signature";
import { SignDocumentRequest } from "@/types/digital-signature";
import {
  validateSignatureType,
  sanitizeInput,
} from "@/lib/services/digital-signature/validation";
import { NotFoundError } from "@/lib/services/digital-signature/errorHandler";
import {
  withSignatureAPIWithParams,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";

export const POST = withSignatureAPIWithParams(
  async (
    request: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: { id: string } },
  ) => {
    const requestId = params.id;
    const body: SignDocumentRequest = await request.json();

    // Validate signature type
    if (body.signatureType && !validateSignatureType(body.signatureType)) {
      return NextResponse.json(
        { success: false, error: "Invalid signature type" },
        { status: 400 },
      );
    }

    // Get signature request
    const signatureRequest = workflowService.getRequest(requestId);
    if (!signatureRequest) {
      throw new NotFoundError("Signature request", requestId);
    }

    // Check if already signed
    if (signatureRequest.status === "signed") {
      return NextResponse.json(
        { success: false, error: "Document already signed" },
        { status: 400 },
      );
    }

    // Verify OTP if required
    if (
      signatureRequest.authenticationMethod === "sms" ||
      signatureRequest.authenticationMethod === "whatsapp"
    ) {
      if (!body.otpCode || body.otpCode !== signatureRequest.otpCode) {
        return NextResponse.json(
          { success: false, error: "Invalid OTP code" },
          { status: 401 },
        );
      }
    }

    // Get workflow to find document ID
    const workflow = workflowService.getWorkflow(signatureRequest.workflowId);
    if (!workflow) {
      throw new NotFoundError("Workflow", signatureRequest.workflowId);
    }

    // Sanitize signing reason
    const signingReason = body.signingReason
      ? sanitizeInput(body.signingReason)
      : undefined;

    // Create signature
    const signature = await signatureService.signDocument({
      documentId: workflow.documentId,
      signatureRequestId: requestId,
      certificateId:
        body.signatureType === "advanced_electronic" ? undefined : undefined, // TODO: Get certificate
      signatureType: body.signatureType || "simple_electronic",
      visualSignature: body.visualSignature
        ? Buffer.from(body.visualSignature, "base64")
        : undefined,
      signingReason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    // Complete request
    await workflowService.completeRequest(requestId, signature.id);

    return NextResponse.json({
      success: true,
      data: {
        signatureId: signature.id,
        documentId: signature.documentId,
        signedAt: signature.createdAt,
      },
    });
  },
  {
    requireAuth: false, // Public via access token
    rateLimit: true,
    maxRequests: 10,
  },
);
