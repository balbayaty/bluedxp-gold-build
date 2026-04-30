/**
 * Athr Naql Service Initialization
 *
 * Initialize and configure Athr Naql verification service
 */

import { AthrNaqlService } from "./athrNaqlService";
import type { AthrNaqlAdapterConfig } from "@/types/athr-naql";

let athrNaqlServiceInstance: AthrNaqlService | null = null;

/**
 * Initialize Athr Naql service with configuration
 */
export async function initializeAthrNaqlService(
  config: AthrNaqlAdapterConfig,
): Promise<AthrNaqlService> {
  if (athrNaqlServiceInstance) {
    return athrNaqlServiceInstance;
  }

  athrNaqlServiceInstance = new AthrNaqlService({
    appId: config.appId,
    appKey: config.appKey,
    apiBaseUrl: config.apiBaseUrl || "https://www.rabet.sa",
    environment: config.environment || "production",
    timeout: config.timeout || 30000,
    retryAttempts: config.retryAttempts || 3,
    enableLogging: config.enableLogging || false,
    enableCaching: config.enableCaching || false,
  });

  await athrNaqlServiceInstance.initialize();

  return athrNaqlServiceInstance;
}

/**
 * Get Athr Naql service instance
 */
export function getAthrNaqlService(): AthrNaqlService | null {
  return athrNaqlServiceInstance;
}

/**
 * Get or initialize Athr Naql service from environment variables
 */
export async function getOrInitializeAthrNaqlService(): Promise<AthrNaqlService> {
  if (athrNaqlServiceInstance) {
    return athrNaqlServiceInstance;
  }

  const appId =
    process.env.ATHR_NAQL_APP_ID ||
    process.env.WASL_APP_ID ||
    process.env.RABET_APP_ID;
  const appKey =
    process.env.ATHR_NAQL_APP_KEY ||
    process.env.WASL_APP_KEY ||
    process.env.RABET_APP_KEY;

  if (!appId || !appKey) {
    throw new Error(
      "Athr Naql credentials not found. Please set ATHR_NAQL_APP_ID and ATHR_NAQL_APP_KEY environment variables, " +
        "or call initializeAthrNaqlService() with configuration.",
    );
  }

  return initializeAthrNaqlService({
    appId,
    appKey,
    apiBaseUrl:
      process.env.ATHR_NAQL_API_BASE_URL ||
      process.env.WASL_API_BASE_URL ||
      "https://www.rabet.sa",
    environment:
      (process.env.ATHR_NAQL_ENVIRONMENT as "sandbox" | "production") ||
      "production",
    timeout: parseInt(process.env.ATHR_NAQL_TIMEOUT || "30000", 10),
    retryAttempts: parseInt(process.env.ATHR_NAQL_RETRY_ATTEMPTS || "3", 10),
    enableLogging: process.env.ATHR_NAQL_ENABLE_LOGGING === "true",
    enableCaching: process.env.ATHR_NAQL_ENABLE_CACHING === "true",
  });
}
