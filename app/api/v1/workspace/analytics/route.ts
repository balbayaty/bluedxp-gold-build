/**
 * POST /api/v1/workspace/analytics
 * Track workspace event
 * GET /api/v1/workspace/analytics
 * Get usage statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { personalizationService } from "@/lib/services/workspace/personalizationService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";
import type { WorkspaceEventType } from "@/types/workspace";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, metadata } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: "eventType is required" },
        { status: 400 },
      );
    }

    await personalizationService.trackUserBehavior(
      user.id,
      user.tenantId,
      eventType as WorkspaceEventType,
      metadata,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error tracking analytics:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start")
      ? new Date(searchParams.get("start")!)
      : undefined;
    const end = searchParams.get("end")
      ? new Date(searchParams.get("end")!)
      : undefined;

    const stats = await personalizationService.getUsageStats(
      user.id,
      start && end ? { start, end } : undefined,
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API] Error getting analytics:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
