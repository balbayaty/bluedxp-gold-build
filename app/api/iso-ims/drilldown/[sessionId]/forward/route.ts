/**
 * Navigate Forward API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { drillDownService } from "@/lib/services/iso-ims/drilldown/drillDownService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { sessionId: string } },
) {
  try {
    const level = await drillDownService.navigateForward(params.sessionId);

    if (!level) {
      return NextResponse.json(
        { error: "Cannot navigate forward" },
        { status: 400 },
      );
    }

    const navigation = await drillDownService.getNavigation(params.sessionId);

    return NextResponse.json({ level, navigation });
  } catch (error) {
    console.error("Error navigating forward:", error);
    return NextResponse.json(
      { error: "Failed to navigate forward" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.drilldown",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
