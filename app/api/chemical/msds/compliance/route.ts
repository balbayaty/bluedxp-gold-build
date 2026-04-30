/**
 * MSDS Compliance Check API
 * Check MSDS compliance with GHS and regulatory requirements
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsDomainService } from "@/lib/services/chemical/msdsDomainService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { msdsId } = body;

    if (!msdsId) {
      return NextResponse.json(
        { success: false, error: "MSDS ID is required" },
        { status: 400 },
      );
    }

    const compliance = await msdsDomainService.checkCompliance({
      tenantId: context.tenantId,
      msdsId,
    });

    return NextResponse.json({
      success: true,
      compliance,
    });
  } catch (error: any) {
    console.error("Error checking compliance:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check compliance" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.compliance",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
