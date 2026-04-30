/**
 * Marketplace Module Initialization
 * Initialize all event handlers and services
 */

import { initializeMarketplaceEventHandlers } from "./marketplaceEventHandlers";
import { wmsIntegrationService } from "./wmsIntegration";
import { tmsIntegrationService } from "./tmsIntegration";

/**
 * Initialize marketplace module
 * Call this on app startup
 */
export function initializeMarketplaceModule() {
  // Initialize event handlers
  initializeMarketplaceEventHandlers();

  // Initialize integrations
  wmsIntegrationService.initialize();
  tmsIntegrationService.initialize();

  console.log("✅ Marketplace module initialized");
}
