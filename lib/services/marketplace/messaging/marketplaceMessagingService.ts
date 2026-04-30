/**
 * Marketplace Messaging Service
 * Real-time communication between customers and providers
 * Integrates with WebSocket for real-time updates
 */

import type {
  Conversation,
  Message,
  ConversationCreationRequest,
  SendMessageRequest,
  ConversationFilters,
  MessageAttachment,
} from "@/types/marketplace-messaging";
import { eventBus } from "@/lib/services/event-store";
import { marketplaceNotificationService } from "../marketplaceNotificationService";
import { broadcastToUser } from "@/app/api/realtime/server";

// In-memory storage (replace with database)
const conversations: Map<string, Conversation> = new Map();
const messages: Map<string, Message[]> = new Map();

export class MarketplaceMessagingService {
  /**
   * Create or get conversation
   */
  async createOrGetConversation(
    request: ConversationCreationRequest,
  ): Promise<Conversation> {
    // Check if conversation already exists
    const existing = Array.from(conversations.values()).find(
      (c) =>
        c.providerId === request.providerId &&
        c.customerId === request.customerId &&
        (request.bookingId ? c.bookingId === request.bookingId : true) &&
        (request.serviceId ? c.serviceId === request.serviceId : true) &&
        c.status === "ACTIVE",
    );

    if (existing) {
      return existing;
    }

    // Get user names from user service
    let providerName = "Provider";
    let customerName = "Customer";

    try {
      const { userService } = await import("@/lib/services/user/userService");

      // Get provider name
      const provider = await userService.getUserById(request.providerId);
      if (provider) {
        providerName =
          provider.name ||
          `${provider.firstName || ""} ${provider.lastName || ""}`.trim() ||
          "Provider";
      }

      // Get customer name
      const customer = await userService.getUserById(request.customerId);
      if (customer) {
        customerName =
          customer.name ||
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          "Customer";
      }
    } catch (error) {
      console.warn("[MarketplaceMessaging] Could not fetch user names:", error);
      // Continue with default names
    }

    // Create new conversation
    const conversation: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      bookingId: request.bookingId,
      serviceId: request.serviceId,
      providerId: request.providerId,
      customerId: request.customerId,
      providerName,
      customerName,
      subject: request.subject,
      unreadCount: {
        provider: 0,
        customer: 0,
      },
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    conversations.set(conversation.id, conversation);
    messages.set(conversation.id, []);

    // Send initial message if provided
    if (request.initialMessage) {
      await this.sendMessage(
        {
          conversationId: conversation.id,
          content: request.initialMessage,
          type: "TEXT",
        },
        request.customerId,
      );
    }

    // Publish event
    await eventBus.publish("marketplace.conversation.created", {
      conversationId: conversation.id,
      providerId: request.providerId,
      customerId: request.customerId,
      bookingId: request.bookingId,
    });

    return conversation;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    return conversations.get(conversationId) || null;
  }

