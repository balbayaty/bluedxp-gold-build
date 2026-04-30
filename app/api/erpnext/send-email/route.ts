/**
 * Send Email via ERPNext API Route
 * Handles email notifications for MSDS approvals, rejections, and information requests
 */

import { NextRequest, NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to,
      subject,
      message,
      reference_doctype,
      reference_name,
      cc,
      bcc,
      attachments,
    } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: to, subject, message",
        },
        { status: 400 },
      );
    }

    console.log("[send-email] Sending email to:", to, "Subject:", subject);

    const result = await erpNextAPI.sendEmail({
      to,
      subject,
      message,
      reference_doctype,
      reference_name,
      cc,
      bcc,
      attachments,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
        data: result.data,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error || "Failed to send email" },
      { status: 500 },
    );
  } catch (error) {
    console.error("[send-email] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 },
    );
  }
}
