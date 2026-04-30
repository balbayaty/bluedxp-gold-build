/**
 * Transportation Webhooks API
 *
 * Manage webhook subscriptions for transportation events
 */

import { NextRequest, NextResponse } from "next/server";
import { transportationWebhookService } from "@/lib/services/transportation";
import type { TransportationWebhookEvent } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function postHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const { action } = body;

    if (action === "subscribe") {
      const { url, events, secret } = body;
      if (!url || !events || !Array.isArray(events)) {
        return NextResponse.json(
          { error: "Missing required fields: url, events" },
          { status: 400 },
        );
      }

      const subscriptionId = await transportationWebhookService.subscribe(
        url,
        events,
        secret,
      );
      return NextResponse.json({ subscriptionId }, { status: 201 });
    }

    if (action === "unsubscribe") {
      const { subscriptionId } = body;
      if (!subscriptionId) {
        return NextResponse.json(
          { error: "Missing subscriptionId" },
          { status: 400 },
        );
      }

      await transportationWebhookService.unsubscribe(subscriptionId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to manage webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function getHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get("subscriptionId");

    if (subscriptionId) {
      const subscription =
        transportationWebhookService.getSubscription(subscriptionId);
      if (!subscription) {
        return NextResponse.json(
          { error: "Subscription not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(subscription);
    }

    const subscriptions = transportationWebhookService.listSubscriptions();
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Error getting webhooks:", error);
    return NextResponse.json(
      {
        error: "Failed to get webhooks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(postHandler, {
  featureId: "integration",
  action: "manage",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withTransportationAPI(getHandler, {
  featureId: "integration",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
