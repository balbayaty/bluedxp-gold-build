/**
 * Navigate Up API Route
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
    const level = await drillDownService.navigateUp(params.sessionId);

    if (!level) {
      return NextResponse.json(
        { error: "Cannot navigate up" },
        { status: 400 },
      );
    }

    const navigation = await drillDownService.getNavigation(params.sessionId);

    return NextResponse.json({ level, navigation });
  } catch (error) {
    console.error("Error navigating up:", error);
    return NextResponse.json(
      { error: "Failed to navigate up" },
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
