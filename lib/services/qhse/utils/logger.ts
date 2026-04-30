/**
 * QHSE Logger
 * Comprehensive logging for QHSE services
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  tenantId?: string;
}

class QHSELogger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;

  /**
   * Log entry
   */
  log(
    level: LogLevel,
    service: string,
    message: string,
    context?: Record<string, any>,
    error?: Error,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      service,
      message,
      context,
      error,
      tenantId: context?.tenantId,
      userId: context?.userId,
    };

    this.logs.push(entry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output based on level
    const logMessage = `[${level}] [${service}] ${message}`;
    const logContext = context
      ? `\nContext: ${JSON.stringify(context, null, 2)}`
      : "";
    const logError = error
      ? `\nError: ${error.message}\nStack: ${error.stack}`
      : "";

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage + logContext);
        break;
      case LogLevel.INFO:
        console.info(logMessage + logContext);
        break;
      case LogLevel.WARN:
        console.warn(logMessage + logContext + logError);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logMessage + logContext + logError);
        break;
    }
  }

  /**
   * Debug log
   */
  debug(service: string, message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, service, message, context);
  }

  /**
   * Info log
   */
  info(service: string, message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, service, message, context);
  }

  /**
   * Warn log
   */
  warn(
    service: string,
    message: string,
    context?: Record<string, any>,
    error?: Error,
  ): void {
    this.log(LogLevel.WARN, service, message, context, error);
  }

  /**
   * Error log
   */
  error(
    service: string,
    message: string,
    context?: Record<string, any>,
    error?: Error,
  ): void {
    this.log(LogLevel.ERROR, service, message, context, error);
  }

  /**
   * Critical log
   */
  critical(
    service: string,
    message: string,
    context?: Record<string, any>,
    error?: Error,
  ): void {
    this.log(LogLevel.CRITICAL, service, message, context, error);
  }

  /**
   * Get logs
   */
  getLogs(filters?: {
    level?: LogLevel;
    service?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filters?.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }

    if (filters?.service) {
      filtered = filtered.filter((log) => log.service === filters.service);
    }

    if (filters?.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }
}

export const qhseLogger = new QHSELogger();
