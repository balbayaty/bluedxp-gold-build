/**
 * 🚀 PERMISSION CHECK API
 *
 * Check if user has specific permission (5-level hierarchy)
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { permissionService } from "@/lib/services/user";
import type { PermissionContext } from "@/types/permissions";

// POST /api/permissions/check - Check permission
async function POST(req: NextRequest, context: any) {
  try {
    const body = await req.json();
    const { userId, permission, permissionContext } = body;

    if (!userId || !permission) {
      return NextResponse.json(
        { error: "User ID and permission required" },
        { status: 400 },
      );
    }

    const fullContext: PermissionContext = {
      ...permissionContext,
      userId,
      tenantId: context.security?.tenantId,
      ipAddress: context.security?.ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
    };

    const hasPermission = await permissionService.hasPermission(
      userId,
      permission,
      fullContext,
    );

    return NextResponse.json({
      success: true,
      data: {
        hasPermission,
        permission,
        context: fullContext,
      },
    });
  } catch (error) {
    console.error("[Permissions API] Error checking permission:", error);
    return NextResponse.json(
      { error: "Failed to check permission" },
      { status: 500 },
    );
  }
}

export const POSTHandler = withAPIGateway(
  withRowLevelSecurity(POST, { requireAuth: true }),
  { requireAuth: true },
);

export { POSTHandler as POST };
