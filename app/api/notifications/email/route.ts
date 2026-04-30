/**
 * Email Notification API
 * Send email notifications via centralized Email Service
 *
 * @deprecated Use /api/email/send instead
 * This route is kept for backward compatibility
 */

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/services/email";
import type { EmailMessage } from "@/lib/services/email/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, priority, data, tenantId } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "To, subject, and message are required" },
        { status: 400 },
      );
    }

    // Convert to Email Service format
    const emailMessage: EmailMessage = {
      tenantId: tenantId || "default",
      to: Array.isArray(to) ? to.map((email) => ({ email })) : { email: to },
      subject,
      htmlBody: message,
      textBody: message,
      priority:
        priority === "critical"
          ? "urgent"
          : priority === "high"
            ? "high"
            : priority === "low"
              ? "low"
              : "normal",
      metadata: data,
      moduleId: "notifications",
    };

    const result = await emailService.sendEmail(emailMessage);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send email" },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send email" },
      { status: 500 },
    );
  }
}
