/**
 * Sync Integration API
 * Manually trigger sync for an integration
 */

import { NextRequest, NextResponse } from "next/server";
import { integrationManager } from "@/lib/services/external-integrations/integrationManager";

/**
 * POST /api/integrations/[id]/sync
 * Sync integration data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const result = await integrationManager.syncIntegration(params.id);

    if (!result.success) {
      return NextResponse.json(result, { status: result.statusCode || 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Integration synced successfully",
    });
  } catch (error: any) {
    console.error("Error syncing integration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sync integration",
      },
      { status: 500 },
    );
  }
}
