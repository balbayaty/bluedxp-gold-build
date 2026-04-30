/**
 * Bulk Reject MSDS API
 * Reject multiple MSDS documents at once
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsDomainService } from "@/lib/services/chemical/msdsDomainService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { msdsIds, reason } = body;

    if (!msdsIds || !Array.isArray(msdsIds) || msdsIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "MSDS IDs array is required" },
        { status: 400 },
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: "Rejection reason is required" },
        { status: 400 },
      );
    }

    const result = await msdsDomainService.bulkReject({
      tenantId: context.tenantId,
      actor: { userId: context.userId, roles: context.permissions || [] },
      msdsIds,
      reason,
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
    console.error("Bulk reject error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to bulk reject",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.bulk-reject",
  action: "approve",
  requireAuth: true,
  rateLimit: true,
});
