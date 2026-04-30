/**
 * Approve MSDS-SKU Link API
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

    const link = await msdsSkuLinkingService.approveLink(params.id, tenantId, {
      approvedBy: userId,
      approvalLevel: body.approvalLevel,
      conditions: body.conditions,
      notes: body.notes,
    });

    return NextResponse.json(
      {
        success: true,
        data: link,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error approving link:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to approve link",
      },
      { status: 500 },
    );
  }
}