  /**
   * Get conversations with filters
   */
  async getConversations(
    filters: ConversationFilters,
  ): Promise<Conversation[]> {
    let results = Array.from(conversations.values());

    if (filters.userId) {
      results = results.filter(
        (c) =>
          c.providerId === filters.userId || c.customerId === filters.userId,
      );
    }

    if (filters.bookingId) {
      results = results.filter((c) => c.bookingId === filters.bookingId);
    }

    if (filters.serviceId) {
      results = results.filter((c) => c.serviceId === filters.serviceId);
    }

    if (filters.status) {
      results = results.filter((c) => c.status === filters.status);
    }

    if (filters.unreadOnly) {
      results = results.filter(
        (c) =>
          (filters.userId === c.providerId && c.unreadCount.provider > 0) ||
          (filters.userId === c.customerId && c.unreadCount.customer > 0),
      );
    }

    // Sort by last message time
    return results.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  /**
   * Send message
   */
  async sendMessage(
    request: SendMessageRequest,
    senderId: string,
  ): Promise<Message> {
    const conversation = conversations.get(request.conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${request.conversationId}`);
    }

    // Determine sender role
    const senderRole =
      senderId === conversation.providerId
        ? "PROVIDER"
        : senderId === conversation.customerId
          ? "CUSTOMER"
          : "SYSTEM";
    const senderName =
      senderRole === "PROVIDER"
        ? conversation.providerName
        : senderRole === "CUSTOMER"
          ? conversation.customerName
          : "System";

    // Process attachments (upload to storage)
    const attachments: MessageAttachment[] = [];
    if (request.attachments) {
      for (const att of request.attachments) {
        try {
          // Generate unique filename
          const fileId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const fileExtension = att.name.includes(".")
            ? att.name.split(".").pop()
            : "bin";
          const storagePath = `marketplace/messages/${conversation.id}/${fileId}.${fileExtension}`;

          // Try to upload to MinIO/S3 if available
          let uploadUrl = `/api/files/${storagePath}`;

          // Storage upload is handled separately via the storage service
          // When MinIO/S3 is configured, files will be stored in object storage
          // For now, use local file path as fallback
          if (att.url && att.url.startsWith("data:")) {
            // Base64 data would be handled by storage API endpoint
            console.info(
              "[MarketplaceMessaging] Attachment would be uploaded to object storage when configured",
            );
          }

          const attachment: MessageAttachment = {
            ...att,
            id: fileId,
            url: uploadUrl,
          };
          attachments.push(attachment);
        } catch (attError) {
          console.error(
            "[MarketplaceMessaging] Attachment processing failed:",
            attError,
          );
          // Skip failed attachment but continue with others
        }
      }
    }

    // Create message
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      conversationId: request.conversationId,
      senderId,
      senderName,
      senderRole,
      content: request.content,
      type: request.type || "TEXT",
      attachments: attachments.length > 0 ? attachments : undefined,
      status: "SENT",
      createdAt: new Date().toISOString(),
    };

    // Add to messages
    const conversationMessages = messages.get(request.conversationId) || [];
    conversationMessages.push(message);
    messages.set(request.conversationId, conversationMessages);

    // Update conversation
    const recipientId =
      senderId === conversation.providerId
        ? conversation.customerId
        : conversation.providerId;
    const updatedConversation: Conversation = {
      ...conversation,
      lastMessage: message,
      lastMessageAt: message.createdAt,
      unreadCount: {
        ...conversation.unreadCount,
        ...(senderId === conversation.providerId
          ? { customer: conversation.unreadCount.customer + 1 }
          : { provider: conversation.unreadCount.provider + 1 }),
      },
      updatedAt: new Date().toISOString(),
    };

    conversations.set(request.conversationId, updatedConversation);

    // Publish event
    await eventBus.publish("marketplace.message.sent", {
      messageId: message.id,
      conversationId: request.conversationId,
      senderId,
      recipientId,
    });

    // Send real-time update via Event Bus (WebSocket handled by client)
    await eventBus.publish("marketplace.message.received", {
      message,
      conversation: updatedConversation,
      recipientId,
    });

    // Send notification
    await marketplaceNotificationService.notifyNewMessage(
      request.conversationId,
      message.id,
      recipientId,
      senderName,
      request.content.substring(0, 100),
    );

    return message;
  }

  /**
   * Get messages for conversation
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    before?: string,
  ): Promise<Message[]> {
    const conversationMessages = messages.get(conversationId) || [];

    let results = conversationMessages;

    if (before) {
      const beforeIndex = conversationMessages.findIndex(
        (m) => m.id === before,
      );
      if (beforeIndex > 0) {
        results = conversationMessages.slice(0, beforeIndex);
      }
    }

    // Sort by creation time (oldest first)
    results.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // Limit results
    return results.slice(-limit);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    conversationId: string,
    userId: string,
    messageIds?: string[],
  ): Promise<void> {
    const conversation = conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const conversationMessages = messages.get(conversationId) || [];
    const now = new Date().toISOString();

    // Mark specific messages or all unread messages
    if (messageIds) {
      conversationMessages.forEach((msg) => {
        if (
          messageIds.includes(msg.id) &&
          msg.senderId !== userId &&
          msg.status !== "READ"
        ) {
          msg.status = "READ";
          msg.readAt = now;
        }
      });
    } else {
      conversationMessages.forEach((msg) => {
        if (msg.senderId !== userId && msg.status !== "READ") {
          msg.status = "READ";
          msg.readAt = now;
        }
      });
    }

    // Update unread count
    const unreadCount = conversationMessages.filter(
      (msg) => msg.senderId !== userId && msg.status !== "READ",
    ).length;

    const updatedConversation: Conversation = {
      ...conversation,
      unreadCount: {
        ...conversation.unreadCount,
        ...(userId === conversation.providerId
          ? { provider: 0 }
          : { customer: 0 }),
      },
      updatedAt: now,
    };

    conversations.set(conversationId, updatedConversation);

    // Publish event
    await eventBus.publish("marketplace.messages.read", {
      conversationId,
      userId,
      messageIds,
    });
  }

  /**
   * Archive conversation
   */
  async archiveConversation(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const updated: Conversation = {
      ...conversation,
      status: "ARCHIVED",
      updatedAt: new Date().toISOString(),
    };

    conversations.set(conversationId, updated);

    // Publish event
    await eventBus.publish("marketplace.conversation.archived", {
      conversationId,
      userId,
    });

    return updated;
  }
}

export const marketplaceMessagingService = new MarketplaceMessagingService();
