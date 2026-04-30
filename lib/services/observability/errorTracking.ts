/**
 * Error Tracking Service
 * Sentry-compatible error tracking and monitoring
 * Connects to Sentry SDK for error tracking
 */

import { logger } from "./logger";
import type { LogContext } from "./logger";

// Optional Sentry import - loaded dynamically
function loadSentry() {
  try {
    if (typeof require !== "undefined") {
      return require("@sentry/nextjs");
    }
  } catch (e) {
    // @sentry/nextjs not installed
  }
  return null;
}

export interface ErrorEvent {
  id: string;
  timestamp: string;
  level: "error" | "fatal" | "warning";
  message: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: LogContext;
  tags?: Record<string, string>;
  breadcrumbs?: Array<{
    message: string;
    category: string;
    level: string;
    timestamp: string;
  }>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  environment?: string;
  release?: string;
}

class ErrorTrackingService {
  private events: Map<string, ErrorEvent> = new Map();
  private breadcrumbs: Array<ErrorEvent["breadcrumbs"][0]> = [];
  private sentryEnabled: boolean = false;
  private Sentry: any = null;

  /**
   * Initialize Sentry SDK
   */
  async initialize(): Promise<void> {
    const sentryLib = loadSentry();
    if (!sentryLib) {
      console.log(
        "⚠️ Error Tracking: @sentry/nextjs not available, using in-memory error tracking",
      );
      this.sentryEnabled = false;
      return;
    }

    try {
      const dsn = process.env.SENTRY_DSN;
      if (!dsn) {
        console.log(
          "⚠️ Error Tracking: SENTRY_DSN not configured, using in-memory error tracking",
        );
        this.sentryEnabled = false;
        return;
      }

      this.Sentry = sentryLib;

      // Sentry is typically initialized in next.config.js or sentry.client.config.js
      // For API routes, we can initialize here if needed
      // For now, assume Sentry is initialized at app level

      this.sentryEnabled = true;
      console.log("✅ Error Tracking: Sentry enabled");
    } catch (error) {
      console.error("❌ Error initializing Sentry:", error);
      this.sentryEnabled = false;
    }
  }

  /**
   * Capture exception
   */
  captureException(
    error: Error,
    context?: LogContext,
    tags?: Record<string, string>,
  ): string {
    const eventId = `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const event: ErrorEvent = {
      id: eventId,
      timestamp: new Date().toISOString(),
      level: "error",
      message: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      tags,
      breadcrumbs: [...this.breadcrumbs],
      environment: process.env.NODE_ENV || "development",
      release: process.env.SENTRY_RELEASE,
    };

    this.events.set(eventId, event);

    // Log error
    logger.error(error.message, error, context);

    // Send to Sentry if enabled
    if (this.sentryEnabled && this.Sentry) {
      try {
        this.Sentry.captureException(error, {
          contexts: context ? { custom: context } : undefined,
          tags,
          breadcrumbs: this.breadcrumbs.map((b) => ({
            message: b.message,
            category: b.category,
            level: b.level,
            timestamp: new Date(b.timestamp).getTime() / 1000,
          })),
          environment: event.environment,
          release: event.release,
        });
      } catch (sentryError) {
        console.error("Error sending to Sentry:", sentryError);
      }
    }

    return eventId;
  }

  /**
   * Capture message
   */
  captureMessage(
    message: string,
    level: "error" | "fatal" | "warning" = "error",
    context?: LogContext,
    tags?: Record<string, string>,
  ): string {
    const eventId = `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const event: ErrorEvent = {
      id: eventId,
      timestamp: new Date().toISOString(),
      level,
      message,
      error: {
        name: "Error",
        message,
      },
      context,
      tags,
      breadcrumbs: [...this.breadcrumbs],
      environment: process.env.NODE_ENV || "development",
      release: process.env.SENTRY_RELEASE,
    };

    this.events.set(eventId, event);

    // Log message
    if (level === "fatal") {
      logger.fatal(message, undefined, context);
    } else if (level === "error") {
      logger.error(message, undefined, context);
    } else {
      logger.warn(message, context);
    }

    // Send to Sentry if enabled
    if (this.sentryEnabled && this.Sentry) {
      try {
        this.Sentry.captureMessage(message, {
          level: level === "fatal" ? "fatal" : level,
          contexts: context ? { custom: context } : undefined,
          tags,
          breadcrumbs: this.breadcrumbs.map((b) => ({
            message: b.message,
            category: b.category,
            level: b.level,
            timestamp: new Date(b.timestamp).getTime() / 1000,
          })),
          environment: event.environment,
          release: event.release,
        });
      } catch (sentryError) {
        console.error("Error sending to Sentry:", sentryError);
      }
    }

    return eventId;
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(
    message: string,
    category: string,
    level: string = "info",
  ): void {
    const breadcrumb = {
      message,
      category,
      level,
      timestamp: new Date().toISOString(),
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only last 100 breadcrumbs
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs.shift();
    }

    // Add to Sentry if enabled
    if (this.sentryEnabled && this.Sentry) {
      try {
        this.Sentry.addBreadcrumb({
          message,
          category,
          level,
        });
      } catch (error) {
        // Silently fail
      }
    }
  }

  /**
   * Set user context
   */
  setUser(user: ErrorEvent["user"]): void {
    // Set user context in Sentry if enabled
    if (this.sentryEnabled && this.Sentry) {
      try {
        this.Sentry.setUser(user || null);
      } catch (error) {
        // Silently fail
      }
    }
  }

  /**
   * Get error event
   */
  getErrorEvent(eventId: string): ErrorEvent | null {
    return this.events.get(eventId) || null;
  }

  /**
   * Get error events
   */
  getErrorEvents(filters?: {
    level?: ErrorEvent["level"];
    startTime?: string;
    endTime?: string;
    module?: string;
  }): ErrorEvent[] {
    let events = Array.from(this.events.values());

    if (filters?.level) {
      events = events.filter((e) => e.level === filters.level);
    }

    if (filters?.startTime) {
      events = events.filter((e) => e.timestamp >= filters.startTime!);
    }

    if (filters?.endTime) {
      events = events.filter((e) => e.timestamp <= filters.endTime!);
    }

    if (filters?.module) {
      events = events.filter((e) => e.context?.module === filters.module);
    }

    return events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }
}

export const errorTrackingService = new ErrorTrackingService();

// Initialize on module load
errorTrackingService.initialize().catch((error) => {
  console.error("Failed to initialize error tracking:", error);
});
