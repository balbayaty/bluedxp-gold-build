/**
 * 🚀 AI RECOMMENDATIONS API
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { aiPermissionService } from "@/lib/services/user/aiPermissionService";

async function GET(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const recommendations =
      await aiPermissionService.getRecommendations(userId);
    return NextResponse.json({ success: true, data: recommendations });
  } catch (error) {
    console.error("[AI API] Error getting recommendations:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 },
    );
  }
}

export const GETHandler = withAPIGateway(
  withRowLevelSecurity(GET, { requireAuth: true }),
  { requireAuth: true },
);

export { GETHandler as GET };
