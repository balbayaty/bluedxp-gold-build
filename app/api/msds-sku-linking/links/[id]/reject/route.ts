/**
 * Reject MSDS-SKU Link API
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsSkuLinkingService } from "@/lib/services/msds-sku-linking/msdsSkuLinkingService";
import { requireAuth } from "../../../_auth";
import { getMsdsSkuLinkingRbac } from "@/lib/services/msds-sku-linking/rbac";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const rbac = getMsdsSkuLinkingRbac();
    const authRes = await requireAuth(request, { anyRole: rbac.approverRoles });
    if (!authRes.ok) return authRes.response;
    const { tenantId, userId } = authRes.auth;

    const body = await request.json();

    if (!body.rejectionReason) {
      return NextResponse.json(
        {
          success: false,
          error: "Rejection reason is required",
        },
        { status: 400 },
      );
    }

    const link = await msdsSkuLinkingService.rejectLink(params.id, tenantId, {
      rejectedBy: userId,
      rejectionReason: body.rejectionReason,
    });

    return NextResponse.json(
      {
        success: true,
        data: link,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error rejecting link:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reject link",
      },
      { status: 500 },
    );
  }
}
