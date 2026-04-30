/**
 * QHSE Document Templates API
 * Manage document templates for QHSE reports
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseDocumentTemplateService } from "@/lib/services/qhse/templates/qhseDocumentTemplateService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// GET - List templates
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as any;

    const templates = await qhseDocumentTemplateService.getTemplates(type);

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch templates" },
      { status: 500 },
    );
  }
}

// POST - Create template
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const template = await qhseDocumentTemplateService.createTemplate(body);

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
  moduleId: "qhse",
  featureId: "qhse.templates",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.templates",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
