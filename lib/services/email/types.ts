/**
 * Email Service Types
 *
 * Comprehensive type definitions for the centralized Email Service Module
 * Supports multi-tenant, multi-provider, event-driven email architecture
 */

// ============================================================================
// EMAIL PROVIDER TYPES
// ============================================================================

export type EmailProvider =
  | "SMTP"
  | "SENDGRID"
  | "AWS_SES"
  | "MAILGUN"
  | "POSTMARK"
  | "RESEND"
  | "CUSTOM";

export type EmailPriority = "low" | "normal" | "high" | "urgent";

export type EmailStatus =
  | "pending"
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed"
  | "opened"
  | "clicked"
  | "complained"
  | "unsubscribed";

// ============================================================================
// EMAIL MESSAGE TYPES
// ============================================================================

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  contentId?: string;
  disposition?: "attachment" | "inline";
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  variables?: string[]; // List of variable names used in template
  tenantId?: string;
  moduleId?: string; // Which module this template belongs to
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailMessage {
  id?: string;
  tenantId: string;
  from: EmailAddress;
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  attachments?: EmailAttachment[];
  priority?: EmailPriority;
  scheduledFor?: Date;
  tags?: string[]; // For categorization and filtering
  metadata?: Record<string, any>; // Additional metadata
  moduleId?: string; // Which module requested this email
  entityId?: string; // Related entity ID (e.g., shipment ID, ASN ID)
  entityType?: string; // Related entity type
  trackingEnabled?: boolean; // Enable open/click tracking
  unsubscribeUrl?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider?: EmailProvider;
  error?: string;
  errorCode?: string;
  providerResponse?: any;
}

export interface EmailStatusUpdate {
  messageId: string;
  status: EmailStatus;
  timestamp: Date;
  details?: any;
  provider?: EmailProvider;
}

// ============================================================================
// EMAIL CONFIGURATION TYPES
// ============================================================================

export interface EmailProviderConfig {
  provider: EmailProvider;
  enabled: boolean;
  priority?: number; // Lower number = higher priority (for failover)
  config: Record<string, any>; // Provider-specific configuration
}

export interface EmailServiceConfig {
  defaultProvider: EmailProvider;
  providers: EmailProviderConfig[];
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
  rateLimit?: {
    maxEmails: number;
    windowMs: number;
  };
  bounceHandling?: {
    enabled: boolean;
    bounceThreshold?: number; // Auto-disable after N bounces
  };
  tracking?: {
    enabled: boolean;
    openTracking?: boolean;
    clickTracking?: boolean;
  };
}

export interface TenantEmailConfig {
  tenantId: string;
  config: EmailServiceConfig;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// EMAIL QUERY TYPES
// ============================================================================

export interface EmailQuery {
  tenantId: string;
  messageId?: string;
  status?: EmailStatus | EmailStatus[];
  moduleId?: string;
  entityId?: string;
  entityType?: string;
  from?: Date;
  to?: Date;
  provider?: EmailProvider;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface EmailStats {
  tenantId: string;
  total: number;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  opened: number;
  clicked: number;
  byStatus: Record<EmailStatus, number>;
  byModule: Record<string, number>;
  byProvider: Record<EmailProvider, number>;
  period: {
    from: Date;
    to: Date;
  };
}

// ============================================================================
// EMAIL EVENT TYPES
// ============================================================================

export interface EmailSendEvent {
  type: "email.send";
  payload: EmailMessage;
  timestamp: Date;
  source: string; // Module that requested the email
}

export interface EmailStatusEvent {
  type: "email.status";
  payload: EmailStatusUpdate;
  timestamp: Date;
  source: string;
}

export interface EmailBounceEvent {
  type: "email.bounce";
  payload: {
    messageId: string;
    email: string;
    bounceType: "hard" | "soft";
    reason: string;
    timestamp: Date;
  };
  timestamp: Date;
  source: string;
}

// ============================================================================
// EMAIL ADAPTER INTERFACE
// ============================================================================

export interface EmailAdapter {
  readonly id: string;
  readonly name: string;
  readonly provider: EmailProvider;

  /**
   * Test connection to email provider
   */
  testConnection(): Promise<{ success: boolean; message: string }>;

  /**
   * Send email
   */
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;

  /**
   * Get email status
   */
  getEmailStatus?(messageId: string): Promise<EmailStatusUpdate | null>;

  /**
   * Validate email address
   */
  validateEmail?(email: string): Promise<boolean>;

  /**
   * Get provider-specific configuration
   */
  getConfig(): Record<string, any>;

  /**
   * Update provider-specific configuration
   */
  updateConfig(config: Partial<Record<string, any>>): Promise<void>;
}

// ============================================================================
// EMAIL SERVICE INTERFACE
// ============================================================================

export interface IEmailService {
  /**
   * Send email
   */
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;

  /**
   * Send email using template
   */
  sendTemplateEmail(
    templateId: string,
    to: EmailAddress | EmailAddress[],
    variables: Record<string, any>,
    options?: Partial<EmailMessage>,
  ): Promise<EmailSendResult>;

  /**
   * Get email status
   */
  getEmailStatus(
    messageId: string,
    tenantId: string,
  ): Promise<EmailStatusUpdate | null>;

  /**
   * Query emails
   */
  queryEmails(query: EmailQuery): Promise<EmailMessage[]>;

  /**
   * Get email statistics
   */
  getEmailStats(tenantId: string, from?: Date, to?: Date): Promise<EmailStats>;

  /**
   * Template management
   */
  createTemplate(
    template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<EmailTemplate>;
  getTemplate(
    templateId: string,
    tenantId: string,
  ): Promise<EmailTemplate | null>;
  updateTemplate(
    templateId: string,
    updates: Partial<EmailTemplate>,
  ): Promise<EmailTemplate>;
  deleteTemplate(templateId: string, tenantId: string): Promise<boolean>;
  listTemplates(tenantId: string, moduleId?: string): Promise<EmailTemplate[]>;

  /**
   * Configuration management
   */
  getConfig(tenantId: string): Promise<EmailServiceConfig>;
  updateConfig(
    tenantId: string,
    config: Partial<EmailServiceConfig>,
  ): Promise<void>;

  /**
   * Provider management
   */
  registerProvider(adapter: EmailAdapter): void;
  getProvider(provider: EmailProvider): EmailAdapter | null;
  listProviders(): EmailAdapter[];
}
