/**
 * 🚀 USER PERMISSIONS API
 *
 * Manage 5-level hierarchical permissions for users
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { permissionService, userService } from "@/lib/services/user";
import type { HierarchicalPermission } from "@/types/permissions";

// GET /api/users/[id]/permissions - Get user permissions
async function GET(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    const { searchParams } = new URL(req.url);

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Check specific permission if provided
    const moduleParam = searchParams.get("module");
    const feature = searchParams.get("feature");
    const tab = searchParams.get("tab");
    const action = searchParams.get("action");
    const field = searchParams.get("field");

    if (moduleParam && action) {
      const hasPermission = await permissionService.hasPermission(
        userId,
        {
          module: moduleParam,
          feature: feature || undefined,
          tab: tab || undefined,
          action,
          field: field || undefined,
        },
        {
          customerId: searchParams.get("customerId") || undefined,
          subCustomerId: searchParams.get("subCustomerId") || undefined,
          warehouseId: searchParams.get("warehouseId") || undefined,
        },
      );

      return NextResponse.json({
        success: true,
        data: { hasPermission },
      });
    }

    // Get all permissions
    const user = await userService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        permissions: user.hierarchicalPermissions || [],
      },
    });
  } catch (error) {
    console.error("[Users API] Error getting permissions:", error);
    return NextResponse.json(
      { error: "Failed to get permissions" },
      { status: 500 },
    );
  }
}

// POST /api/users/[id]/permissions - Grant permission
async function POST(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    const body = await req.json();
    const permission = body.permission as HierarchicalPermission;

    if (!userId || !permission) {
      return NextResponse.json(
        { error: "User ID and permission required" },
        { status: 400 },
      );
    }

    await permissionService.grantPermission(userId, permission);

    return NextResponse.json({
      success: true,
      message: "Permission granted",
    });
  } catch (error) {
    console.error("[Users API] Error granting permission:", error);
    return NextResponse.json(
      { error: "Failed to grant permission" },
      { status: 500 },
    );
  }
}

// PUT /api/users/[id]/permissions - Bulk update all permissions
async function PUT(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    const body = await req.json();
    const permissions = body.permissions as HierarchicalPermission[];

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions must be an array" },
        { status: 400 },
      );
    }

    // Update user with new permissions
    const updatedUser = await userService.updateUser(userId, {
      hierarchicalPermissions: permissions,
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${permissions.length} permissions`,
      data: { permissions: updatedUser?.hierarchicalPermissions || permissions },
    });
  } catch (error) {
    console.error("[Users API] Error updating permissions:", error);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 },
    );
  }
}

// DELETE /api/users/[id]/permissions - Revoke permission
async function DELETE(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    const body = await req.json();
    const permission = body.permission as HierarchicalPermission;

    if (!userId || !permission) {
      return NextResponse.json(
        { error: "User ID and permission required" },
        { status: 400 },
      );
    }

    await permissionService.revokePermission(userId, permission);

    return NextResponse.json({
      success: true,
      message: "Permission revoked",
    });
  } catch (error) {
    console.error("[Users API] Error revoking permission:", error);
    return NextResponse.json(
      { error: "Failed to revoke permission" },
      { status: 500 },
    );
  }
}

export const GETHandler = withAPIGateway(
  withRowLevelSecurity(GET, { requireTenant: true, requireAuth: true }),
  { requireAuth: true },
);

export const POSTHandler = withAPIGateway(
  withRowLevelSecurity(POST, { requireTenant: true, requireAuth: true }),
  {
    requireAuth: true,
    requirePermission: { resource: "users", action: "update" },
  },
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
    requirePermission: { resource: "users", action: "update" },
  },
);

export { GETHandler as GET, POSTHandler as POST, PUTHandler as PUT, DELETEHandler as DELETE };
