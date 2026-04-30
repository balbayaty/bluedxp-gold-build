/**
 * MSDS Comparison API
 * Compare two MSDS documents and identify differences
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsDomainService } from "@/lib/services/chemical/msdsDomainService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { msds1Id, msds2Id } = body;

    if (!msds1Id || !msds2Id) {
      return NextResponse.json(
        { success: false, error: "Both MSDS IDs are required" },
        { status: 400 },
      );
    }

    const comparison = await msdsDomainService.compare({
      tenantId: context.tenantId,
      msds1Id,
      msds2Id,
    });

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error: any) {
    console.error("Error comparing MSDS:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compare MSDS" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.compare",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
