/**
 * GET /api/v1/workspace/layouts - Get user layouts
 * POST /api/v1/workspace/layouts - Create new layout
 */

import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/services/workspace/workspaceService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";
import type {
  CreateWorkspaceLayoutInput,
  GetLayoutsQuery,
} from "@/types/workspace";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query: GetLayoutsQuery = {
      category: searchParams.get("category") || undefined,
      isTemplate: searchParams.get("isTemplate") === "true" ? true : undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
    };

    const layouts = await workspaceService.getUserLayouts(user.id, query);

    return NextResponse.json(layouts);
  } catch (error) {
    console.error("[API] Error getting layouts:", error);
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

    const body = (await request.json()) as CreateWorkspaceLayoutInput;

    // Validate input
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Layout name is required" },
        { status: 400 },
      );
    }

    const layout = await workspaceService.saveLayout(user.id, body);

    return NextResponse.json(layout, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating layout:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
