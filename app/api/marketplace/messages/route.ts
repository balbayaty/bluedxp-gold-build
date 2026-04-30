/**
 * Marketplace Messages API
 * POST - Create conversation or send message
 * GET - List conversations
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceMessagingService } from "@/lib/services/marketplace/messaging/marketplaceMessagingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "create-conversation") {
      const conversation =
        await marketplaceMessagingService.createOrGetConversation(data);
      return NextResponse.json({
        success: true,
        data: conversation,
      });
    }

    if (action === "send-message") {
      const { conversationId, content, type, attachments, senderId } = data;

      if (!conversationId || !content || !senderId) {
        return NextResponse.json(
          {
            success: false,
            error: "conversationId, content, and senderId are required",
          },
          { status: 400 },
        );
      }

      const message = await marketplaceMessagingService.sendMessage(
        { conversationId, content, type, attachments },
        senderId,
      );
      return NextResponse.json({
        success: true,
        data: message,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Use "create-conversation" or "send-message"',
      },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Failed to process message request:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const bookingId = searchParams.get("bookingId");
    const serviceId = searchParams.get("serviceId");
    const status = searchParams.get("status") as any;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const conversations = await marketplaceMessagingService.getConversations({
      userId: userId || undefined,
      bookingId: bookingId || undefined,
      serviceId: serviceId || undefined,
      status,
      unreadOnly,
    });

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    console.error("Failed to get conversations:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get conversations" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.messages",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.messages",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
