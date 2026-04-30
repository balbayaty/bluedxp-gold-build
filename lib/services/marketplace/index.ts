/**
 * Marketplace Services Index
 * Export all marketplace services
 */

export { marketplaceService } from "./marketplaceService";
export { storageMarketplaceService } from "./storageMarketplaceService";
export { marketplaceNotificationService } from "./marketplaceNotificationService";
export { marketplaceRealtimeService } from "./marketplaceRealtimeService";
export { marketplaceExportService } from "./marketplaceExportService";
export { favoritesService } from "./favoritesService";
export { paymentService } from "./paymentService";
export { invoiceService } from "./invoiceService";
export { pricingService } from "./pricingService";
export { commissionService } from "./commissionService";
export { providerVerificationService } from "./providerVerificationService";
export { wmsIntegrationService } from "./wmsIntegration";
export { tmsIntegrationService } from "./tmsIntegration";
export { sustainabilityService } from "./sustainabilityService";
export { marketplaceRecommendationService } from "./marketplaceRecommendationService";
export { marketplaceAnalyticsService } from "./marketplaceAnalyticsService";
export { resilienceService } from "./resilienceService";
export {
  initializeMarketplaceEventHandlers as initializeMarketplaceModule,
  publishMarketplaceEvent,
} from "./marketplaceEventHandlers";

// AI-Powered Services (Phase 1)
export { aiMatchingService } from "./aiMatchingService";
export { predictivePricingService } from "./predictivePricingService";
export { demandForecastingService } from "./demandForecastingService";
export { intelligentSearchService } from "./intelligentSearchService";
export { learningFeedbackService } from "./learningFeedbackService";

// Contract & Messaging Services (Critical Enhancements)
export { marketplaceContractService } from "./contracts/marketplaceContractService";
export { marketplaceMessagingService } from "./messaging/marketplaceMessagingService";
