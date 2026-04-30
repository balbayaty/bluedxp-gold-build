/**
 * Dead Letter Queue Service
 *
 * Handles failed messages with:
 * - Automatic retry logic
 * - Exponential backoff
 * - Message persistence
 * - Monitoring and alerting
 */

import { prisma } from "@/lib/services/database/prismaClient";

export interface DeadLetterMessage {
  id: string;
  queueName: string;
  message: any;
  error: string;
  originalError?: string;
  retryCount: number;
  maxRetries: number;
  status: "PENDING" | "PROCESSING" | "RESOLVED" | "FAILED";
  tenantId?: string;
  createdAt: Date;
  processedAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface DLQConfig {
  maxRetries: number;
  retryBackoff: "exponential" | "linear" | "fixed";
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  alertOnFailure: boolean;
}

class DeadLetterQueueService {
  private configs: Map<string, DLQConfig> = new Map();

  /**
   * Add message to dead letter queue
   */
  async addToDLQ(
    queueName: string,
    message: any,
    error: Error,
    tenantId?: string,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const config = this.getConfig(queueName);

    const dlqMessage = await prisma.deadLetterMessage.create({
      data: {
        queueName,
        message: message as any,
        error: error.message,
        originalError: error.stack,
        retryCount: 0,
        maxRetries: config.maxRetries,
        status: "PENDING",
        tenantId,
        metadata: metadata || {},
      },
    });

    // Schedule retry if configured
    if (config.maxRetries > 0) {
      await this.scheduleRetry(dlqMessage.id, queueName, config);
    }

    // Alert if configured
    if (config.alertOnFailure) {
      await this.alertOnFailure(queueName, error, dlqMessage.id);
    }

    return dlqMessage.id;
  }

  /**
   * Process dead letter queue
   */
  async processDLQ(
    queueName: string,
    processor: (message: any) => Promise<void>,
  ): Promise<{
    processed: number;
    resolved: number;
    failed: number;
  }> {
    const pendingMessages = await prisma.deadLetterMessage.findMany({
      where: {
        queueName,
        status: "PENDING",
        retryCount: { lt: prisma.deadLetterMessage.fields.maxRetries },
      },
      orderBy: { createdAt: "asc" },
      take: 100, // Process in batches
    });

    let processed = 0;
    let resolved = 0;
    let failed = 0;

    for (const dlqMessage of pendingMessages) {
      try {
        // Mark as processing
        await prisma.deadLetterMessage.update({
          where: { id: dlqMessage.id },
          data: {
            status: "PROCESSING",
            processedAt: new Date(),
          },
        });

        // Process message
        await processor(dlqMessage.message as any);

        // Mark as resolved
        await prisma.deadLetterMessage.update({
          where: { id: dlqMessage.id },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
          },
        });

        resolved++;
      } catch (error: any) {
        // Increment retry count
        const newRetryCount = dlqMessage.retryCount + 1;
        const config = this.getConfig(queueName);

        if (newRetryCount >= dlqMessage.maxRetries) {
          // Max retries reached
          await prisma.deadLetterMessage.update({
            where: { id: dlqMessage.id },
            data: {
              status: "FAILED",
              retryCount: newRetryCount,
              error: `Failed after ${newRetryCount} retries: ${error.message}`,
            },
          });
          failed++;
        } else {
          // Schedule retry
          await prisma.deadLetterMessage.update({
            where: { id: dlqMessage.id },
            data: {
              status: "PENDING",
              retryCount: newRetryCount,
              error: error.message,
            },
          });
          await this.scheduleRetry(
            dlqMessage.id,
            queueName,
            config,
            newRetryCount,
          );
        }
      }

      processed++;
    }

    return { processed, resolved, failed };
  }

