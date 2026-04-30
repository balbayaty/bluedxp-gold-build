/**
 * Telegram Integration Service
 * Telegram Bot API integration
 * Supports messaging, groups, channels, and webhooks
 */

import { BaseIntegrationService } from "./baseIntegrationService";
import type {
  TelegramIntegration,
  TelegramBotInfo,
  TelegramChatInfo,
  TelegramMessage,
  IntegrationResponse,
} from "@/types/external-integrations";
import axios from "axios";

export class TelegramService extends BaseIntegrationService {
  protected integrationType = "TELEGRAM" as const;
  private readonly apiBaseUrl = "https://api.telegram.org/bot";

  /**
   * Get Telegram API URL
   */
  private getApiUrl(token: string, method: string): string {
    return `${this.apiBaseUrl}${token}/${method}`;
  }

  /**
   * Connect Telegram bot
   */
  async connect(
    integration: Partial<TelegramIntegration>,
  ): Promise<TelegramIntegration> {
    if (!integration.config?.botToken) {
      throw new Error("Bot token required for Telegram connection");
    }

    // Verify bot token and get bot info
    const botInfo = await this.getBotInfo(integration.config.botToken);

    const telegramIntegration: TelegramIntegration = {
      id: integration.id || `telegram_${Date.now()}`,
      type: "TELEGRAM",
      name: integration.name || `Telegram - ${botInfo.username}`,
      status: "CONNECTED",
      tenantId: integration.tenantId || "",
      userId: integration.userId,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncAt: new Date(),
      config: {
        ...integration.config,
        botUsername: botInfo.username,
      },
      metadata: {
        botInfo,
      },
    };

    // Set up webhook if webhookUrl is provided
    if (integration.config.webhookUrl) {
      await this.setWebhook(
        integration.config.botToken,
        integration.config.webhookUrl,
        integration.config.webhookSecret,
      );
    }

    this.emitEvent(
      "connected",
      { integrationId: telegramIntegration.id },
      telegramIntegration.id,
    );
    return telegramIntegration;
  }

  /**
   * Disconnect Telegram integration
   */
  async disconnect(integrationId: string): Promise<void> {
    // Delete webhook if exists
    // This would get the integration from storage first
    this.emitEvent("disconnected", { integrationId }, integrationId);
  }

  /**
   * Sync Telegram data
   */
  async sync(integrationId: string): Promise<void> {
    this.emitEvent("sync_started", { integrationId }, integrationId);
    // Sync messages, chats, etc.
    this.emitEvent("sync_completed", { integrationId }, integrationId);
  }

  /**
   * Get integration status
   */
  async getStatus(
    integrationId: string,
  ): Promise<"CONNECTED" | "DISCONNECTED" | "PENDING" | "ERROR" | "EXPIRED"> {
    return "CONNECTED";
  }

