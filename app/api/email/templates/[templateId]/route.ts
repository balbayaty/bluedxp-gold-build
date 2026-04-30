/**
 * Email Template Detail API Route
 *
 * Get, update, or delete a specific email template
 */

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/services/email";

// GET - Get template
export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";

    const template = await emailService.getTemplate(
      params.templateId,
      tenantId,
    );

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error("Error getting template:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get template",
      },
      { status: 500 },
    );
  }
}

// PATCH - Update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: { templateId: string } },
) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";

    const template = await emailService.updateTemplate(params.templateId, body);

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update template",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";

    const deleted = await emailService.deleteTemplate(
      params.templateId,
      tenantId,
    );

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete template",
      },
      { status: 500 },
    );
  }
}