  /**
   * Retry message from DLQ
   */
  async retryMessage(
    messageId: string,
    processor: (message: any) => Promise<void>,
  ): Promise<boolean> {
    const dlqMessage = await prisma.deadLetterMessage.findUnique({
      where: { id: messageId },
    });

    if (!dlqMessage || dlqMessage.status !== "PENDING") {
      return false;
    }

    try {
      await processor(dlqMessage.message as any);

      await prisma.deadLetterMessage.update({
        where: { id: messageId },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
        },
      });

      return true;
    } catch (error: any) {
      const newRetryCount = dlqMessage.retryCount + 1;

      if (newRetryCount >= dlqMessage.maxRetries) {
        await prisma.deadLetterMessage.update({
          where: { id: messageId },
          data: {
            status: "FAILED",
            retryCount: newRetryCount,
            error: `Failed after ${newRetryCount} retries: ${error.message}`,
          },
        });
      } else {
        const config = this.getConfig(dlqMessage.queueName);
        await prisma.deadLetterMessage.update({
          where: { id: messageId },
          data: {
            status: "PENDING",
            retryCount: newRetryCount,
            error: error.message,
          },
        });
        await this.scheduleRetry(
          messageId,
          dlqMessage.queueName,
          config,
          newRetryCount,
        );
      }

      return false;
    }
  }

  /**
   * Get DLQ statistics
   */
  async getDLQStats(queueName?: string): Promise<{
    total: number;
    pending: number;
    processing: number;
    resolved: number;
    failed: number;
    averageRetries: number;
  }> {
    const where = queueName ? { queueName } : {};

    const [total, pending, processing, resolved, failed] = await Promise.all([
      prisma.deadLetterMessage.count({ where }),
      prisma.deadLetterMessage.count({
        where: { ...where, status: "PENDING" },
      }),
      prisma.deadLetterMessage.count({
        where: { ...where, status: "PROCESSING" },
      }),
      prisma.deadLetterMessage.count({
        where: { ...where, status: "RESOLVED" },
      }),
      prisma.deadLetterMessage.count({ where: { ...where, status: "FAILED" } }),
    ]);

    const allMessages = await prisma.deadLetterMessage.findMany({
      where,
      select: { retryCount: true },
    });

    const averageRetries =
      allMessages.length > 0
        ? allMessages.reduce((sum, m) => sum + m.retryCount, 0) /
          allMessages.length
        : 0;

    return {
      total,
      pending,
      processing,
      resolved,
      failed,
      averageRetries,
    };
  }

  /**
   * Configure DLQ for queue
   */
  setConfig(queueName: string, config: DLQConfig): void {
    this.configs.set(queueName, config);
  }

  /**
   * Get config for queue (with defaults)
   */
  private getConfig(queueName: string): DLQConfig {
    return (
      this.configs.get(queueName) || {
        maxRetries: 3,
        retryBackoff: "exponential",
        baseDelay: 1000,
        maxDelay: 60000,
        alertOnFailure: true,
      }
    );
  }

  /**
   * Schedule retry with backoff
   */
  private async scheduleRetry(
    messageId: string,
    queueName: string,
    config: DLQConfig,
    retryCount: number = 0,
  ): Promise<void> {
    const delay = this.calculateBackoff(
      config.retryBackoff,
      config.baseDelay,
      retryCount,
      config.maxDelay,
    );

    // In production, use a job queue (e.g., Bull, BullMQ)
    setTimeout(async () => {
      const message = await prisma.deadLetterMessage.findUnique({
        where: { id: messageId },
      });

      if (message && message.status === "PENDING") {
        // Trigger retry processing
        // This would be handled by a background job processor
        console.log(
          `Scheduled retry for DLQ message ${messageId} after ${delay}ms`,
        );
      }
    }, delay);
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoff(
    type: string,
    baseDelay: number,
    retryCount: number,
    maxDelay: number,
  ): number {
    let delay: number;

    switch (type) {
      case "exponential":
        delay = baseDelay * Math.pow(2, retryCount);
        break;
      case "linear":
        delay = baseDelay * (retryCount + 1);
        break;
      case "fixed":
      default:
        delay = baseDelay;
        break;
    }

    return Math.min(delay, maxDelay);
  }

  /**
   * Alert on failure
   */
  private async alertOnFailure(
    queueName: string,
    error: Error,
    messageId: string,
  ): Promise<void> {
    // Integrate with alerting service
    const { alertingService } =
      await import("@/lib/services/observability/alertingService");

    await alertingService.sendAlert({
      id: `dlq-${messageId}-${Date.now()}`,
      severity: "high",
      title: `Dead Letter Queue: ${queueName}`,
      message: `Message failed and added to DLQ: ${error.message}`,
      source: "dlq",
      metric: `dlq.${queueName}`,
      timestamp: new Date(),
      metadata: {
        queueName,
        messageId,
        error: error.message,
      },
    });
  }
}

export const deadLetterQueueService = new DeadLetterQueueService();

// Set default configs
deadLetterQueueService.setConfig("default", {
  maxRetries: 3,
  retryBackoff: "exponential",
  baseDelay: 1000,
  maxDelay: 60000,
  alertOnFailure: true,
});

deadLetterQueueService.setConfig("critical", {
  maxRetries: 5,
  retryBackoff: "exponential",
  baseDelay: 2000,
  maxDelay: 300000, // 5 minutes
  alertOnFailure: true,
});