  /**
   * Get data from Telegram
   */
  async getData(
    integrationId: string,
    options?: Record<string, any>,
  ): Promise<any> {
    // This method is called by IntegrationManager which provides the integration config
    // Options may include: botToken, chatId, limit, etc.
    const botToken = options?.botToken;
    const chatId = options?.chatId;
    const limit = options?.limit || 10;

    if (!botToken) {
      return { messages: [], error: "Bot token required" };
    }

    // Get updates/messages
    if (chatId) {
      // Would fetch messages for specific chat
      // For now, return structure
      return {
        messages: [],
        chatId,
        total: 0,
      };
    } else {
      // Get recent updates
      const updates = await this.getUpdates(botToken, undefined, limit);
      return {
        messages: updates,
        total: updates.length,
      };
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(
    integrationId: string,
    config: Record<string, any>,
  ): Promise<TelegramIntegration> {
    // This method is called by IntegrationManager which handles database updates
    // IntegrationManager will get the integration from database, merge config, and save
    return {
      id: integrationId,
      type: "TELEGRAM",
      name: "Telegram Integration",
      status: "CONNECTED",
      tenantId: "",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: config, // Return merged config (IntegrationManager handles the merge)
    } as TelegramIntegration;
  }

  /**
   * Get bot information
   */
  async getBotInfo(botToken: string): Promise<TelegramBotInfo> {
    try {
      const response = await axios.get(this.getApiUrl(botToken, "getMe"));
      const bot = response.data.result;

      return {
        id: bot.id,
        username: bot.username,
        firstName: bot.first_name,
        canJoinGroups: bot.can_join_groups,
        canReadAllGroupMessages: bot.can_read_all_group_messages,
      };
    } catch (error: any) {
      throw new Error(`Failed to get bot info: ${error.message}`);
    }
  }

  /**
   * Set webhook
   */
  async setWebhook(
    botToken: string,
    webhookUrl: string,
    secret?: string,
  ): Promise<void> {
    try {
      const params: any = {
        url: webhookUrl,
      };

      if (secret) {
        params.secret_token = secret;
      }

      await axios.post(this.getApiUrl(botToken, "setWebhook"), params);
    } catch (error: any) {
      throw new Error(`Failed to set webhook: ${error.message}`);
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(botToken: string): Promise<void> {
    try {
      await axios.post(this.getApiUrl(botToken, "deleteWebhook"));
    } catch (error: any) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  /**
   * Get webhook info
   */
  async getWebhookInfo(botToken: string): Promise<any> {
    try {
      const response = await axios.get(
        this.getApiUrl(botToken, "getWebhookInfo"),
      );
      return response.data.result;
    } catch (error: any) {
      throw new Error(`Failed to get webhook info: ${error.message}`);
    }
  }

  /**
   * Send message
   */
  async sendMessage(
    botToken: string,
    chatId: string,
    text: string,
    options?: {
      parseMode?: "HTML" | "Markdown" | "MarkdownV2";
      replyToMessageId?: number;
      disableNotification?: boolean;
    },
  ): Promise<TelegramMessage> {
    try {
      const response = await axios.post(
        this.getApiUrl(botToken, "sendMessage"),
        {
          chat_id: chatId,
          text,
          parse_mode: options?.parseMode,
          reply_to_message_id: options?.replyToMessageId,
          disable_notification: options?.disableNotification,
        },
      );

      const message = response.data.result;
      return {
        id: message.message_id,
        chatId: message.chat.id,
        text: message.text,
        from: message.from
          ? {
              id: message.from.id,
              firstName: message.from.first_name,
              username: message.from.username,
            }
          : undefined,
        timestamp: new Date(message.date * 1000),
      };
    } catch (error: any) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get updates (polling method - alternative to webhooks)
   */
  async getUpdates(
    botToken: string,
    offset?: number,
    limit: number = 100,
  ): Promise<TelegramMessage[]> {
    try {
      const response = await axios.get(this.getApiUrl(botToken, "getUpdates"), {
        params: {
          offset,
          limit,
        },
      });

      return (response.data.result || []).map((update: any) => ({
        id: update.message?.message_id || 0,
        chatId: update.message?.chat?.id || 0,
        text: update.message?.text,
        from: update.message?.from
          ? {
              id: update.message.from.id,
              firstName: update.message.from.first_name,
              username: update.message.from.username,
            }
          : undefined,
        timestamp: new Date((update.message?.date || 0) * 1000),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get updates: ${error.message}`);
    }
  }

  /**
   * Get chat information
   */
  async getChat(botToken: string, chatId: string): Promise<TelegramChatInfo> {
    try {
      const response = await axios.get(this.getApiUrl(botToken, "getChat"), {
        params: { chat_id: chatId },
      });

      const chat = response.data.result;
      return {
        id: chat.id,
        type: chat.type,
        title: chat.title,
        username: chat.username,
        memberCount: chat.members_count,
      };
    } catch (error: any) {
      throw new Error(`Failed to get chat info: ${error.message}`);
    }
  }

  /**
   * Handle webhook update
   */
  async handleWebhookUpdate(update: any): Promise<void> {
    // Process incoming webhook update from Telegram
    // This would typically save messages, trigger notifications, etc.
    this.emitEvent("message_received", { update }, "");
  }
}

export const telegramService = new TelegramService();
