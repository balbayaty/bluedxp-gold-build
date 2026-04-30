/**
 * 🚀 ROLES API ENDPOINT
 *
 * RESTful API for dynamic role management
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { roleService } from "@/lib/services/user";
import type { CreateRoleInput } from "@/lib/services/user";

// GET /api/roles - List roles
async function GET(req: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = context.security?.tenantId || searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 400 },
      );
    }

    const roles = await roleService.listRoles(tenantId, {
      isSystemRole:
        searchParams.get("isSystemRole") === "true"
          ? true
          : searchParams.get("isSystemRole") === "false"
            ? false
            : undefined,
      isActive:
        searchParams.get("isActive") === "true"
          ? true
          : searchParams.get("isActive") === "false"
            ? false
            : undefined,
      parentRoleId: searchParams.get("parentRoleId") || undefined,
    });

    return NextResponse.json({
      success: true,
      data: roles,
      count: roles.length,
    });
  } catch (error) {
    console.error("[Roles API] Error getting roles:", error);
    return NextResponse.json({ error: "Failed to get roles" }, { status: 500 });
  }
}

// POST /api/roles - Create role
async function POST(req: NextRequest, context: any) {
  try {
    const body = await req.json();
    const tenantId = context.security?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 400 },
      );
    }

    const input: CreateRoleInput = {
      ...body,
      tenantId,
      createdBy: context.security?.userId || body.createdBy,
    };

    const role = await roleService.createRole(input);

    return NextResponse.json(
      {
        success: true,
        data: role,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Roles API] Error creating role:", error);
    return NextResponse.json(
      {
        error: "Failed to create role",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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
    requirePermission: { resource: "settings", action: "manage" },
  },
);

export { GETHandler as GET, POSTHandler as POST };
