/**
 * QHSE Custom Fields API
 * Manage custom fields for QHSE entities
 */

import { NextRequest, NextResponse } from "next/server";
import { customFieldService } from "@/lib/services/qhse/custom-fields/customFieldService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// GET - List custom fields
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType") as any;

    const fields = await customFieldService.getCustomFields(entityType);

    return NextResponse.json({
      success: true,
      data: fields,
    });
  } catch (error: any) {
    console.error("Error fetching custom fields:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch custom fields",
      },
      { status: 500 },
    );
  }
}

// POST - Create custom field
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const field = await customFieldService.createCustomField(body);

    return NextResponse.json({
      success: true,
      data: field,
    });
  } catch (error: any) {
    console.error("Error creating custom field:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create custom field",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.custom-fields",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.custom-fields",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
