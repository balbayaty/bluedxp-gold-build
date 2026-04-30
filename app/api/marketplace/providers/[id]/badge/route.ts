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
    const badge = await providerVerificationService.getVerificationBadge(id);

    return NextResponse.json({
      success: true,
      data: badge,
    });
  } catch (error: any) {
    console.error("Failed to get verification badge:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get verification badge",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.providers.badge",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
