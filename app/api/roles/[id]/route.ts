/**
 * 🚀 ROLE BY ID API ENDPOINT
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { roleService } from "@/lib/services/user";
import type { UpdateRoleInput } from "@/lib/services/user";

async function GET(req: NextRequest, context: any) {
  try {
    const roleId = context.params?.id;
    if (!roleId) {
      return NextResponse.json({ error: "Role ID required" }, { status: 400 });
    }

    const role = await roleService.getRole(roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get role" }, { status: 500 });
  }
}

async function PUT(req: NextRequest, context: any) {
  try {
    const roleId = context.params?.id;
    const body = await req.json();

    if (!roleId) {
      return NextResponse.json({ error: "Role ID required" }, { status: 400 });
    }

    const input: UpdateRoleInput = {
      ...body,
      updatedBy: context.security?.userId,
    };

    const role = await roleService.updateRole(roleId, input);
    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 },
    );
  }
}

async function DELETE(req: NextRequest, context: any) {
  try {
    const roleId = context.params?.id;
    if (!roleId) {
      return NextResponse.json({ error: "Role ID required" }, { status: 400 });
    }

    await roleService.deleteRole(roleId);
    return NextResponse.json({ success: true, message: "Role deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 },
    );
  }
}

export const GETHandler = withAPIGateway(
  withRowLevelSecurity(GET, { requireAuth: true }),
  { requireAuth: true },
);
export const PUTHandler = withAPIGateway(
  withRowLevelSecurity(PUT, { requireAuth: true }),
  {
    requireAuth: true,
    requirePermission: { resource: "settings", action: "manage" },
  },
);
export const DELETEHandler = withAPIGateway(
  withRowLevelSecurity(DELETE, { requireAuth: true }),
  {
    requireAuth: true,
    requirePermission: { resource: "settings", action: "manage" },
  },
);

export { GETHandler as GET, PUTHandler as PUT, DELETEHandler as DELETE };
