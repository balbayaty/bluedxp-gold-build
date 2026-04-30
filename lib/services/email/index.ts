/**
 * Email Service - Main Export
 *
 * Centralized email service module for BlueDXP Platform
 * Provides unified email functionality for all modules
 */

export { emailService } from "./emailService";
export type { EmailService } from "./types";
export { templateService, TemplateService } from "./templates/templateService";
export {
  initializeEmailEventIntegration,
  sendEmailViaEvent,
} from "./integration/eventIntegration";

// Export types
export type {
  EmailMessage,
  EmailSendResult,
  EmailStatusUpdate,
  EmailQuery,
  EmailStats,
  EmailTemplate,
  EmailServiceConfig,
  EmailProvider,
  EmailAdapter,
  EmailAddress,
  EmailAttachment,
  IEmailService,
} from "./types";

// Export adapters
export {
  EmailAdapterBase,
  SMTPAdapter,
  SendGridAdapter,
  AWSSESAdapter,
  type SMTPConfig,
  type SendGridConfig,
  type AWSSESConfig,
} from "./adapters";
