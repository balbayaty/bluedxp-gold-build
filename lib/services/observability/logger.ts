/**
 * Structured Logging Service
 * World-class logging with context, levels, and structured output
 * Supports multiple transports (console, file, remote)
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

export interface LogContext {
  tenantId?: string;
  userId?: string;
  module?: string;
  service?: string;
  requestId?: string;
  correlationId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO;
  private transports: Array<(entry: LogEntry) => void> = [];
  private lokiEnabled: boolean = false;
  private lokiUrl: string;

  constructor() {
    // Add console transport by default
    this.addTransport((entry) => {
      const logMethod = this.getConsoleMethod(entry.level);
      const formatted = this.formatLog(entry);
      logMethod(formatted);
    });

    // Initialize Loki transport if enabled
    this.lokiUrl = process.env.LOKI_URL || "http://localhost:3100";
    if (process.env.LOKI_ENABLED === "true") {
      this.initializeLoki();
    }
  }

  /**
   * Initialize Loki transport
   */
  private async initializeLoki(): Promise<void> {
    try {
      // In production, use winston-loki or direct HTTP to Loki
      // For now, we'll use a simple HTTP transport
      this.lokiEnabled = true;
      console.log("✅ Logger: Loki transport enabled");
    } catch (error) {
      console.error("❌ Logger: Failed to initialize Loki:", error);
      this.lokiEnabled = false;
    }
  }

  /**
   * Send log to Loki
   */
  private async sendToLoki(entry: LogEntry): Promise<void> {
    if (!this.lokiEnabled) {
      return;
    }

    try {
      // Format log for Loki (labels + log line)
      const labels: Record<string, string> = {
        level: entry.level,
        service: entry.context?.service || "bluedxp",
        ...(entry.context?.tenantId && { tenantId: entry.context.tenantId }),
        ...(entry.context?.module && { module: entry.context.module }),
      };

      const logLine = JSON.stringify({
        message: entry.message,
        ...(entry.context && { context: entry.context }),
        ...(entry.error && { error: entry.error }),
        ...(entry.metadata && { metadata: entry.metadata }),
      });

      // Send to Loki via HTTP
      const response = await fetch(`${this.lokiUrl}/loki/api/v1/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          streams: [
            {
              stream: labels,
              values: [[(Date.now() * 1000000).toString(), logLine]],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Loki push failed: ${response.statusText}`);
      }
    } catch (error) {
      // Silently fail - don't break logging if Loki is down
      console.error("Loki transport error:", error);
    }
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Add log transport
   */
  addTransport(transport: (entry: LogEntry) => void): void {
    this.transports.push(transport);
  }

  /**
   * Log entry
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, any>,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Send to all transports
    this.transports.forEach((transport) => {
      try {
        transport(entry);
      } catch (err) {
        // Fallback to console if transport fails
        console.error("Log transport failed:", err);
      }
    });

    // Send to Loki if enabled
    if (this.lokiEnabled) {
      this.sendToLoki(entry).catch(() => {
        // Silently fail
      });
    }
  }

  /**
   * Check if should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Format log entry for console
   */
  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ];

    if (entry.context) {
      parts.push(JSON.stringify(entry.context));
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.name} - ${entry.error.message}`);
    }

    return parts.join(" ");
  }

  /**
   * Get console method for log level
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Debug log
   */
  debug(
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>,
  ): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  /**
   * Info log
   */
  info(
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>,
  ): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  /**
   * Warn log
   */
  warn(
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>,
  ): void {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  /**
   * Error log
   */
  error(
    message: string,
    error?: Error,
    context?: LogContext,
    metadata?: Record<string, any>,
  ): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  /**
   * Fatal log
   */
  fatal(
    message: string,
    error?: Error,
    context?: LogContext,
    metadata?: Record<string, any>,
  ): void {
    this.log(LogLevel.FATAL, message, context, error, metadata);
  }
}

export const logger = new Logger();
