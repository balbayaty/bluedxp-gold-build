/**
 * Real-Time Updates API Route
 *
 * WebSocket/SSE integration for real-time updates
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { realtimeUpdatesService } from "@/lib/services/transportation/realtimeUpdatesService";
import type {
  RealtimeSubscription,
  RealtimeUpdate,
} from "@/lib/services/transportation/realtimeUpdatesService";

async function handler(
  req: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    const tenantId = context?.tenantId;

    if (!tenantId || String(tenantId).trim().length === 0) {
      return NextResponse.json(
        { error: "tenantId is required (multi-tenant day 1)" },
        { status: 400 },
      );
    }

    // Prevent userId spoofing if gateway user context exists
    if (
      context?.userId &&
      data.userId &&
      String(data.userId) !== String(context.userId)
    ) {
      return NextResponse.json({ error: "userId mismatch" }, { status: 403 });
    }

    switch (action) {
      case "subscribe":
        return await handleSubscribe({
          ...(data as any),
          tenantId: String(tenantId),
          userId: context?.userId || data.userId,
        });

      case "unsubscribe":
        return await handleUnsubscribe(data);

      case "publish":
        return await handlePublish({
          ...(data as any),
          tenantId: String(tenantId),
        } as any);

      case "get-updates":
        return await handleGetUpdates(data);

      case "get-notifications":
        return await handleGetNotifications({
          ...(data as any),
          userId: context?.userId || data.userId,
        });

      case "mark-read":
        return await handleMarkRead({
          ...(data as any),
          userId: context?.userId || data.userId,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Real-time API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

async function handleSubscribe(data: {
  userId: string;
  tenantId?: string;
  subscriptions: RealtimeSubscription["subscriptions"];
  connectionId?: string;
}) {
  const subscription = await realtimeUpdatesService.subscribe(data);
  return NextResponse.json({ subscription });
}

async function handleUnsubscribe(data: { subscriptionId: string }) {
  await realtimeUpdatesService.unsubscribe(data.subscriptionId);
  return NextResponse.json({ success: true });
}

async function handlePublish(data: RealtimeUpdate) {
  await realtimeUpdatesService.publishUpdate(data);
  return NextResponse.json({ success: true });
}

async function handleGetUpdates(data: { entityId: string; limit?: number }) {
  const updates = realtimeUpdatesService.getUpdates(data.entityId, data.limit);
  return NextResponse.json({ updates });
}

async function handleGetNotifications(data: {
  userId: string;
  unreadOnly?: boolean;
}) {
  const notifications = realtimeUpdatesService.getNotifications(
    data.userId,
    data.unreadOnly,
  );
  return NextResponse.json({ notifications });
}

async function handleMarkRead(data: {
  userId: string;
  notificationId: string;
}) {
  await realtimeUpdatesService.markNotificationRead(
    data.userId,
    data.notificationId,
  );
  return NextResponse.json({ success: true });
}

export const POST = withTransportationAPI(handler, { action: "execute" });
