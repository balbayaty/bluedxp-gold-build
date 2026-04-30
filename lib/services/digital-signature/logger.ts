/**
 * Logger Service - Comprehensive logging for digital signature operations
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  CRITICAL = "critical",
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  module: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      module: "digital-signature",
      context,
      error,
    };

    this.logs.push(entry);

    // Keep only last maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const prefix = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] [digital-signature]`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    const errorStr = error ? ` Error: ${error.message}` : "";

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${message}${contextStr}${errorStr}`);
        break;
      case LogLevel.INFO:
        console.log(`${prefix} ${message}${contextStr}`);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${message}${contextStr}${errorStr}`);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(`${prefix} ${message}${contextStr}${errorStr}`, error);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  critical(
    message: string,
    context?: Record<string, any>,
    error?: Error,
  ): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  clear(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
