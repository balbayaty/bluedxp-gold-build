/**
 * 🚀 USERS API ENDPOINT
 *
 * RESTful API for user management
 * Supports all CRUD operations with hierarchical customer support
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { userService } from "@/lib/services/user";
import type { CreateUserInput } from "@/lib/services/user";

// GET /api/users - List users
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

    const users = await userService.getUsers({
      tenantId,
      role: searchParams.get("role") as any,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      assignedCustomerId: searchParams.get("assignedCustomerId") || undefined,
      assignedWarehouseId: searchParams.get("assignedWarehouseId") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
    });

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("[Users API] Error getting users:", error);
    return NextResponse.json(
      {
        error: "Failed to get users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST /api/users - Create user
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

    const input: CreateUserInput = {
      ...body,
      tenantId,
      createdBy: context.security?.userId || body.createdBy,
    };

    const user = await userService.createUser(input);

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Users API] Error creating user:", error);
    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Export with middleware
export const GETHandler = withAPIGateway(
  withRowLevelSecurity(GET, { requireTenant: true, requireAuth: true }),
  {
    rateLimit: { requestsPerMinute: 100 },
    requireAuth: true,
  },
);

export const POSTHandler = withAPIGateway(
  withRowLevelSecurity(POST, { requireTenant: true, requireAuth: true }),
  {
    rateLimit: { requestsPerMinute: 50 },
    requireAuth: true,
    requirePermission: { resource: "users", action: "create" },
  },
);

export { GETHandler as GET, POSTHandler as POST };



