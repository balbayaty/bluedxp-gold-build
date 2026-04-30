/**
 * WhatsApp Webhook Handler
 * Handles incoming webhooks from WhatsApp providers
 */

import { NextRequest, NextResponse } from "next/server";
import { whatsappService } from "@/lib/services/whatsapp/whatsappService";

// ============================================================================
// GET /api/whatsapp/webhook - Webhook verification (Meta API)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (!mode || !token || !challenge) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const verifiedChallenge = whatsappService.verifyWebhook(
      mode,
      token,
      challenge,
    );

    if (verifiedChallenge) {
      return new NextResponse(verifiedChallenge, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/whatsapp/webhook - Handle webhook events
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle webhook
    await whatsappService.handleWebhook(body);

    // Return 200 OK immediately (Meta API requirement)
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error handling webhook:", error);
    // Still return 200 to prevent retries
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
