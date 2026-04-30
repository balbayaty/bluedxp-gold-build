/**
 * Find Matches API
 * Find potential SKU matches for an MSDS
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsSkuLinkingService } from "@/lib/services/msds-sku-linking/msdsSkuLinkingService";
import { msdsStorageService } from "@/lib/services/chemical/msdsStorage";
import { skuService } from "@/lib/services/wms/skuService";
import { requireAuth } from "../_auth";
import { getMsdsSkuLinkingRbac } from "@/lib/services/msds-sku-linking/rbac";

export async function POST(request: NextRequest) {
  try {
    const rbac = getMsdsSkuLinkingRbac();
    const authRes = await requireAuth(request, {
      anyRole: rbac.readerRoles,
    });
    if (!authRes.ok) return authRes.response;
    const { tenantId } = authRes.auth;

    const body = await request.json();

    if (!body.msdsId || !body.customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "MSDS ID and Customer ID are required",
        },
        { status: 400 },
      );
    }

    // Get MSDS
    const entry = await msdsStorageService.getMSDS(body.msdsId, tenantId);
    if (!entry?.msds) {
      return NextResponse.json(
        {
          success: false,
          error: "MSDS not found",
        },
        { status: 404 },
      );
    }
    const msds = entry.msds;

    // Get SKUs for customer (if provided)
    let skus = [];
    if (body.skuIds && Array.isArray(body.skuIds)) {
      // Get specific SKUs
      for (const skuId of body.skuIds) {
        const sku = await skuService.getSKU(skuId);
        if (sku) skus.push(sku);
      }
    } else {
      // Get all SKUs for customer
      skus = await skuService.getSKUsByCustomer(body.customerId);
    }

    // Find matches
    const result = await msdsSkuLinkingService.findMatchesForMSDS(
      msds,
      body.customerId,
      skus,
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error finding matches:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to find matches",
      },
      { status: 500 },
    );
  }
}
