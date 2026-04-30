/**
 * WhatsApp API Service
 * Multi-provider WhatsApp integration for customer approvals and notifications
 * Supports WhatsApp Business API, Twilio, and other providers
 */
import { apiFetch } from "@/utils/apiFetch";
import { callAI } from "@/utils/aiClient";

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  apiKey?: string;
  apiSecret?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  webhookVerifyToken?: string;
  baseUrl?: string;
  enabled: boolean;
}

export interface WhatsAppMessage {
  to: string; // Phone number in E.164 format (e.g., +966501234567)
  message: string;
  templateId?: string;
  templateParams?: Record<string, string>;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "video" | "audio";
  priority?: "high" | "normal" | "low";
}

export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  provider?: WhatsAppProvider;
  error?: string;
  timestamp?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  components: any[];
}

/**
 * WhatsApp Service Interface
 */
export interface IWhatsAppService {
  sendMessage(message: WhatsAppMessage): Promise<WhatsAppMessageResult>;
  sendTemplateMessage(
    templateId: string,
    to: string,
    params: Record<string, string>,
  ): Promise<WhatsAppMessageResult>;
  sendApprovalLink(
    to: string,
    approvalUrl: string,
    customerName?: string,
  ): Promise<WhatsAppMessageResult>;
  verifyWebhook(mode: string, token: string, challenge: string): string | null;
  handleWebhook(payload: any): Promise<void>;
  getTemplates(): Promise<WhatsAppTemplate[]>;
  isConfigured(): boolean;
}

/**
 * WhatsApp Service Implementation
 */
export class WhatsAppService implements IWhatsAppService {
  private config: WhatsAppConfig;
  private initialized: boolean = false;

  // [INTEGRATION] AI Client for Incident Analysis
  private aiClient = { callAI };

  constructor(config?: Partial<WhatsAppConfig>) {
    // Load config from environment or provided config
    this.config = {
      provider:
        (process.env.WHATSAPP_PROVIDER as WhatsAppProvider) ||
        "WHATSAPP_BUSINESS",
      apiKey: process.env.WHATSAPP_API_KEY || config?.apiKey,
      apiSecret: process.env.WHATSAPP_API_SECRET || config?.apiSecret,
      phoneNumberId:
        process.env.WHATSAPP_PHONE_NUMBER_ID || config?.phoneNumberId,
      businessAccountId:
        process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || config?.businessAccountId,
      webhookVerifyToken:
        process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || config?.webhookVerifyToken,
      baseUrl: process.env.WHATSAPP_BASE_URL || config?.baseUrl,
      enabled:
        process.env.WHATSAPP_ENABLED === "true" || config?.enabled || false,
    };

    this.initialized = this.isConfigured();
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    if (!this.config.enabled) return false;

    switch (this.config.provider) {
      case "WHATSAPP_BUSINESS":
      case "META_CLOUD_API":
        return !!(this.config.apiKey && this.config.phoneNumberId);
      case "TWILIO":
        return !!(this.config.apiKey && this.config.apiSecret);
      case "CUSTOM":
        return !!this.config.baseUrl;
      default:
        return false;
    }
  }

