/**
 * Bulk Link Operations API
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsSkuLinkingService } from "@/lib/services/msds-sku-linking/msdsSkuLinkingService";
import { BulkLinkRequest } from "@/types/msdsSkuLinking";
import { requireAuth } from "../_auth";
import { getMsdsSkuLinkingRbac } from "@/lib/services/msds-sku-linking/rbac";

export async function POST(request: NextRequest) {
  try {
    const rbac = getMsdsSkuLinkingRbac();
    const authRes = await requireAuth(request, {
      anyRole: rbac.writerRoles,
    });
    if (!authRes.ok) return authRes.response;
    const { tenantId, userId } = authRes.auth;

    const body: BulkLinkRequest = await request.json();

    if (!body.customerId || !body.links || body.links.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer ID and at least one link are required",
        },
        { status: 400 },
      );
    }

    // Validate links
    for (const link of body.links) {
      if (!link.msdsId || !link.skuIds || link.skuIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Each link must have MSDS ID and at least one SKU ID",
          },
          { status: 400 },
        );
      }
    }

    // Create bulk links
    const result = await msdsSkuLinkingService.bulkCreateLinks(
      tenantId,
      body,
      userId,
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating bulk links:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create bulk links",
      },
      { status: 500 },
    );
  }
}
