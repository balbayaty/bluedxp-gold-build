/**
 * 🚀 USER BY ID API ENDPOINT
 *
 * GET, PUT, DELETE operations for specific user
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { userService } from "@/lib/services/user";
import type { UpdateUserInput } from "@/lib/services/user";

// GET /api/users/[id] - Get user by ID
async function GET(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    const tenantId = context.security?.tenantId;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await userService.getUserById(userId, tenantId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("[Users API] Error getting user:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user
async function PUT(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    const body = await req.json();
    const tenantId = context.security?.tenantId;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const input: UpdateUserInput = {
      ...body,
      updatedBy: context.security?.userId,
    };

    const user = await userService.updateUser(userId, input);

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("[Users API] Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE /api/users/[id] - Delete user (soft delete)
async function DELETE(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await userService.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("[Users API] Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}

export const GETHandler = withAPIGateway(
  withRowLevelSecurity(GET, { requireTenant: true, requireAuth: true }),
  { requireAuth: true },
);

export const PUTHandler = withAPIGateway(
  withRowLevelSecurity(PUT, { requireTenant: true, requireAuth: true }),
  {
    requireAuth: true,
    requirePermission: { resource: "users", action: "update" },
  },
);

export const DELETEHandler = withAPIGateway(
  withRowLevelSecurity(DELETE, { requireTenant: true, requireAuth: true }),
  {
    requireAuth: true,
    requirePermission: { resource: "users", action: "delete" },
  },
);

export { GETHandler as GET, PUTHandler as PUT, DELETEHandler as DELETE };