  /**
   * [INTEGRATION] Analyze a WhatsApp message to detect and extract incident details.
   * Uses "Deep Consensus" logic via the AI Client.
   */
  async analyzeIncidentReport(
    messageContent: string,
    senderPhone: string,
  ): Promise<any | null> {
    console.log(`Analyzing WhatsApp message from ${senderPhone}...`);

    const prompt = `
          Analyze this message from a WhatsApp logistics group for potential accident/incident reporting:
          
          Message: "${messageContent}"
          From: ${senderPhone}
          
          If this appears to be an accident or safety incident report, extract:
          1. Date/Time (infer from context if not explicit)
          2. Location
          3. People involved
          4. Description of incident
          5. Severity level (Low/Medium/High/Critical)
          6. Required actions
          
          Return ONLY a valid JSON object matching this structure:
          {
              "isIncident": boolean,
              "data": {
                  "timestamp": string,
                  "location": string,
                  "peopleInvolved": string[],
                  "description": string,
                  "severity": string,
                  "requiredActions": string[]
              },
              "confidence": number
          }
      `;

    try {
      // Use the BlueDXP standard AI client
      const result = await this.aiClient.callAI(
        [
          {
            role: "system",
            content: "You are an Expert Safety Incident Analyst.",
          },
          { role: "user", content: prompt },
        ],
        { provider: "auto", temperature: 0 },
      );

      // Parse the JSON response/markdown fence
      const cleanJson = result.content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.isIncident && parsed.data) {
        return {
          ...parsed.data,
          confidence: parsed.confidence || 0.9,
          source: "WHATSAPP_INTELLIGENCE",
        };
      }

      return null;
    } catch (error) {
      console.error("Error analyzing WhatsApp incident:", error);
      // Don't crash the service, just return null for analysis
      return null;
    }
  }

  /**
   * Send message
   */
  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppMessageResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "WhatsApp service is not configured",
        provider: this.config.provider,
      };
    }

    try {
      switch (this.config.provider) {
        case "WHATSAPP_BUSINESS":
        case "META_CLOUD_API":
          return await this.sendViaMetaAPI(message);
        case "TWILIO":
          return await this.sendViaTwilio(message);
        case "CUSTOM":
          return await this.sendViaCustom(message);
        default:
          return {
            success: false,
            error: `Unsupported provider: ${this.config.provider}`,
            provider: this.config.provider,
          };
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: this.config.provider,
      };
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(
    templateId: string,
    to: string,
    params: Record<string, string>,
  ): Promise<WhatsAppMessageResult> {
    const message: WhatsAppMessage = {
      to,
      message: "", // Template messages don't need message text
      templateId,
      templateParams: params,
    };

    return await this.sendMessage(message);
  }

  /**
   * Send approval link via WhatsApp
   */
  async sendApprovalLink(
    to: string,
    approvalUrl: string,
    customerName?: string,
  ): Promise<WhatsAppMessageResult> {
    const message = customerName
      ? `Hello ${customerName},\n\nYou have pending MSDS-SKU link approvals. Please review and approve:\n\n${approvalUrl}\n\nThis link will expire in 72 hours.`
      : `You have pending MSDS-SKU link approvals. Please review and approve:\n\n${approvalUrl}\n\nThis link will expire in 72 hours.`;

    return await this.sendMessage({
      to,
      message,
      priority: "high",
    });
  }

  /**
   * Send via Meta WhatsApp Business API
   */
  private async sendViaMetaAPI(
    message: WhatsAppMessage,
  ): Promise<WhatsAppMessageResult> {
    const url = `https://graph.facebook.com/v18.0/${this.config.phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: "whatsapp",
      to: message.to,
      type: "text",
      text: {
        body: message.message,
      },
    };

    // Add template if provided
    if (message.templateId) {
      payload.type = "template";
      payload.template = {
        name: message.templateId,
        language: { code: "en" },
        components: message.templateParams
          ? [
              {
                type: "body",
                parameters: Object.entries(message.templateParams).map(
                  ([key, value]) => ({
                    type: "text",
                    text: value,
                  }),
                ),
              },
            ]
          : [],
      };
    }

    // Add media if provided
    if (message.mediaUrl && message.mediaType) {
      payload.type = message.mediaType;
      payload[message.mediaType] = {
        link: message.mediaUrl,
      };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.messages && data.messages[0]) {
        return {
          success: true,
          messageId: data.messages[0].id,
          provider: "META_CLOUD_API",
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          error: data.error?.message || "Failed to send message",
          provider: "META_CLOUD_API",
        };
      }
    } catch (error) {
      throw new Error(
        `Meta API error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Send via Twilio
   */
  private async sendViaTwilio(
    message: WhatsAppMessage,
  ): Promise<WhatsAppMessageResult> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.businessAccountId}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("From", `whatsapp:${this.config.phoneNumberId}`);
    formData.append("To", `whatsapp:${message.to}`);
    formData.append("Body", message.message);

    if (message.mediaUrl) {
      formData.append("MediaUrl", message.mediaUrl);
    }

    try {
      const auth = Buffer.from(
        `${this.config.apiKey}:${this.config.apiSecret}`,
      ).toString("base64");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok && data.sid) {
        return {
          success: true,
          messageId: data.sid,
          provider: "TWILIO",
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to send message",
          provider: "TWILIO",
        };
      }
    } catch (error) {
      throw new Error(
        `Twilio error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Send via custom provider
   */
  private async sendViaCustom(
    message: WhatsAppMessage,
  ): Promise<WhatsAppMessageResult> {
    if (!this.config.baseUrl) {
      throw new Error("Custom provider base URL not configured");
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.config.apiKey
            ? `Bearer ${this.config.apiKey}`
            : "",
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: data.messageId || data.id,
          provider: "CUSTOM",
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          error: data.error || "Failed to send message",
          provider: "CUSTOM",
        };
      }
    } catch (error) {
      throw new Error(
        `Custom provider error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Verify webhook (for Meta API)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === "subscribe" && token === this.config.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Handle webhook
   */
  async handleWebhook(payload: any): Promise<void> {
    // Handle incoming WhatsApp messages/status updates
    console.log("WhatsApp webhook received:", payload);

    try {
      // Meta Cloud API webhook structure
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        console.warn("Invalid webhook payload structure");
        return;
      }

      // Process message status updates
      if (value.statuses && Array.isArray(value.statuses)) {
        for (const status of value.statuses) {
          await this.processStatusUpdate({
            messageId: status.id,
            recipientId: status.recipient_id,
            status: status.status, // sent, delivered, read, failed
            timestamp: new Date(parseInt(status.timestamp) * 1000),
            errors: status.errors,
          });
        }
      }

      // Process incoming messages
      if (value.messages && Array.isArray(value.messages)) {
        for (const message of value.messages) {
          await this.processIncomingMessage({
            messageId: message.id,
            from: message.from,
            timestamp: new Date(parseInt(message.timestamp) * 1000),
            type: message.type,
            text: message.text?.body,
            media:
              message.image ||
              message.document ||
              message.audio ||
              message.video,
          });
        }
      }

      // Process contact updates
      if (value.contacts && Array.isArray(value.contacts)) {
        for (const contact of value.contacts) {
          console.log("Contact update:", contact.wa_id, contact.profile?.name);
        }
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
    }
  }

  /**
   * Process message status update
   */
  private async processStatusUpdate(status: {
    messageId: string;
    recipientId: string;
    status: string;
    timestamp: Date;
    errors?: any[];
  }): Promise<void> {
    console.log(
      `📱 WhatsApp status update: ${status.messageId} -> ${status.status}`,
    );

    // Update message status in database
    try {
      const { prisma } = await import("@/lib/services/database/prismaClient");

      // Update notification record if exists
      await prisma.notificationRecord
        .updateMany({
          where: {
            data: {
              path: ["whatsappMessageId"],
              equals: status.messageId,
            },
          },
          data: {
            status:
              status.status === "read"
                ? "read"
                : status.status === "delivered"
                  ? "sent"
                  : status.status === "failed"
                    ? "failed"
                    : "pending",
          },
        })
        .catch(() => {
          // Ignore if notification not found
        });

      // Emit event for tracking
      const { eventBus } = await import("@/lib/services/event-store");
      await eventBus.publish({
        type: "whatsapp.message.status",
        payload: status,
        timestamp: new Date(),
        source: "whatsapp-webhook",
      });
    } catch (error) {
      console.warn("Error updating message status:", error);
    }
  }

  /**
   * Process incoming WhatsApp message
   */
  private async processIncomingMessage(message: {
    messageId: string;
    from: string;
    timestamp: Date;
    type: string;
    text?: string;
    media?: any;
  }): Promise<void> {
    console.log(
      `📱 WhatsApp incoming message from ${message.from}: ${message.type}`,
    );

    try {
      // Emit event for message handling
      const { eventBus } = await import("@/lib/services/event-store");
      await eventBus.publish({
        type: "whatsapp.message.received",
        payload: {
          messageId: message.messageId,
          from: message.from,
          timestamp: message.timestamp,
          type: message.type,
          text: message.text,
          hasMedia: !!message.media,
        },
        timestamp: new Date(),
        source: "whatsapp-webhook",
      });

      // Send notification about incoming message
      const { notificationService } =
        await import("@/lib/services/notifications/notificationService");
      await notificationService.send({
        type: "info" as any,
        title: "New WhatsApp Message",
        message: `Incoming message from ${message.from}`,
        channel: "in-app",
        data: {
          from: message.from,
          messageId: message.messageId,
          type: message.type,
        },
      });
    } catch (error) {
      console.warn("Error processing incoming message:", error);
    }
  }

  /**
   * Get available templates
   */
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      if (
        this.config.provider === "META_CLOUD_API" ||
        this.config.provider === "WHATSAPP_BUSINESS"
      ) {
        const url = `https://graph.facebook.com/v18.0/${this.config.businessAccountId}/message_templates`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        });

        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }

    return [];
  }
}

// Singleton instance
let whatsappServiceInstance: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService {
  if (!whatsappServiceInstance) {
    whatsappServiceInstance = new WhatsAppService();
  }
  return whatsappServiceInstance;
}

export const whatsappService = getWhatsAppService();
