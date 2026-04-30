/**
 * 🚀 TENANTS API ENDPOINT
 *
 * RESTful API for tenant management
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { withRowLevelSecurity } from "@/middleware/rowLevelSecurity";
import { tenantService } from "@/lib/services/user";
import type { CreateTenantInput } from "@/lib/services/user";

// GET /api/tenants - List tenants
async function GET(req: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(req.url);

    const tenants = await tenantService.listTenants({
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      subscriptionTier: searchParams.get("subscriptionTier") || undefined,
    });

    return NextResponse.json({
      success: true,
      data: tenants,
      count: tenants.length,
    });
  } catch (error) {
    console.error("[Tenants API] Error getting tenants:", error);
    return NextResponse.json(
      { error: "Failed to get tenants" },
      { status: 500 },
    );
  }
}

// POST /api/tenants - Create tenant
async function POST(req: NextRequest, context: any) {
  try {
    const body = await req.json();

    const input: CreateTenantInput = {
      ...body,
      createdBy: context.security?.userId || body.createdBy,
    };

    const tenant = await tenantService.createTenant(input);

    return NextResponse.json(
      {
        success: true,
        data: tenant,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Tenants API] Error creating tenant:", error);
    return NextResponse.json(
      {
        error: "Failed to create tenant",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GETHandler = withAPIGateway(
  withRowLevelSecurity(GET, { requireAuth: true }),
  {
    requireAuth: true,
    requirePermission: { resource: "settings", action: "read" },
  },
);

export const POSTHandler = withAPIGateway(
  withRowLevelSecurity(POST, { requireAuth: true }),
  {
    requireAuth: true,
    requirePermission: { resource: "settings", action: "manage" },
  },
);

export { GETHandler as GET, POSTHandler as POST };
