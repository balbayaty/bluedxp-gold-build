/**
 * Edge Computing Status API
 */

import { NextRequest, NextResponse } from "next/server";
import { isoIMSEdgeService } from "@/lib/services/iso-ims/edge/isoIMSEdgeService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const status = isoIMSEdgeService.getSyncStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting edge status:", error);
    return NextResponse.json(
      { error: "Failed to get edge status" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "sync") {
      const status = await isoIMSEdgeService.syncAll();
      return NextResponse.json(status);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in edge operation:", error);
    return NextResponse.json(
      { error: "Failed to perform edge operation" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.edge",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.edge",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
