/**
 * GET /api/v1/workspace/widgets - Get available widgets (filtered by permissions)
 * POST /api/v1/workspace/widgets - Create user widget
 */

import { NextRequest, NextResponse } from "next/server";
import { widgetService } from "@/lib/services/workspace/widgetService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";
import type { GetWidgetsQuery, CreateUserWidgetInput } from "@/types/workspace";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query: GetWidgetsQuery = {
      categoryId: searchParams.get("categoryId") || undefined,
      moduleId: searchParams.get("moduleId") || undefined,
      search: searchParams.get("search") || undefined,
      tags: searchParams.get("tags")?.split(",") || undefined,
      isActive: searchParams.get("isActive") !== "false",
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
    };

    const widgets = await widgetService.getWidgetDefinitions(query);

    return NextResponse.json(widgets);
  } catch (error) {
    console.error("[API] Error getting widgets:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateUserWidgetInput;

    // Validate input
    if (!body.widgetDefId) {
      return NextResponse.json(
        { error: "widgetDefId is required" },
        { status: 400 },
      );
    }

    if (!body.position) {
      return NextResponse.json(
        { error: "position is required" },
        { status: 400 },
      );
    }

    const userWidget = await widgetService.createUserWidget(user.id, body);

    return NextResponse.json(userWidget, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating user widget:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
