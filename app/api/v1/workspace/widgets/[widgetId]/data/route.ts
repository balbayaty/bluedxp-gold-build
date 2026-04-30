/**
 * GET /api/v1/workspace/widgets/[widgetId]/data
 * Get widget data
 * POST /api/v1/workspace/widgets/[widgetId]/data
 * Refresh widget data
 */

import { NextRequest, NextResponse } from "next/server";
import { widgetService } from "@/lib/services/workspace/widgetService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";
import { userService } from "@/lib/services/user/userService";
import type { WidgetDataRequest } from "@/types/workspace";

export async function GET(
  request: NextRequest,
  { params }: { params: { widgetId: string } },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const config = searchParams.get("config")
      ? JSON.parse(searchParams.get("config")!)
      : undefined;
    const context = searchParams.get("context")
      ? JSON.parse(searchParams.get("context")!)
      : undefined;

    // In development, skip slow user lookup
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      process.env.ENABLE_DEMO_DATA === "true";
    let fullUser = user;

    if (!isDevelopment) {
      const fetchedUser = await userService.getUserById(user.id);
      if (!fetchedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      fullUser = fetchedUser;
    }

    const data = await widgetService.getWidgetData(
      {
        widgetId: params.widgetId,
        config,
        context,
      },
      fullUser,
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error getting widget data:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { widgetId: string } },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const config = body.config;

    const data = await widgetService.refreshWidget(params.widgetId, config);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error refreshing widget:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
