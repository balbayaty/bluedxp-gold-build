/**
 * Notifications API Route
 * Get, create, and manage notifications
 */

import { NextRequest, NextResponse } from "next/server";
import {
  notificationService,
  NotificationType,
  NotificationChannel,
} from "@/lib/services/notifications/notificationService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") as NotificationType | undefined;

    const notifications = await notificationService.getAll({
      limit,
      unreadOnly,
      type,
    });
    const unreadCount = await notificationService.getUnreadCount();

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get notifications" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, message, channels, metadata, userId } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { success: false, error: "type, title, and message are required" },
        { status: 400 },
      );
    }

    const notification = await notificationService.send({
      type: type as NotificationType,
      channel: (channels as NotificationChannel[])?.[0] || "in-app",
      priority: "medium",
      title,
      message,
      userId,
      ...(metadata && {
        category: metadata.category,
        source: metadata.source,
        entityId: metadata.entityId,
        entityType: metadata.entityType,
      }),
    });

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, notificationId } = body;

    if (action === "markAsRead" && notificationId) {
      await notificationService.markAsRead(notificationId);
      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
      });
    }

    if (action === "markAllAsRead") {
      await notificationService.markAllAsRead();
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
