/**
 * Intelligent Search API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { intelligentSearchService } from "@/lib/services/marketplace/intelligentSearchService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { query, filters } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const result = await intelligentSearchService.search({
      query,
      filters: filters || {},
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Intelligent search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform search" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.intelligent-search",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
