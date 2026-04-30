/**
 * SMTP Email Adapter
 *
 * Standard SMTP email adapter using nodemailer
 * Supports any SMTP server (Gmail, Outlook, custom SMTP, etc.)
 *
 * Note: nodemailer package must be installed separately:
 * npm install nodemailer
 */

import type { Transporter } from "nodemailer";
import type { EmailMessage, EmailSendResult } from "../../types";
import { EmailAdapterBase } from "../base/EmailAdapterBase";

// Lazy load nodemailer - only import if package is installed
// Using require() to avoid webpack static analysis
// Only load on server side (nodemailer uses Node.js fs module)
let nodemailer: any = null;
function loadNodemailer() {
  // Only load on server side
  if (typeof window !== "undefined") {
    throw new Error("nodemailer can only be used on the server side");
  }

  if (nodemailer) return nodemailer;
  try {
    // Use require() to avoid webpack static analysis
    nodemailer = require("nodemailer");
    return nodemailer;
  } catch (error) {
    throw new Error(
      "nodemailer package not installed. Install it with: npm install nodemailer",
    );
  }
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure?: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
  from?: {
    email: string;
    name?: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
}

export class SMTPAdapter extends EmailAdapterBase {
  readonly id = "smtp";
  readonly name = "SMTP";
  readonly provider = "SMTP" as const;

  private transporter: Transporter | null = null;
  private smtpConfig: SMTPConfig | null = null;

  constructor(config?: Record<string, any>) {
    super(config);
    if (config) {
      this.smtpConfig = config as SMTPConfig;
      this.initializeTransporter();
    }
  }

  private initializeTransporter(): void {
    if (!this.smtpConfig) return;

    loadNodemailer();
    this.transporter = nodemailer.createTransport({
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure ?? this.smtpConfig.port === 465,
      auth: {
        user: this.smtpConfig.auth.user,
        pass: this.smtpConfig.auth.pass,
      },
      tls: this.smtpConfig.tls,
    });
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.smtpConfig) {
        return { success: false, message: "SMTP configuration not provided" };
      }

      try {
        if (!this.transporter) {
          this.initializeTransporter();
        }

        if (!this.transporter) {
          return {
            success: false,
            message: "Failed to initialize SMTP transporter",
          };
        }

        await this.transporter.verify();
        return { success: true, message: "SMTP connection successful" };
      } catch (error) {
        if (error instanceof Error && error.message.includes("not installed")) {
          return { success: false, message: error.message };
        }
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "SMTP connection failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "SMTP connection failed",
      };
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    try {
      if (!this.smtpConfig) {
        return {
          success: false,
          error: "SMTP configuration not provided",
          errorCode: "CONFIG_MISSING",
        };
      }

      try {
        if (!this.transporter) {
          this.initializeTransporter();
        }

        if (!this.transporter) {
          return {
            success: false,
            error: "Failed to initialize SMTP transporter",
            errorCode: "INIT_FAILED",
          };
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("not installed")) {
          return {
            success: false,
            error: error.message,
            errorCode: "PACKAGE_NOT_INSTALLED",
          };
        }
        throw error;
      }

      // Use default from if not provided in message
      const fromAddress = message.from ||
        this.smtpConfig?.from || {
          email: this.smtpConfig?.auth.user || "noreply@example.com",
          name: "BlueDXP Platform",
        };

      const mailOptions = {
        from: this.formatAddresses([fromAddress]),
        to: this.formatAddresses(this.normalizeAddresses(message.to)),
        cc: message.cc
          ? this.formatAddresses(this.normalizeAddresses(message.cc))
          : undefined,
        bcc: message.bcc
          ? this.formatAddresses(this.normalizeAddresses(message.bcc))
          : undefined,
        replyTo: message.replyTo
          ? this.formatAddresses([message.replyTo])
          : undefined,
        subject: message.subject,
        html: message.htmlBody,
        text: message.textBody,
        attachments: message.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          cid: att.contentId,
          contentDisposition: att.disposition || "attachment",
        })),
        headers: {
          "X-Module-ID": message.moduleId || "",
          "X-Entity-ID": message.entityId || "",
          "X-Entity-Type": message.entityType || "",
          "X-Tenant-ID": message.tenantId,
          ...(message.tags ? { "X-Tags": message.tags.join(",") } : {}),
        },
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        provider: "SMTP",
        providerResponse: info,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
        errorCode: "SEND_FAILED",
        provider: "SMTP",
        providerResponse: error,
      };
    }
  }

  async updateConfig(config: Partial<Record<string, any>>): Promise<void> {
    await super.updateConfig(config);
    this.smtpConfig = { ...this.smtpConfig, ...config } as SMTPConfig;
    this.transporter = null; // Reset transporter to reinitialize with new config
  }
}
