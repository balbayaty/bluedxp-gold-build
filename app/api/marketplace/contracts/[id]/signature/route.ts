/**
 * Marketplace Contract Signature API
 * POST - Initiate signature workflow
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceContractService } from "@/lib/services/marketplace/contracts/marketplaceContractService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "initiate") {
      const contract = await marketplaceContractService.initiateSignature(
        params.id,
      );
      return NextResponse.json({
        success: true,
        data: contract,
      });
    }

    if (action === "record") {
      const { signatureId, signerId } = body;
      if (!signatureId || !signerId) {
        return NextResponse.json(
          { success: false, error: "signatureId and signerId are required" },
          { status: 400 },
        );
      }

      const contract = await marketplaceContractService.recordSignature(
        params.id,
        signatureId,
        signerId,
      );
      return NextResponse.json({
        success: true,
        data: contract,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "initiate" or "record"' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Failed to process signature:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process signature" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.contracts.signature",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
