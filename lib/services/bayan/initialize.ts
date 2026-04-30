/**
 * Bayan Service Initialization
 *
 * Initialize and configure Bayan service for the platform
 */

import { BayanService } from "./bayanService";
import type { BayanAdapterConfig } from "@/types/bayan";

let bayanServiceInstance: BayanService | null = null;

/**
 * Initialize Bayan service with configuration
 */
export async function initializeBayanService(
  config: BayanAdapterConfig,
): Promise<BayanService> {
  if (bayanServiceInstance) {
    return bayanServiceInstance;
  }

  bayanServiceInstance = new BayanService({
    appId: config.appId,
    appKey: config.appKey,
    apiBaseUrl: config.apiBaseUrl || "https://www.rabet.sa",
    environment: config.environment || "production",
    timeout: config.timeout || 30000,
    retryAttempts: config.retryAttempts || 3,
    enableLogging: config.enableLogging || false,
    enableCaching: config.enableCaching || false,
  });

  await bayanServiceInstance.initialize();

  return bayanServiceInstance;
}

/**
 * Get Bayan service instance
 */
export function getBayanService(): BayanService | null {
  return bayanServiceInstance;
}

/**
 * Get or initialize Bayan service from environment variables
 */
export async function getOrInitializeBayanService(): Promise<BayanService> {
  if (bayanServiceInstance) {
    return bayanServiceInstance;
  }

  const appId =
    process.env.BAYAN_APP_ID ||
    process.env.WASL_APP_ID ||
    process.env.RABET_APP_ID;
  const appKey =
    process.env.BAYAN_APP_KEY ||
    process.env.WASL_APP_KEY ||
    process.env.RABET_APP_KEY;

  if (!appId || !appKey) {
    throw new Error(
      "Bayan credentials not found. Please set BAYAN_APP_ID and BAYAN_APP_KEY environment variables, " +
        "or call initializeBayanService() with configuration.",
    );
  }

  return initializeBayanService({
    appId,
    appKey,
    apiBaseUrl:
      process.env.BAYAN_API_BASE_URL ||
      process.env.WASL_API_BASE_URL ||
      "https://www.rabet.sa",
    environment:
      (process.env.BAYAN_ENVIRONMENT as "sandbox" | "production") ||
      "production",
    timeout: parseInt(process.env.BAYAN_TIMEOUT || "30000", 10),
    retryAttempts: parseInt(process.env.BAYAN_RETRY_ATTEMPTS || "3", 10),
    enableLogging: process.env.BAYAN_ENABLE_LOGGING === "true",
    enableCaching: process.env.BAYAN_ENABLE_CACHING === "true",
  });
}
