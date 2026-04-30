/**
 * GET /api/v1/workspace/categories - Get categories
 * POST /api/v1/workspace/categories - Create category (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "@/lib/services/workspace/categoryService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";
import type { CreateWidgetCategoryInput } from "@/types/workspace";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeSystem = searchParams.get("includeSystem") !== "false";

    const categories = await categoryService.getCategories(
      includeSystem,
      user.tenantId,
    );

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[API] Error getting categories:", error);
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

    // Check if user is admin
    if (user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CreateWidgetCategoryInput;
    body.tenantId = user.tenantId;

    const category = await categoryService.createCategory(body, user.id);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating category:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
