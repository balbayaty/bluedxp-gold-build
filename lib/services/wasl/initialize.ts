/**
 * WASL Service Initialization
 *
 * Initialize and configure WASL service for the platform
 */

import { WaslService } from "./waslService";
import type { WaslAdapterConfig } from "@/types/wasl";

let waslServiceInstance: WaslService | null = null;

/**
 * Initialize WASL service with configuration
 */
export async function initializeWaslService(
  config: WaslAdapterConfig,
): Promise<WaslService> {
  if (waslServiceInstance) {
    return waslServiceInstance;
  }

  waslServiceInstance = new WaslService({
    appId: config.appId,
    appKey: config.appKey,
    apiBaseUrl: config.apiBaseUrl || "https://www.rabet.sa",
    environment: config.environment || "production",
    timeout: config.timeout || 30000,
    retryAttempts: config.retryAttempts || 3,
    enableLogging: config.enableLogging || false,
    enableCaching: config.enableCaching || false,
  });

  await waslServiceInstance.initialize();

  return waslServiceInstance;
}

/**
 * Get WASL service instance
 */
export function getWaslService(): WaslService | null {
  return waslServiceInstance;
}

/**
 * Get or initialize WASL service from environment variables
 */
export async function getOrInitializeWaslService(): Promise<WaslService> {
  if (waslServiceInstance) {
    return waslServiceInstance;
  }

  const appId = process.env.WASL_APP_ID || process.env.RABET_APP_ID;
  const appKey = process.env.WASL_APP_KEY || process.env.RABET_APP_KEY;

  if (!appId || !appKey) {
    throw new Error(
      "WASL credentials not found. Please set WASL_APP_ID and WASL_APP_KEY environment variables, " +
        "or call initializeWaslService() with configuration.",
    );
  }

  return initializeWaslService({
    appId,
    appKey,
    apiBaseUrl: process.env.WASL_API_BASE_URL || "https://www.rabet.sa",
    environment:
      (process.env.WASL_ENVIRONMENT as "sandbox" | "production") ||
      "production",
    timeout: parseInt(process.env.WASL_TIMEOUT || "30000", 10),
    retryAttempts: parseInt(process.env.WASL_RETRY_ATTEMPTS || "3", 10),
    enableLogging: process.env.WASL_ENABLE_LOGGING === "true",
    enableCaching: process.env.WASL_ENABLE_CACHING === "true",
  });
}
