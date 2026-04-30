/**
 * Provider Verification API
 * KYC, document verification, background checks
 */

import { NextRequest, NextResponse } from "next/server";
import { providerVerificationService } from "@/lib/services/marketplace/providerVerificationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const verificationId = searchParams.get("verificationId");
    const providerId = searchParams.get("providerId");

    if (verificationId) {
      const verification =
        await providerVerificationService.getVerification(verificationId);
      if (!verification) {
        return NextResponse.json(
          { success: false, error: "Verification not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: verification });
    }

    if (providerId) {
      const verification =
        await providerVerificationService.getVerificationByProvider(providerId);
      if (!verification) {
        return NextResponse.json(
          { success: false, error: "Verification not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: verification });
    }

    return NextResponse.json(
      { success: false, error: "verificationId or providerId required" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Failed to get verification:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get verification" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      action,
      providerId,
      verificationId,
      document,
      kycData,
      backgroundData,
      level,
      badges,
    } = body;

    switch (action) {
      case "start":
        if (!providerId) {
          return NextResponse.json(
            { success: false, error: "providerId is required" },
            { status: 400 },
          );
        }
        const verification =
          await providerVerificationService.startVerification(providerId);
        return NextResponse.json({ success: true, data: verification });

      case "upload_document":
        if (!verificationId || !document) {
          return NextResponse.json(
            {
              success: false,
              error: "verificationId and document are required",
            },
            { status: 400 },
          );
        }
        const uploadedDoc = await providerVerificationService.uploadDocument(
          verificationId,
          document,
        );
        return NextResponse.json({ success: true, data: uploadedDoc });

      case "run_kyc":
        if (!verificationId || !kycData) {
          return NextResponse.json(
            {
              success: false,
              error: "verificationId and kycData are required",
            },
            { status: 400 },
          );
        }
        const kycResult = await providerVerificationService.runKYCCheck(
          verificationId,
          kycData,
        );
        return NextResponse.json({ success: true, data: kycResult });

      case "run_background_check":
        if (!verificationId || !backgroundData) {
          return NextResponse.json(
            {
              success: false,
              error: "verificationId and backgroundData are required",
            },
            { status: 400 },
          );
        }
        const bgResult = await providerVerificationService.runBackgroundCheck(
          verificationId,
          backgroundData,
        );
        return NextResponse.json({ success: true, data: bgResult });

      case "approve":
        if (!verificationId || !level) {
          return NextResponse.json(
            { success: false, error: "verificationId and level are required" },
            { status: 400 },
          );
        }
        const approved = await providerVerificationService.approveVerification(
          verificationId,
          level,
          body.verifiedBy || "system",
          badges,
        );
        return NextResponse.json({ success: true, data: approved });

      case "reject":
        if (!verificationId || !body.reason) {
          return NextResponse.json(
            { success: false, error: "verificationId and reason are required" },
            { status: 400 },
          );
        }
        const rejected = await providerVerificationService.rejectVerification(
          verificationId,
          body.reason,
          body.rejectedBy || "system",
        );
        return NextResponse.json({ success: true, data: rejected });

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("Failed to process verification:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process verification",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.verification",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.verification",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
