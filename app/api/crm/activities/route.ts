/**
 * CRM Activities API
 * GET /api/crm/activities - Get activities
 * POST /api/crm/activities - Create activity
 */

import { NextRequest, NextResponse } from "next/server";
import { activityService } from "@/lib/services/crm/activityService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const relatedToType = searchParams.get("relatedToType") as any;
    const relatedToId = searchParams.get("relatedToId") || undefined;
    const type = searchParams.get("type") as any;
    const status = searchParams.get("status") as any;

    const activities = await activityService.getActivities({
      tenantId,
      relatedToType,
      relatedToId,
      type,
      status,
    });

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error: unknown) {
    logger.error("Error fetching activities", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "crm-activities", action: "fetch", tenantId },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch activities",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const activity = await activityService.createActivity(body);

    return NextResponse.json({
      success: true,
      data: activity,
    });
  } catch (error: unknown) {
    logger.error("Error creating activity", {
      error: error instanceof Error ? error.message : String(error),
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "crm-activities", action: "create" },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create activity",
      },
      { status: 500 },
    );
  }
}
