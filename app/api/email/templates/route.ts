/**
 * Email Templates API Route
 *
 * Manage email templates (CRUD operations)
 */

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/services/email";
import type { EmailTemplate } from "@/lib/services/email/types";

// GET - List templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";
    const moduleId = searchParams.get("moduleId") || undefined;

    const templates = await emailService.listTemplates(tenantId, moduleId);

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error("Error listing templates:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to list templates",
      },
      { status: 500 },
    );
  }
}

// POST - Create template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, name, subject, htmlBody, textBody, variables, moduleId } =
      body;

    if (!tenantId || !name || !subject || !htmlBody) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID, name, subject, and htmlBody are required",
        },
        { status: 400 },
      );
    }

    const template = await emailService.createTemplate({
      tenantId,
      name,
      subject,
      htmlBody,
      textBody,
      variables,
      moduleId,
    });

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create template",
      },
      { status: 500 },
    );
  }
}
