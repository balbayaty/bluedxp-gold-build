/**
 * Telegram Webhook API
 * Handle incoming Telegram webhook updates
 */

import { NextRequest, NextResponse } from "next/server";
import { telegramService } from "@/lib/services/external-integrations/telegramService";

/**
 * POST /api/integrations/telegram/webhook
 * Handle Telegram webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook secret if configured
    const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    // In production, verify secret matches expected value

    // Process webhook update
    await telegramService.handleWebhookUpdate(body);

    // Telegram requires 200 OK response
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error handling Telegram webhook:", error);
    // Still return 200 to prevent Telegram from retrying
    return NextResponse.json({ ok: true });
  }
}
