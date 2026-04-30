/**
 * 🚀 VIEW CONTEXT API
 *
 * Get and update user's view context with hierarchical support
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { viewContextService } from "@/lib/services/user";

// GET /api/view-context - Get user's view context
async function GET(req: NextRequest, context: any) {
  try {
    const userId = context.security?.userId || req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const viewContext = await viewContextService.buildViewContext(userId);

    return NextResponse.json({
      success: true,
      data: viewContext,
    });
  } catch (error) {
    console.error("[ViewContext API] Error getting view context:", error);
    return NextResponse.json(
      { error: "Failed to get view context" },
      { status: 500 },
    );
  }
}

// PUT /api/view-context - Update user's view context
async function PUT(req: NextRequest, context: any) {
  try {
    const userId = context.security?.userId || req.headers.get("x-user-id");
    const body = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const updatedContext = await viewContextService.refreshViewContext(
      userId,
      body,
    );

    return NextResponse.json({
      success: true,
      data: updatedContext,
    });
  } catch (error) {
    console.error("[ViewContext API] Error updating view context:", error);
    return NextResponse.json(
      { error: "Failed to update view context" },
      { status: 500 },
    );
  }
}

export const GETHandler = withAPIGateway(
  withRowLevelSecurity(GET, { requireAuth: true }),
  { requireAuth: true },
);

export const PUTHandler = withAPIGateway(
  withRowLevelSecurity(PUT, { requireAuth: true }),
  { requireAuth: true },
);

export { GETHandler as GET, PUTHandler as PUT };
