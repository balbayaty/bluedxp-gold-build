/**
 * Chemical Intelligence - Alternatives API
 * Find safer alternatives to chemicals
 */

import { NextRequest, NextResponse } from "next/server";
import { intelligentChemicalService } from "@/lib/services/chemical/intelligentChemicalService";
import { chemicalService } from "@/lib/services/chemical/chemicalService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { chemicalId } = body;

    if (!chemicalId) {
      return NextResponse.json(
        { success: false, error: "Chemical ID is required" },
        { status: 400 },
      );
    }

    // Get chemical
    const chemical = await chemicalService.getChemicalById(chemicalId);
    if (!chemical) {
      return NextResponse.json(
        { success: false, error: "Chemical not found" },
        { status: 404 },
      );
    }

    // Find alternatives
    const alternatives =
      await intelligentChemicalService.findAlternatives(chemical);

    return NextResponse.json({
      success: true,
      alternatives,
      count: alternatives.length,
    });
  } catch (error: any) {
    console.error("Error finding alternatives:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to find alternatives" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.intelligence.alternatives",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
