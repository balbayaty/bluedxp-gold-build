/**
 * Customs Webhooks API
 * Handles incoming webhooks from customs systems
 */

import { NextRequest, NextResponse } from "next/server";
import { eventBus } from "@/lib/services/event-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data, source } = body;

    // Validate webhook
    if (!event || !data) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload" },
        { status: 400 },
      );
    }

    // Publish event to event bus
    await eventBus.publish({
      id: `webhook-${Date.now()}`,
      type: `customs.webhook.${event}`,
      aggregateId: data.declarationId || data.carnetNumber || "customs",
      aggregateType: "customs-webhook",
      data: {
        ...data,
        source,
        receivedAt: new Date(),
      },
      metadata: {
        timestamp: new Date(),
        source: "webhook",
        webhookSource: source,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Webhook received and processed",
    });
  } catch (error: any) {
    console.error("[Customs] Webhook error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // Webhook verification endpoint
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get("challenge");

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    success: true,
    message: "Customs webhook endpoint is active",
  });
}
