/**
 * 🚀 USER CUSTOMER ASSIGNMENTS API
 *
 * Manage hierarchical customer assignments for users
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { userService } from "@/lib/services/user";
import type { CustomerAssignmentOptions } from "@/types/user";

// GET /api/users/[id]/customers - Get user's customer assignments
async function GET(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const assignments = await userService.getUserCustomerAssignments(userId);
    const visibleCustomers = await userService.getUserVisibleCustomers(userId);

    return NextResponse.json({
      success: true,
      data: {
        assignments,
        visibleCustomers,
      },
    });
  } catch (error) {
    console.error("[Users API] Error getting customer assignments:", error);
    return NextResponse.json(
      { error: "Failed to get customer assignments" },
      { status: 500 },
    );
  }
}

// POST /api/users/[id]/customers - Assign user to customer
async function POST(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    const body = await req.json();
    const { customerId, subCustomerId, ...options } = body;

    if (!userId || !customerId) {
      return NextResponse.json(
        { error: "User ID and Customer ID required" },
        { status: 400 },
      );
    }

    const assignment = await userService.assignUserToCustomer(
      userId,
      customerId,
      subCustomerId,
      options as CustomerAssignmentOptions,
    );

    return NextResponse.json(
      {
        success: true,
        data: assignment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Users API] Error assigning customer:", error);
    return NextResponse.json(
      { error: "Failed to assign customer" },
      { status: 500 },
    );
  }
}

// DELETE /api/users/[id]/customers - Remove user from customer
async function DELETE(req: NextRequest, context: any) {
  try {
    const userId = context.params?.id;
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const subCustomerId = searchParams.get("subCustomerId") || undefined;

    if (!userId || !customerId) {
      return NextResponse.json(
        { error: "User ID and Customer ID required" },
        { status: 400 },
      );
    }

    await userService.removeUserFromCustomer(userId, customerId, subCustomerId);

    return NextResponse.json({
      success: true,
      message: "Customer assignment removed",
    });
  } catch (error) {
    console.error("[Users API] Error removing customer assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove customer assignment" },
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

export const DELETEHandler = withAPIGateway(
  withRowLevelSecurity(DELETE, { requireTenant: true, requireAuth: true }),
  {
    requireAuth: true,
    requirePermission: { resource: "users", action: "update" },
  },
);

export { GETHandler as GET, POSTHandler as POST, DELETEHandler as DELETE };
