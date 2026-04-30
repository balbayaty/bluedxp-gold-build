/**
 * Warehouse Network Module Initialization
 * Initialize all event handlers and services
 */

import { initializeWarehouseNetworkEventHandlers } from "./warehouseNetworkEventHandlers";
import { warehouseNetworkWMSIntegrationService } from "./wmsIntegration";
import { warehouseNetworkTMSIntegrationService } from "./tmsIntegration";

/**
 * Initialize warehouse network module
 * Call this on app startup
 */
export function initializeWarehouseNetworkModule() {
  // Initialize event handlers
  initializeWarehouseNetworkEventHandlers();

  // Initialize integrations
  warehouseNetworkWMSIntegrationService.initialize();
  warehouseNetworkTMSIntegrationService.initialize();

  console.log("✅ Warehouse Network module initialized");
}
