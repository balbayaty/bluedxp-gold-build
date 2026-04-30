/**
 * AI Matching API Routes
 * Handles service matching requests
 */

import { NextRequest, NextResponse } from "next/server";
import { aiMatchingService } from "@/lib/services/marketplace/aiMatchingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { requirement } = body;

    if (!requirement) {
      return NextResponse.json(
        { error: "Requirement is required" },
        { status: 400 },
      );
    }

    const result = await aiMatchingService.findMatches(requirement);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Matching error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to find matches" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requirementId = searchParams.get("requirementId");

    if (!requirementId) {
      return NextResponse.json(
        { error: "Requirement ID is required" },
        { status: 400 },
      );
    }

    const completeness =
      await aiMatchingService.assessCompleteness(requirementId);
    return NextResponse.json(completeness);
  } catch (error: any) {
    console.error("Completeness assessment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assess completeness" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.ai-matching",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.ai-matching",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
