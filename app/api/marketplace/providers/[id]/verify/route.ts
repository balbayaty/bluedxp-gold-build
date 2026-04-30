import { NextRequest, NextResponse } from "next/server";
import { providerVerificationService } from "@/lib/services/marketplace/providerVerificationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const verification = await providerVerificationService.getVerification(id);

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "Verification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: verification,
    });
  } catch (error: any) {
    console.error("Failed to get verification:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get verification" },
      { status: 500 },
    );
  }
}

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "initiate") {
      const verification =
        await providerVerificationService.initiateVerification(id);
      return NextResponse.json({
        success: true,
        data: verification,
      });
    }

    if (action === "add-document") {
      const document = await providerVerificationService.addDocument(id, data);
      return NextResponse.json({
        success: true,
        data: document,
      });
    }

    if (action === "add-check") {
      const check = await providerVerificationService.addCheck(id, data);
      return NextResponse.json({
        success: true,
        data: check,
      });
    }

    if (action === "update-status") {
      const { status, verifiedBy, rejectionReason } = data;
      const verification =
        await providerVerificationService.updateVerificationStatus(
          id,
          status,
          verifiedBy,
          rejectionReason,
        );
      return NextResponse.json({
        success: true,
        data: verification,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Failed to process verification action:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process verification action",
      },
      { status: 500 },
    );
  }
}
