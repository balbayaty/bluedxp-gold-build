/**
 * QR Semantic Search API
 * Intelligent QR code search using knowledge base
 */

import { NextRequest, NextResponse } from "next/server";
import { qrSemanticSearchService } from "@/lib/services/qr/qrSemanticSearchService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { query, options, context: searchContext } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 },
      );
    }

    let results: any[];

    if (searchContext) {
      // Context-aware search
      results = await qrSemanticSearchService.contextAwareSearch(
        query,
        searchContext,
      );
    } else {
      // Standard semantic search
      results = await qrSemanticSearchService.searchQRs(query, options);
    }

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error: any) {
    console.error("Error in QR semantic search:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const qrId = searchParams.get("qrId");
    const tenantId = searchParams.get("tenantId");

    if (qrId) {
      // Find similar QR codes
      const similar = await qrSemanticSearchService.findSimilarQRs(qrId, 10);
      return NextResponse.json({
        success: true,
        similar,
        count: similar.length,
      });
    }

    if (query) {
      // Semantic search
      const results = await qrSemanticSearchService.searchQRs(query, {
        tenantId: tenantId || undefined,
      });
      return NextResponse.json({
        success: true,
        results,
        count: results.length,
      });
    }

    return NextResponse.json(
      { success: false, error: "Query or qrId is required" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR semantic search:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.search",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.search",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
