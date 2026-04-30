/**
 * Bulk Approve MSDS API
 * Approve multiple MSDS documents at once
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsDomainService } from "@/lib/services/chemical/msdsDomainService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { msdsIds, comments } = body;

    if (!msdsIds || !Array.isArray(msdsIds) || msdsIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "MSDS IDs array is required" },
        { status: 400 },
      );
    }

    const result = await msdsDomainService.bulkApprove({
      tenantId: context.tenantId,
      actor: { userId: context.userId, roles: context.permissions || [] },
      msdsIds,
      comments,
    });

    return NextResponse.json({
      success: true,
      result: {
        successful: result.successful.length,
        failed: result.failed.length,
        total: msdsIds.length,
        details: {
          successful: result.successful,
          failed: result.failed,
        },
      },
    });
  } catch (error) {
    console.error("Bulk approve error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to bulk approve",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.bulk-approve",
  action: "approve",
  requireAuth: true,
  rateLimit: true,
});
