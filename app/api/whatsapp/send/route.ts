/**
 * Send WhatsApp Message API
 */

import { NextRequest, NextResponse } from "next/server";
import { whatsappService } from "@/lib/services/whatsapp/whatsappService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.to || !body.message) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number (to) and message are required",
        },
        { status: 400 },
      );
    }

    const result = await whatsappService.sendMessage({
      to: body.to,
      message: body.message,
      templateId: body.templateId,
      templateParams: body.templateParams,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
      priority: body.priority,
    });

    return NextResponse.json(
      {
        success: result.success,
        data: result,
      },
      { status: result.success ? 200 : 500 },
    );
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send message",
      },
      { status: 500 },
    );
  }
}
