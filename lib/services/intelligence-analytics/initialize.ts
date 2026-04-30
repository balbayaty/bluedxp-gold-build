/**
 * Intelligence & Analytics Module Initialization
 *
 * Initializes the unified intelligence and analytics module
 */

import { intelligenceIntegrationService } from "./core/integrationService";

/**
 * Initialize Intelligence & Analytics module for a tenant
 */
export async function initializeIntelligenceAnalyticsModule(
  tenantId: string,
): Promise<void> {
  console.log(
    `🧠 Initializing Intelligence & Analytics Module for tenant: ${tenantId}`,
  );

  try {
    await intelligenceIntegrationService.initialize(tenantId);
    console.log(
      `✅ Intelligence & Analytics Module initialized for tenant: ${tenantId}`,
    );
  } catch (error) {
    console.error(
      `❌ Error initializing Intelligence & Analytics Module for tenant ${tenantId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Cleanup Intelligence & Analytics module for a tenant
 */
export async function cleanupIntelligenceAnalyticsModule(
  tenantId: string,
): Promise<void> {
  console.log(
    `🧹 Cleaning up Intelligence & Analytics Module for tenant: ${tenantId}`,
  );

  try {
    await intelligenceIntegrationService.cleanup(tenantId);
    console.log(
      `✅ Intelligence & Analytics Module cleaned up for tenant: ${tenantId}`,
    );
  } catch (error) {
    console.error(
      `❌ Error cleaning up Intelligence & Analytics Module for tenant ${tenantId}:`,
      error,
    );
    throw error;
  }
}

export default {
  initialize: initializeIntelligenceAnalyticsModule,
  cleanup: cleanupIntelligenceAnalyticsModule,
};
