/**
 * External Integrations Module
 * Central export point for all external integration services
 */

// Services
export { BaseIntegrationService } from "./baseIntegrationService";
export { linkedInService } from "./linkedInService";
export { telegramService } from "./telegramService";
export { newsSiteService } from "./newsSiteService";
export { genericSiteService } from "./genericSiteService";
export {
  integrationManager,
  getIntegrationManager,
} from "./integrationManager";
export { integrationDatabaseAdapter } from "./integrationDatabaseAdapter";

// Types (re-export for convenience)
export type {
  BaseIntegration,
  IntegrationType,
  IntegrationStatus,
  IntegrationDisplayMode,
  LinkedInIntegration,
  LinkedInProfile,
  LinkedInCompany,
  LinkedInPost,
  TelegramIntegration,
  TelegramBotInfo,
  TelegramChatInfo,
  TelegramMessage,
  WhatsAppIntegration,
  NewsSiteIntegration,
  NewsArticle,
  GenericSiteIntegration,
  IntegrationWidget,
  IntegrationEvent,
  IIntegrationService,
  IntegrationResponse,
} from "@/types/external-integrations";
