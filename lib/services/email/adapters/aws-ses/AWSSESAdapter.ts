/**
 * AWS SES Email Adapter
 *
 * Amazon Simple Email Service (SES) adapter
 * Requires AWS credentials (via environment variables or IAM role)
 *
 * Note: @aws-sdk/client-ses package must be installed separately:
 * npm install @aws-sdk/client-ses
 */

import type { EmailMessage, EmailSendResult } from "../../types";
import { EmailAdapterBase } from "../base/EmailAdapterBase";

// Lazy load AWS SDK - only import if package is installed
// Using require() to avoid webpack static analysis
let SESClient: any = null;
let SendEmailCommand: any = null;
function loadAWSSES() {
  if (SESClient) return { SESClient, SendEmailCommand };
  try {
    // Use require() to avoid webpack static analysis
    const awsSes = require("@aws-sdk/client-ses");
    SESClient = awsSes.SESClient;
    SendEmailCommand = awsSes.SendEmailCommand;
    return { SESClient, SendEmailCommand };
  } catch (error) {
    throw new Error(
      "AWS SES package not installed. Install it with: npm install @aws-sdk/client-ses",
    );
  }
}

export interface AWSSESConfig {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  from?: {
    email: string;
    name?: string;
  };
}

export class AWSSESAdapter extends EmailAdapterBase {
  readonly id = "aws-ses";
  readonly name = "AWS SES";
  readonly provider = "AWS_SES" as const;

  private client: SESClient | null = null;

  constructor(config?: Record<string, any>) {
    super(config);
    this.initializeClient();
  }

  private initializeClient(): void {
    const config: AWSSESConfig = this.config as AWSSESConfig;

    const { SESClient: SESClientClass } = loadAWSSES();
    this.client = new SESClientClass({
      region: config.region || process.env.AWS_REGION || "us-east-1",
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined, // Will use IAM role or environment variables
    });
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      try {
        if (!this.client) {
          this.initializeClient();
        }

        if (!this.client) {
          return {
            success: false,
            message: "Failed to initialize AWS SES client",
          };
        }

        return { success: true, message: "AWS SES client initialized" };
      } catch (error) {
        if (error instanceof Error && error.message.includes("not installed")) {
          return { success: false, message: error.message };
        }
        throw error;
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "AWS SES connection failed",
      };
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    try {
      try {
        if (!this.client) {
          this.initializeClient();
        }

        if (!this.client) {
          return {
            success: false,
            error: "AWS SES client not initialized",
            errorCode: "CLIENT_NOT_INITIALIZED",
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

      const { SendEmailCommand: SendEmailCommandClass } = loadAWSSES();

      const fromAddress = message.from ||
        this.config.from || {
          email: process.env.AWS_SES_FROM_EMAIL || "noreply@example.com",
          name: "BlueDXP Platform",
        };

      const toAddresses = this.normalizeAddresses(message.to).map(
        (addr) => addr.email,
      );
      const ccAddresses = message.cc
        ? this.normalizeAddresses(message.cc).map((addr) => addr.email)
        : undefined;
      const bccAddresses = message.bcc
        ? this.normalizeAddresses(message.bcc).map((addr) => addr.email)
        : undefined;

      // If we have HTML or attachments, we need to use SendRawEmailCommand
      // For simple text/HTML emails, we can use SendEmailCommand
      if (message.attachments && message.attachments.length > 0) {
        // For attachments, we'd need to construct a raw email
        // This is a simplified version - full implementation would use nodemailer to create raw email
        return {
          success: false,
          error: "Attachments not yet supported in AWS SES adapter",
          errorCode: "FEATURE_NOT_IMPLEMENTED",
        };
      }

      const command = new SendEmailCommandClass({
        Source: fromAddress.name
          ? `${fromAddress.name} <${fromAddress.email}>`
          : fromAddress.email,
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: ccAddresses,
          BccAddresses: bccAddresses,
        },
        Message: {
          Subject: {
            Data: message.subject,
            Charset: "UTF-8",
          },
          Body: {
            ...(message.htmlBody
              ? {
                  Html: {
                    Data: message.htmlBody,
                    Charset: "UTF-8",
                  },
                }
              : {}),
            ...(message.textBody
              ? {
                  Text: {
                    Data: message.textBody,
                    Charset: "UTF-8",
                  },
                }
              : {}),
          },
        },
        ReplyToAddresses: message.replyTo ? [message.replyTo.email] : undefined,
        Tags: [
          ...(message.moduleId
            ? [{ Name: "ModuleId", Value: message.moduleId }]
            : []),
          ...(message.entityId
            ? [{ Name: "EntityId", Value: message.entityId }]
            : []),
          ...(message.entityType
            ? [{ Name: "EntityType", Value: message.entityType }]
            : []),
          { Name: "TenantId", Value: message.tenantId },
          ...(message.tags?.map((tag) => ({ Name: "Tag", Value: tag })) || []),
        ],
      });

      const response = await this.client.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        provider: "AWS_SES",
        providerResponse: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to send email via AWS SES",
        errorCode: error.name || "SEND_FAILED",
        provider: "AWS_SES",
        providerResponse: error,
      };
    }
  }

  async updateConfig(config: Partial<Record<string, any>>): Promise<void> {
    await super.updateConfig(config);
    this.client = null; // Reset client to reinitialize with new config
  }
}
