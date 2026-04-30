/**
 * QR Code Templates API
 * Manage QR code templates
 */

import { NextRequest, NextResponse } from "next/server";
import { qrTemplateService } from "@/lib/services/qr/qrTemplateService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const industry = searchParams.get("industry");
    const isPublic = searchParams.get("isPublic");
    const createdBy = searchParams.get("createdBy");

    const templates = await qrTemplateService.listTemplates({
      category: category as any,
      industry: industry || undefined,
      isPublic:
        isPublic === "true" ? true : isPublic === "false" ? false : undefined,
      createdBy: createdBy || undefined,
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error("Error listing templates:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list templates" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      industry,
      config,
      isPublic,
      metadata,
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: "Name and category are required" },
        { status: 400 },
      );
    }

    // Get user from context
    const createdBy = context.userId || "system";

    const template = await qrTemplateService.createTemplate(
      {
        name,
        description,
        category,
        industry,
        config,
        isPublic,
        metadata,
      },
      createdBy,
    );

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create template" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.templates",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.templates",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
