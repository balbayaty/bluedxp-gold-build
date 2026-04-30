/**
 * Email Send API Route
 *
 * Send email via centralized Email Service
 * Supports direct email sending and template-based emails
 */

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/services/email";
import type { EmailMessage } from "@/lib/services/email/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      to,
      subject,
      htmlBody,
      textBody,
      templateId,
      templateVariables,
      ...options
    } = body;

    // Validate required fields
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Recipient (to) is required" },
        { status: 400 },
      );
    }

    // Send email using template if provided
    if (templateId) {
      if (!templateVariables) {
        return NextResponse.json(
          {
            success: false,
            error: "Template variables are required when using template",
          },
          { status: 400 },
        );
      }

      const result = await emailService.sendTemplateEmail(
        templateId,
        to,
        templateVariables,
        {
          tenantId,
          ...options,
        },
      );

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    }

    // Send direct email
    if (!subject || (!htmlBody && !textBody)) {
      return NextResponse.json(
        {
          success: false,
          error: "Subject and body (htmlBody or textBody) are required",
        },
        { status: 400 },
      );
    }

    const emailMessage: EmailMessage = {
      tenantId,
      to,
      subject,
      htmlBody,
      textBody,
      ...options,
    };

    const result = await emailService.sendEmail(emailMessage);

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send email",
      },
      { status: 500 },
    );
  }
}
