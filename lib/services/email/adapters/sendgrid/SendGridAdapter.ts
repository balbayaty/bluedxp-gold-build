/**
 * SendGrid Email Adapter
 *
 * SendGrid email provider adapter
 * Requires SENDGRID_API_KEY environment variable
 *
 * Note: @sendgrid/mail package must be installed separately:
 * npm install @sendgrid/mail
 */

import type { EmailMessage, EmailSendResult } from "../../types";
import { EmailAdapterBase } from "../base/EmailAdapterBase";

// Lazy load SendGrid - only import if package is installed
// Using require() to avoid webpack static analysis
let sgMail: any = null;
async function loadSendGrid() {
  if (sgMail) return sgMail;
  try {
    // Use require() to avoid webpack static analysis
    sgMail = require("@sendgrid/mail");
    return sgMail;
  } catch (error) {
    throw new Error(
      "SendGrid package not installed. Install it with: npm install @sendgrid/mail",
    );
  }
}

export interface SendGridConfig {
  apiKey: string;
  from?: {
    email: string;
    name?: string;
  };
}

export class SendGridAdapter extends EmailAdapterBase {
  readonly id = "sendgrid";
  readonly name = "SendGrid";
  readonly provider = "SENDGRID" as const;

  private apiKey: string | null = null;

  constructor(config?: Record<string, any>) {
    super(config);
    if (config?.apiKey) {
      this.apiKey = config.apiKey;
    } else if (process.env.SENDGRID_API_KEY) {
      this.apiKey = process.env.SENDGRID_API_KEY;
    }
  }

  private ensureInitialized(): void {
    if (!this.apiKey) {
      throw new Error("SendGrid API key not configured");
    }
    loadSendGrid();
    sgMail.setApiKey(this.apiKey);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        return { success: false, message: "SendGrid API key not provided" };
      }

      try {
        loadSendGrid();
        // SendGrid doesn't have a direct test endpoint, so we'll just verify the API key is set
        return { success: true, message: "SendGrid API key configured" };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "SendGrid package not installed",
        };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "SendGrid connection failed",
      };
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    try {
      this.ensureInitialized();

      const fromAddress = message.from ||
        this.config.from || {
          email: process.env.SENDGRID_FROM_EMAIL || "noreply@example.com",
          name: "BlueDXP Platform",
        };

      const msg = {
        from: fromAddress,
        to: this.normalizeAddresses(message.to),
        cc: message.cc ? this.normalizeAddresses(message.cc) : undefined,
        bcc: message.bcc ? this.normalizeAddresses(message.bcc) : undefined,
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.htmlBody,
        text: message.textBody,
        attachments: message.attachments?.map((att) => ({
          content:
            typeof att.content === "string"
              ? att.content
              : att.content.toString("base64"),
          filename: att.filename,
          type: att.contentType,
          contentId: att.contentId,
          disposition: att.disposition || "attachment",
        })),
        customArgs: {
          moduleId: message.moduleId || "",
          entityId: message.entityId || "",
          entityType: message.entityType || "",
          tenantId: message.tenantId,
          ...(message.tags ? { tags: message.tags.join(",") } : {}),
        },
        trackingSettings: {
          clickTracking: {
            enable: message.trackingEnabled ?? true,
          },
          openTracking: {
            enable: message.trackingEnabled ?? true,
          },
        },
        mailSettings: {
          unsubscribe: message.unsubscribeUrl
            ? {
                enable: true,
                text: "Unsubscribe",
                html: `<a href="${message.unsubscribeUrl}">Unsubscribe</a>`,
              }
            : undefined,
        },
      };

      const [response] = await sgMail.send(msg);

      return {
        success: true,
        messageId: response.headers["x-message-id"] || `sg-${Date.now()}`,
        provider: "SENDGRID",
        providerResponse: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.body?.errors?.[0]?.message ||
          error.message ||
          "Failed to send email",
        errorCode: error.code || "SEND_FAILED",
        provider: "SENDGRID",
        providerResponse: error.response,
      };
    }
  }

  async getEmailStatus(
    messageId: string,
  ): Promise<import("../../types").EmailStatusUpdate | null> {
    // SendGrid provides webhook-based status updates
    // This would need to be implemented with webhook handlers
    // For now, return null as status tracking requires webhook setup
    return null;
  }

  async updateConfig(config: Partial<Record<string, any>>): Promise<void> {
    await super.updateConfig(config);
    if (config.apiKey) {
      this.apiKey = config.apiKey as string;
    }
  }
}
