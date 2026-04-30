/**
 * Observability Service
 * Central hub for logging, tracing, metrics, and error tracking
 */

export { logger, LogLevel, type LogContext, type LogEntry } from "./logger";
export { tracingService, type Span, type Trace } from "./tracing";
export { metricsService, type Metric, type MetricDefinition } from "./metrics";
export { errorTrackingService, type ErrorEvent } from "./errorTracking";

import { logger, LogLevel } from "./logger";
import { metricsService } from "./metrics";

/**
 * Combined Observability Service for backward compatibility and convenience
 */
export const observabilityService = {
  log: async (params: {
    level: "debug" | "info" | "warn" | "error" | "fatal";
    message: string;
    context?: any;
    tenantId?: string;
  }) => {
    const levelMap: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
      fatal: LogLevel.FATAL,
    };

    const level = levelMap[params.level] || LogLevel.INFO;

    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      logger.error(params.message, params.context);
    } else if (level === LogLevel.WARN) {
      logger.warn(params.message, params.context);
    } else {
      logger.info(params.message, params.context);
    }
  },

  trackMetric: async (params: {
    name: string;
    value: number;
    unit?: string;
    tags?: Record<string, string>;
    tenantId?: string;
  }) => {
    metricsService.recordMetric({
      name: params.name,
      value: params.value,
      type: "gauge", // Default to gauge for generic tracking
      labels: params.tags || {},
      timestamp: Date.now(),
    });
  },
};

/**
 * Initialize observability
 */
export function initializeObservability(config?: {
  logLevel?: "debug" | "info" | "warn" | "error" | "fatal";
  enableTracing?: boolean;
  enableMetrics?: boolean;
  enableErrorTracking?: boolean;
  sentryDsn?: string;
}): void {
  // Set log level
  if (config?.logLevel) {
    const { LogLevel } = require("./logger");
    logger.setLevel(LogLevel[config.logLevel.toUpperCase()]);
  }

  // Initialize error tracking
  if (config?.enableErrorTracking && config?.sentryDsn) {
    process.env.SENTRY_DSN = config.sentryDsn;
  }
}
