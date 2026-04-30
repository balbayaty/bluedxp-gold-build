/**
 * Marketplace Conversation API
 * GET - Get conversation and messages
 * PUT - Update conversation (mark as read, archive)
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceMessagingService } from "@/lib/services/marketplace/messaging/marketplaceMessagingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { conversationId: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before") || undefined;

    const conversation = await marketplaceMessagingService.getConversation(
      params.conversationId,
    );
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 },
      );
    }

    const messages = await marketplaceMessagingService.getMessages(
      params.conversationId,
      limit,
      before,
    );

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error: any) {
    console.error("Failed to get conversation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get conversation" },
      { status: 500 },
    );
  }
}

async function putHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { conversationId: string } },
) {
  try {
    const body = await request.json();
    const { action, userId, messageIds } = body;

    if (action === "mark-read") {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "userId is required" },
          { status: 400 },
        );
      }

      await marketplaceMessagingService.markAsRead(
        params.conversationId,
        userId,
        messageIds,
      );
      return NextResponse.json({
        success: true,
        message: "Messages marked as read",
      });
    }

    if (action === "archive") {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "userId is required" },
          { status: 400 },
        );
      }

      const conversation =
        await marketplaceMessagingService.archiveConversation(
          params.conversationId,
          userId,
        );
      return NextResponse.json({
        success: true,
        data: conversation,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "mark-read" or "archive"' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Failed to update conversation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update conversation",
      },
      { status: 500 },
    );
  }
}
