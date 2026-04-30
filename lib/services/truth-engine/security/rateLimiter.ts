/**
 * Truth Engine Rate Limiter
 * Rate limiting for Truth Engine API endpoints
 */

import {
  checkRateLimit,
  RateLimitConfig,
} from "@/lib/services/api/rateLimiter";

export interface TruthEngineRateLimitConfig {
  eventsPerMinute: number;
  eventsPerHour: number;
  reviewsPerMinute: number;
  reviewsPerHour: number;
  kpiCalculationsPerMinute: number;
  boardBriefsPerHour: number;
}

const defaultConfig: TruthEngineRateLimitConfig = {
  eventsPerMinute: 100,
  eventsPerHour: 1000,
  reviewsPerMinute: 10,
  reviewsPerHour: 100,
  kpiCalculationsPerMinute: 50,
  boardBriefsPerHour: 10,
};

/**
 * Check rate limit for Truth Engine operations
 */
export function checkTruthEngineRateLimit(
  operation: "event" | "review" | "kpi" | "board_brief",
  identifier: string,
  config: Partial<TruthEngineRateLimitConfig> = {},
): { allowed: boolean; remaining?: number; resetAt?: Date; reason?: string } {
  const mergedConfig = { ...defaultConfig, ...config };

  let rateLimitConfig: RateLimitConfig;
  let window: "minute" | "hour";

  switch (operation) {
    case "event":
      rateLimitConfig = {
        requestsPerMinute: mergedConfig.eventsPerMinute,
        requestsPerHour: mergedConfig.eventsPerHour,
        requestsPerDay: undefined,
      };
      window = "minute";
      break;

    case "review":
      rateLimitConfig = {
        requestsPerMinute: mergedConfig.reviewsPerMinute,
        requestsPerHour: mergedConfig.reviewsPerHour,
        requestsPerDay: undefined,
      };
      window = "minute";
      break;

    case "kpi":
      rateLimitConfig = {
        requestsPerMinute: mergedConfig.kpiCalculationsPerMinute,
        requestsPerHour: undefined,
        requestsPerDay: undefined,
      };
      window = "minute";
      break;

    case "board_brief":
      rateLimitConfig = {
        requestsPerMinute: undefined,
        requestsPerHour: mergedConfig.boardBriefsPerHour,
        requestsPerDay: undefined,
      };
      window = "hour";
      break;

    default:
      return { allowed: true };
  }

  return checkRateLimit(`${identifier}:${operation}`, rateLimitConfig, window);
}
