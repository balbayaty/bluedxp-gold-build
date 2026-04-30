/**
 * PUT /api/v1/workspace/categories/[categoryId] - Update category
 * DELETE /api/v1/workspace/categories/[categoryId] - Delete category (non-system only)
 */

import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "@/lib/services/workspace/categoryService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";
import type { UpdateWidgetCategoryInput } from "@/types/workspace";

export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateWidgetCategoryInput;
    const category = await categoryService.updateCategory(
      params.categoryId,
      body,
    );

    return NextResponse.json(category);
  } catch (error) {
    console.error("[API] Error updating category:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await categoryService.deleteCategory(params.categoryId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting category:", error);
    if (error instanceof Error && error.message.includes("system category")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
