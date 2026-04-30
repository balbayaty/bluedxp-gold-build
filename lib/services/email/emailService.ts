/**
 * Email Service - Core Service
 *
 * Centralized email service for BlueDXP Platform
 * Handles all email operations with multi-tenant, multi-provider support
 * Integrates with Event Bus for cross-module communication
 */

import type {
  IEmailService,
  EmailMessage,
  EmailSendResult,
  EmailStatusUpdate,
  EmailQuery,
  EmailStats,
  EmailTemplate,
  EmailServiceConfig,
  EmailProvider,
  EmailAdapter,
} from "./types";
import { SMTPAdapter } from "./adapters/smtp/SMTPAdapter";
import { SendGridAdapter } from "./adapters/sendgrid/SendGridAdapter";
import { AWSSESAdapter } from "./adapters/aws-ses/AWSSESAdapter";
import { templateService } from "./templates/templateService";
import { prisma } from "@/lib/services/database/prismaClient";

// ============================================================================
// EMAIL STORE (In-memory, will be replaced with database)
// ============================================================================

class EmailStore {
  private emails: Map<
    string,
    EmailMessage & { status?: string; sentAt?: Date }
  > = new Map();
  private useDb: boolean = process.env.NODE_ENV === "production";

  async save(
    email: EmailMessage & { status?: string; sentAt?: Date },
  ): Promise<void> {
    if (this.useDb) {
      // TODO: Store in database when email table is created
    }
    this.emails.set(email.id || `email-${Date.now()}`, email);
  }

  async get(
    messageId: string,
    tenantId: string,
  ): Promise<(EmailMessage & { status?: string; sentAt?: Date }) | null> {
    const email = this.emails.get(messageId);
    if (!email || email.tenantId !== tenantId) return null;
    return email;
  }

  async query(
    query: EmailQuery,
  ): Promise<(EmailMessage & { status?: string; sentAt?: Date })[]> {
    let emails = Array.from(this.emails.values()).filter(
      (e) => e.tenantId === query.tenantId,
    );

    if (query.messageId) {
      emails = emails.filter((e) => e.id === query.messageId);
    }

    if (query.status) {
      const statuses = Array.isArray(query.status)
        ? query.status
        : [query.status];
      emails = emails.filter((e) => statuses.includes(e.status as any));
    }

    if (query.moduleId) {
      emails = emails.filter((e) => e.moduleId === query.moduleId);
    }

    if (query.entityId) {
      emails = emails.filter((e) => e.entityId === query.entityId);
    }

    if (query.entityType) {
      emails = emails.filter((e) => e.entityType === query.entityType);
    }

    if (query.from) {
      emails = emails.filter(
        (e) => e.sentAt && new Date(e.sentAt) >= query.from!,
      );
    }

    if (query.to) {
      emails = emails.filter(
        (e) => e.sentAt && new Date(e.sentAt) <= query.to!,
      );
    }

    if (query.provider) {
      // Provider info would need to be stored with email
    }

    if (query.tags) {
      emails = emails.filter(
        (e) => e.tags && query.tags!.some((tag) => e.tags!.includes(tag)),
      );
    }

    // Apply limit and offset
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    emails = emails.slice(offset, offset + limit);

    return emails;
  }
}

const emailStore = new EmailStore();

// ============================================================================
// EMAIL SERVICE IMPLEMENTATION
// ============================================================================

class EmailService implements IEmailService {
  private adapters: Map<EmailProvider, EmailAdapter> = new Map();
  private defaultProvider: EmailProvider = "SMTP";
  private tenantConfigs: Map<string, EmailServiceConfig> = new Map();

  constructor() {
    this.initializeDefaultAdapters();
  }

