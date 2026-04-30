/**
 * Webhooks API - Webhook management for external integrations
 * POST /api/v1/signatures/webhooks - Register webhook
 * GET /api/v1/signatures/webhooks - List webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/lib/services/digital-signature";
import {
  withSignatureAPI,
  SignatureAPIContext,
} from "@/lib/services/digital-signature/apiMiddleware";

export const POST = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    try {
      const body = await request.json();
      const { url, events, secret } = body;

      if (!url || !events || !Array.isArray(events)) {
        return NextResponse.json(
          { success: false, error: "url and events array are required" },
          { status: 400 },
        );
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid URL format" },
          { status: 400 },
        );
      }

      const webhook = await webhookService.registerWebhook(url, events, secret);

      return NextResponse.json({
        success: true,
        data: webhook,
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Internal server error" },
        { status: 500 },
      );
    }
  },
  {
    requireAuth: true,
    rateLimit: true,
    maxRequests: 10,
  },
);

export const GET = withSignatureAPI(
  async (request: NextRequest, context: SignatureAPIContext) => {
    const webhooks = webhookService.listWebhooks();

    return NextResponse.json({
      success: true,
      data: webhooks,
      count: webhooks.length,
    });
  },
  {
    requireAuth: true,
    rateLimit: true,
  },
);
