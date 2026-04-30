/**
 * Daleel Location Service Initialization
 *
 * Initialize and configure Daleel location tracking service
 */

import { DaleelLocationService } from "./daleelLocationService";
import type { DaleelAdapterConfig } from "@/types/daleel";

let daleelServiceInstance: DaleelLocationService | null = null;

/**
 * Initialize Daleel service with configuration
 */
export async function initializeDaleelService(
  config: DaleelAdapterConfig,
): Promise<DaleelLocationService> {
  if (daleelServiceInstance) {
    return daleelServiceInstance;
  }

  daleelServiceInstance = new DaleelLocationService({
    username: config.username,
    password: config.password,
    apiBaseUrl: config.apiBaseUrl || "https://www.rabet.sa",
    environment: config.environment || "production",
    timeout: config.timeout || 30000,
    retryAttempts: config.retryAttempts || 3,
    enableLogging: config.enableLogging || false,
    enableCaching: config.enableCaching || false,
    pollingInterval: config.pollingInterval || 30000, // Default 30 seconds
  });

  await daleelServiceInstance.initialize();

  return daleelServiceInstance;
}

/**
 * Get Daleel service instance
 */
export function getDaleelService(): DaleelLocationService | null {
  return daleelServiceInstance;
}

/**
 * Get or initialize Daleel service from environment variables
 */
export async function getOrInitializeDaleelService(): Promise<DaleelLocationService> {
  if (daleelServiceInstance) {
    return daleelServiceInstance;
  }

  const username = process.env.DALEEL_USERNAME || process.env.RABET_USERNAME;
  const password = process.env.DALEEL_PASSWORD || process.env.RABET_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Daleel credentials not found. Please set DALEEL_USERNAME and DALEEL_PASSWORD environment variables, " +
        "or call initializeDaleelService() with configuration.",
    );
  }

  return initializeDaleelService({
    username,
    password,
    apiBaseUrl: process.env.DALEEL_API_BASE_URL || "https://www.rabet.sa",
    environment:
      (process.env.DALEEL_ENVIRONMENT as "sandbox" | "production") ||
      "production",
    timeout: parseInt(process.env.DALEEL_TIMEOUT || "30000", 10),
    retryAttempts: parseInt(process.env.DALEEL_RETRY_ATTEMPTS || "3", 10),
    enableLogging: process.env.DALEEL_ENABLE_LOGGING === "true",
    enableCaching: process.env.DALEEL_ENABLE_CACHING === "true",
    pollingInterval: parseInt(
      process.env.DALEEL_POLLING_INTERVAL || "30000",
      10,
    ),
  });
}