  /**
   * Initialize default email adapters
   * Handles missing packages gracefully
   * Only runs on server side (adapters use Node.js modules)
   */
  private initializeDefaultAdapters(): void {
    // Only initialize on server side
    if (typeof window !== "undefined") {
      return;
    }

    // Initialize SMTP adapter if configured
    if (process.env.SMTP_HOST) {
      try {
        const smtpAdapter = new SMTPAdapter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER || "",
            pass: process.env.SMTP_PASSWORD || "",
          },
          from: {
            email: process.env.SMTP_FROM_EMAIL || "noreply@example.com",
            name: process.env.SMTP_FROM_NAME || "BlueDXP Platform",
          },
        });
        this.registerProvider(smtpAdapter);
        this.defaultProvider = "SMTP";
      } catch (error) {
        console.warn(
          "⚠️  SMTP adapter not available:",
          error instanceof Error ? error.message : "Unknown error",
        );
        console.warn("   Install nodemailer: npm install nodemailer");
      }
    }

    // Initialize SendGrid adapter if configured
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sendGridAdapter = new SendGridAdapter({
          apiKey: process.env.SENDGRID_API_KEY,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || "noreply@example.com",
            name: process.env.SENDGRID_FROM_NAME || "BlueDXP Platform",
          },
        });
        this.registerProvider(sendGridAdapter);
        if (!process.env.SMTP_HOST) {
          this.defaultProvider = "SENDGRID";
        }
      } catch (error) {
        console.warn(
          "⚠️  SendGrid adapter not available:",
          error instanceof Error ? error.message : "Unknown error",
        );
        console.warn("   Install @sendgrid/mail: npm install @sendgrid/mail");
      }
    }

    // Initialize AWS SES adapter if configured
    if (process.env.AWS_SES_REGION || process.env.AWS_REGION) {
      try {
        const awsSesAdapter = new AWSSESAdapter({
          region: process.env.AWS_SES_REGION || process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          from: {
            email: process.env.AWS_SES_FROM_EMAIL || "noreply@example.com",
            name: process.env.AWS_SES_FROM_NAME || "BlueDXP Platform",
          },
        });
        this.registerProvider(awsSesAdapter);
        if (!process.env.SMTP_HOST && !process.env.SENDGRID_API_KEY) {
          this.defaultProvider = "AWS_SES";
        }
      } catch (error) {
        console.warn(
          "⚠️  AWS SES adapter not available:",
          error instanceof Error ? error.message : "Unknown error",
        );
        console.warn(
          "   Install @aws-sdk/client-ses: npm install @aws-sdk/client-ses",
        );
      }
    }
  }

  /**
   * Register email provider adapter
   */
  registerProvider(adapter: EmailAdapter): void {
    this.adapters.set(adapter.provider, adapter);
    console.log(
      `✅ Registered email provider: ${adapter.name} (${adapter.provider})`,
    );
  }

  /**
   * Get email provider adapter
   */
  getProvider(provider: EmailProvider): EmailAdapter | null {
    return this.adapters.get(provider) || null;
  }

  /**
   * List all registered providers
   */
  listProviders(): EmailAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get provider for tenant (with failover support)
   */
  private async getProviderForTenant(
    tenantId: string,
  ): Promise<EmailAdapter | null> {
    const config = await this.getConfig(tenantId);

    // Try configured providers in priority order
    const providers = config.providers
      .filter((p) => p.enabled)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));

    for (const providerConfig of providers) {
      const adapter = this.adapters.get(providerConfig.provider);
      if (adapter) {
        // Test connection
        const test = await adapter.testConnection();
        if (test.success) {
          return adapter;
        }
      }
    }

    // Fallback to default provider
    return this.adapters.get(this.defaultProvider) || null;
  }

  /**
   * Send email
   */
  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    try {
      // Validate message
      if (!message.tenantId) {
        return {
          success: false,
          error: "Tenant ID is required",
          errorCode: "VALIDATION_ERROR",
        };
      }

      if (!message.to) {
        return {
          success: false,
          error: "Recipient is required",
          errorCode: "VALIDATION_ERROR",
        };
      }

      if (!message.subject) {
        return {
          success: false,
          error: "Subject is required",
          errorCode: "VALIDATION_ERROR",
        };
      }

      // Generate message ID if not provided
      if (!message.id) {
        message.id = `email-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      }

      // Get provider for tenant
      const adapter = await this.getProviderForTenant(message.tenantId);
      if (!adapter) {
        return {
          success: false,
          error: "No email provider available",
          errorCode: "PROVIDER_NOT_AVAILABLE",
        };
      }

      // Send email
      const result = await adapter.sendEmail(message);

      // Store email record
      await emailStore.save({
        ...message,
        status: result.success ? "sent" : "failed",
        sentAt: new Date(),
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
        errorCode: "SEND_ERROR",
      };
    }
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(
    templateId: string,
    to: EmailMessage["to"],
    variables: Record<string, any>,
    options?: Partial<EmailMessage>,
  ): Promise<EmailSendResult> {
    try {
      const tenantId = options?.tenantId || "default";
      const template = await templateService.getTemplate(templateId, tenantId);

      if (!template) {
        return {
          success: false,
          error: `Template not found: ${templateId}`,
          errorCode: "TEMPLATE_NOT_FOUND",
        };
      }

      // Render template
      const rendered = templateService.renderTemplate(template, variables);

      // Create email message
      const message: EmailMessage = {
        ...options,
        tenantId,
        to,
        subject: rendered.subject,
        htmlBody: rendered.htmlBody,
        textBody: rendered.textBody,
        templateId,
        templateVariables: variables,
      };

      return this.sendEmail(message);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send template email",
        errorCode: "TEMPLATE_SEND_ERROR",
      };
    }
  }

  /**
   * Get email status
   */
  async getEmailStatus(
    messageId: string,
    tenantId: string,
  ): Promise<EmailStatusUpdate | null> {
    const email = await emailStore.get(messageId, tenantId);
    if (!email) return null;

    return {
      messageId: email.id || messageId,
      status: (email.status as any) || "unknown",
      timestamp: email.sentAt || new Date(),
    };
  }

  /**
   * Query emails
   */
  async queryEmails(query: EmailQuery): Promise<EmailMessage[]> {
    return emailStore.query(query);
  }

  /**
   * Get email statistics
   */
  async getEmailStats(
    tenantId: string,
    from?: Date,
    to?: Date,
  ): Promise<EmailStats> {
    const emails = await emailStore.query({
      tenantId,
      from,
      to,
    });

    const stats: EmailStats = {
      tenantId,
      total: emails.length,
      sent: 0,
      delivered: 0,
      bounced: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
      byStatus: {} as Record<string, number>,
      byModule: {} as Record<string, number>,
      byProvider: {} as Record<EmailProvider, number>,
      period: {
        from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
        to: to || new Date(),
      },
    };

    emails.forEach((email) => {
      const status = email.status || "unknown";
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      if (status === "sent") stats.sent++;
      if (status === "delivered") stats.delivered++;
      if (status === "bounced") stats.bounced++;
      if (status === "failed") stats.failed++;
      if (status === "opened") stats.opened++;
      if (status === "clicked") stats.clicked++;

      if (email.moduleId) {
        stats.byModule[email.moduleId] =
          (stats.byModule[email.moduleId] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Template management
   */
  async createTemplate(
    template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<EmailTemplate> {
    return templateService.createTemplate(template);
  }

  async getTemplate(
    templateId: string,
    tenantId: string,
  ): Promise<EmailTemplate | null> {
    return templateService.getTemplate(templateId, tenantId);
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<EmailTemplate>,
  ): Promise<EmailTemplate> {
    const updated = await templateService.updateTemplate(templateId, updates);
    if (!updated) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return updated;
  }

  async deleteTemplate(templateId: string, tenantId: string): Promise<boolean> {
    return templateService.deleteTemplate(templateId, tenantId);
  }

  async listTemplates(
    tenantId: string,
    moduleId?: string,
  ): Promise<EmailTemplate[]> {
    return templateService.listTemplates(tenantId, moduleId);
  }

  /**
   * Configuration management
   */
  async getConfig(tenantId: string): Promise<EmailServiceConfig> {
    const cached = this.tenantConfigs.get(tenantId);
    if (cached) return cached;

    // Default configuration
    const defaultConfig: EmailServiceConfig = {
      defaultProvider: this.defaultProvider,
      providers: Array.from(this.adapters.values()).map((adapter) => ({
        provider: adapter.provider,
        enabled: true,
        config: adapter.getConfig(),
      })),
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        maxEmails: 1000,
        windowMs: 60 * 60 * 1000, // 1 hour
      },
      bounceHandling: {
        enabled: true,
        bounceThreshold: 5,
      },
      tracking: {
        enabled: true,
        openTracking: true,
        clickTracking: true,
      },
    };

    this.tenantConfigs.set(tenantId, defaultConfig);
    return defaultConfig;
  }

  async updateConfig(
    tenantId: string,
    config: Partial<EmailServiceConfig>,
  ): Promise<void> {
    const current = await this.getConfig(tenantId);
    const updated: EmailServiceConfig = {
      ...current,
      ...config,
      providers: config.providers || current.providers,
    };
    this.tenantConfigs.set(tenantId, updated);
  }
}

// Singleton instance
export const emailService = new EmailService();
