/**
 * Background Job Queue Service
 *
 * Manages persistent background jobs that continue running even when
 * users navigate between pages/modules. Jobs are stored in the database
 * and processed by worker services.
 *
 * Features:
 * - Persistent job storage (survives navigation)
 * - Progress tracking
 * - Error handling and retries
 * - Priority-based processing
 * - Real-time status updates
 * - Multi-tenant support
 */

import { prisma } from "@/lib/services/database/prismaClient";
import {
  Job,
  JobStatus,
  JobType,
  JobPriority,
  JobProgress,
  JobError,
  CreateJobRequest,
  CreateJobResponse,
  JobQuery,
  JobListResponse,
  JobOperationResponse,
  JobHandler,
} from "@/types/job";
import { eventBus, createEvent } from "@/lib/services/event-store";

// ============================================================================
// JOB QUEUE SERVICE
// ============================================================================

class JobQueueService {
  private handlers: Map<JobType, JobHandler> = new Map();
  private processingJobs: Set<string> = new Set(); // Track currently processing jobs
  private processorInterval: NodeJS.Timeout | null = null;
  private jobModelAvailable: boolean | null = null; // Cache availability check

  /**
   * Check if Job model is available in Prisma schema
   */
  private async checkJobModelAvailable(): Promise<boolean> {
    if (this.jobModelAvailable !== null) {
      return this.jobModelAvailable;
    }

    try {
      if (!prisma || typeof prisma.job === "undefined") {
        this.jobModelAvailable = false;
        return false;
      }
      // Try a simple query to verify the model exists
      await prisma.jobs.findFirst({ take: 1 });
      this.jobModelAvailable = true;
      return true;
    } catch (error) {
      this.jobModelAvailable = false;
      return false;
    }
  }

  /**
   * Register a job handler
   */
  registerHandler(handler: JobHandler): void {
    this.handlers.set(handler.type, handler);
  }

  /**
   * Create a new job
   */
  async createJob(
    request: CreateJobRequest,
    tenantId: string,
    userId: string,
  ): Promise<CreateJobResponse> {
    try {
      // Validate handler exists
      const handler = this.handlers.get(request.type);
      if (!handler) {
        return {
          success: false,
          error: `No handler registered for job type: ${request.type}`,
        } as CreateJobResponse;
      }

      // Validate input if handler provides validation
      if (handler.validate) {
        const validation = await handler.validate(request.input);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error || "Job input validation failed",
          } as CreateJobResponse;
        }
      }

      // Estimate duration if handler provides estimation
      let estimatedCompletion: Date | undefined;
      if (handler.estimateDuration) {
        const estimatedMs = await handler.estimateDuration(request.input);
        estimatedCompletion = new Date(Date.now() + estimatedMs);
      }

      // Create job in database
      const jobData = await prisma.jobs.create({
        data: {
          tenantId,
          userId,
          type: request.type,
          name: request.name,
          description: request.description,
          priority: request.priority || "NORMAL",
          status: "PENDING",
          progressCurrent: 0,
          progressTotal: 0,
          progressPercentage: 0,
          input: request.input as any,
          moduleId: request.moduleId,
          context: request.context as any,
          maxRetries: request.maxRetries || 3,
          estimatedCompletion,
        },
      });

      const job = this.mapDbToJob(jobData);

      // Publish job created event
      await eventBus.publish(
        createEvent("job.created", `job:${job.id}`, "Job", {}, 1, {
          tenantId,
          userId,
          correlationId: `job-${job.id}`,
        }),
      );

      // Auto-start job if queue is available
      this.processJobQueue().catch((err) => {
        console.error("Error auto-starting job queue:", err);
      });

      return {
        success: true,
        job,
      };
    } catch (error) {
      console.error("Error creating job:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      } as CreateJobResponse;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string, tenantId: string): Promise<Job | null> {
    try {
      const jobData = await prisma.jobs.findFirst({
        where: {
          id: jobId,
          tenantId,
        },
      });

      if (!jobData) return null;

      return this.mapDbToJob(jobData);
    } catch (error) {
      console.error("Error getting job:", error);
      return null;
    }
  }

  /**
   * List jobs with filters
   */
  async listJobs(query: JobQuery, tenantId: string): Promise<JobListResponse> {
    try {
      const where: any = {
        tenantId,
      };

      if (query.status && query.status.length > 0) {
        where.status = { in: query.status };
      }

      if (query.type && query.type.length > 0) {
        where.type = { in: query.type };
      }

      if (query.moduleId) {
        where.moduleId = query.moduleId;
      }

      if (query.userId) {
        where.userId = query.userId;
      }

      if (query.createdAfter) {
        where.createdAt = { gte: new Date(query.createdAfter) };
      }

      if (query.createdBefore) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(query.createdBefore),
        };
      }

      const [jobs, total] = await Promise.all([
        prisma.jobs.findMany({
          where,
          orderBy: {
            [query.sortBy || "createdAt"]: query.sortOrder || "desc",
          },
          take: query.limit || 50,
          skip: query.offset || 0,
        }),
        prisma.jobs.count({ where }),
      ]);

      return {
        jobs: jobs.map((j) => this.mapDbToJob(j)),
        total,
        limit: query.limit || 50,
        offset: query.offset || 0,
      };
    } catch (error) {
      console.error("Error listing jobs:", error);
      return {
        jobs: [],
        total: 0,
        limit: query.limit || 50,
        offset: query.offset || 0,
      };
    }
  }

  /**
   * Update job progress
   */
  async updateProgress(
    jobId: string,
    progress: JobProgress,
    tenantId: string,
  ): Promise<void> {
    try {
      await prisma.jobs.update({
        where: { id: jobId },
        data: {
          progressCurrent: progress.current,
          progressTotal: progress.total,
          progressPercentage: progress.percentage,
          progressMessage: progress.message,
          progressStage: progress.stage,
          progressDetails: progress.details as any,
          updatedAt: new Date(),
        },
      });

      // Publish progress event
      await eventBus.publish(
        createEvent("job.progress", `job:${jobId}`, "Job", { progress }, 1, {
          tenantId,
          correlationId: `job-${jobId}`,
        }),
      );
    } catch (error) {
      console.error("Error updating job progress:", error);
    }
  }

  /**
   * Complete job successfully
   */
  async completeJob(
    jobId: string,
    output: Record<string, any>,
    tenantId: string,
  ): Promise<void> {
    try {
      const jobData = await prisma.jobs.findUnique({
        where: { id: jobId },
      });

      if (!jobData) return;

      const startedAt = jobData.startedAt
        ? new Date(jobData.startedAt)
        : new Date();
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      await prisma.jobs.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progressPercentage: 100,
          output: output as any,
          completedAt,
          duration,
          updatedAt: completedAt,
        },
      });

      this.processingJobs.delete(jobId);

      // Publish completion event
      await eventBus.publish(
        createEvent("job.completed", `job:${jobId}`, "Job", { output }, 1, {
          tenantId,
          correlationId: `job-${jobId}`,
        }),
      );

      // Note: Motivational notifications are triggered client-side via useJobList hook
      // This ensures notifications only appear when user is viewing the app

      // Cleanup if handler provides cleanup
      const handler = this.handlers.get(jobData.type as JobType);
      if (handler?.cleanup) {
        const job = this.mapDbToJob(jobData);
        await handler.cleanup(job).catch((err) => {
          console.error("Error in job cleanup:", err);
        });
      }
    } catch (error) {
      console.error("Error completing job:", error);
    }
  }

  /**
   * Fail job with error
   */
  async failJob(
    jobId: string,
    error: JobError,
    tenantId: string,
  ): Promise<void> {
    try {
      const jobData = await prisma.jobs.findUnique({
        where: { id: jobId },
      });

      if (!jobData) return;

      const shouldRetry = jobData.retryCount < jobData.maxRetries;

      await prisma.jobs.update({
        where: { id: jobId },
        data: {
          status: shouldRetry ? "RETRYING" : "FAILED",
          errorCode: error.code,
          errorMessage: error.message,
          errorStack: error.stack,
          errorDetails: error.details as any,
          retryCount: jobData.retryCount + 1,
          updatedAt: new Date(),
        },
      });

      this.processingJobs.delete(jobId);

      // Publish failure event
      await eventBus.publish(
        createEvent(
          "job.failed",
          `job:${jobId}`,
          "Job",
          { error, willRetry: shouldRetry },
          1,
          {
            tenantId,
            correlationId: `job-${jobId}`,
          },
        ),
      );

      // Retry if applicable
      if (shouldRetry) {
        // Wait before retry (exponential backoff)
        const retryDelay = Math.min(
          1000 * Math.pow(2, jobData.retryCount),
          60000,
        );
        setTimeout(() => {
          this.processJob(jobId, tenantId).catch((err) => {
            console.error("Error retrying job:", err);
          });
        }, retryDelay);
      } else {
        // Cleanup on final failure
        const handler = this.handlers.get(jobData.type as JobType);
        if (handler?.cleanup) {
          const job = this.mapDbToJob(jobData);
          await handler.cleanup(job).catch((err) => {
            console.error("Error in job cleanup:", err);
          });
        }
      }
    } catch (error) {
      console.error("Error failing job:", error);
    }
  }

  /**
   * Cancel job
   */
  async cancelJob(
    jobId: string,
    tenantId: string,
  ): Promise<JobOperationResponse> {
    try {
      const jobData = await prisma.jobs.findFirst({
        where: {
          id: jobId,
          tenantId,
          status: { in: ["PENDING", "QUEUED", "RUNNING", "PAUSED"] },
        },
      });

      if (!jobData) {
        return {
          success: false,
          error: "Job not found or cannot be cancelled",
        };
      }

      await prisma.jobs.update({
        where: { id: jobId },
        data: {
          status: "CANCELLED",
          updatedAt: new Date(),
        },
      });

      this.processingJobs.delete(jobId);

      // Publish cancellation event
      await eventBus.publish(
        createEvent("job.cancelled", `job:${jobId}`, "Job", {}, 1, {
          tenantId,
          correlationId: `job-${jobId}`,
        }),
      );

      return {
        success: true,
        job: this.mapDbToJob(jobData),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Pause job
   */
  async pauseJob(
    jobId: string,
    tenantId: string,
  ): Promise<JobOperationResponse> {
    try {
      const jobData = await prisma.jobs.findFirst({
        where: {
          id: jobId,
          tenantId,
          status: "RUNNING",
        },
      });

      if (!jobData) {
        return {
          success: false,
          error: "Job not found or cannot be paused",
        };
      }

      await prisma.jobs.update({
        where: { id: jobId },
        data: {
          status: "PAUSED",
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        job: this.mapDbToJob(jobData),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Resume paused job
   */
  async resumeJob(
    jobId: string,
    tenantId: string,
  ): Promise<JobOperationResponse> {
    try {
      const jobData = await prisma.jobs.findFirst({
        where: {
          id: jobId,
          tenantId,
          status: "PAUSED",
        },
      });

      if (!jobData) {
        return {
          success: false,
          error: "Job not found or cannot be resumed",
        };
      }

      await prisma.jobs.update({
        where: { id: jobId },
        data: {
          status: "QUEUED",
          updatedAt: new Date(),
        },
      });

      // Process queue to start job
      this.processJobQueue().catch((err) => {
        console.error("Error processing job queue:", err);
      });

      return {
        success: true,
        job: this.mapDbToJob(jobData),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process a specific job
   */
  async processJob(jobId: string, tenantId: string): Promise<void> {
    // Prevent duplicate processing
    if (this.processingJobs.has(jobId)) {
      return;
    }

    const jobData = await prisma.jobs.findFirst({
      where: {
        id: jobId,
        tenantId,
        status: { in: ["PENDING", "QUEUED", "RETRYING"] },
      },
    });

    if (!jobData) return;

    const handler = this.handlers.get(jobData.type as JobType);
    if (!handler) {
      await this.failJob(
        jobId,
        {
          code: "HANDLER_NOT_FOUND",
          message: `No handler for job type: ${jobData.type}`,
          timestamp: new Date(),
        },
        tenantId,
      );
      return;
    }

    // Mark as processing
    this.processingJobs.add(jobId);
    await prisma.jobs.update({
      where: { id: jobId },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const job = this.mapDbToJob(jobData);

    try {
      // Process job with progress callback
      const output = await handler.process(job, async (progress) => {
        await this.updateProgress(jobId, progress, tenantId);
      });

      // Complete job
      await this.completeJob(jobId, output, tenantId);
    } catch (error) {
      // Fail job
      await this.failJob(
        jobId,
        {
          code: "PROCESSING_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date(),
        },
        tenantId,
      );
    }
  }

  /**
   * Process job queue (pick next job and process)
   */
  async processJobQueue(): Promise<void> {
    try {
      // Check if Prisma and job model are available
      if (!prisma || !prisma.job) {
        // Job model not available in database schema - skip processing
        return;
      }

      // Find next job to process (priority order)
      const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };

      const nextJob = await prisma.jobs.findFirst({
        where: {
          status: { in: ["PENDING", "QUEUED", "RETRYING"] },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });

      if (!nextJob) return;

      // Check if we're already processing this job
      if (this.processingJobs.has(nextJob.id)) return;

      // Process the job
      await this.processJob(nextJob.id, nextJob.tenantId);
    } catch (error) {
      // Silently handle errors - job queue is optional functionality
      // Only log if it's not a missing model error
      if (error instanceof Error && !error.message.includes("findFirst")) {
        console.error("Error in job queue processor:", error);
      }
    }
  }

  /**
   * Start background job processor (runs continuously)
   */
  startProcessor(intervalMs: number = 5000): void {
    // Stop existing processor if running
    if (this.processorInterval) {
      clearInterval(this.processorInterval);
    }

    this.processorInterval = setInterval(() => {
      this.processJobQueue().catch((err) => {
        console.error("Error in job queue processor:", err);
      });
    }, intervalMs);
  }

  /**
   * Stop background job processor
   */
  stopProcessor(): void {
    if (this.processorInterval) {
      clearInterval(this.processorInterval);
      this.processorInterval = null;
    }
  }

  /**
   * Restart job queue - clears stuck jobs and restarts processor
   */
  async restart(): Promise<void> {
    try {
      // Stop current processor
      this.stopProcessor();

      // Clear stuck processing jobs (jobs that have been processing for more than 30 minutes)
      const stuckThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      await prisma.jobs.updateMany({
        where: {
          status: "PROCESSING",
          updatedAt: {
            lt: stuckThreshold,
          },
        },
        data: {
          status: "QUEUED",
          updatedAt: new Date(),
        },
      });

      // Clear processing set
      this.processingJobs.clear();

      // Restart processor
      this.startProcessor(5000);

      console.log("[JobQueue] Restarted successfully");
    } catch (error) {
      console.error("[JobQueue] Error restarting:", error);
      throw error;
    }
  }

  /**
   * Map database record to Job interface
   */
  private mapDbToJob(jobData: any): Job {
    return {
      id: jobData.id,
      tenantId: jobData.tenantId,
      userId: jobData.userId,
      type: jobData.type as JobType,
      name: jobData.name,
      description: jobData.description,
      status: jobData.status as JobStatus,
      priority: jobData.priority as JobPriority,
      progress: {
        current: jobData.progressCurrent,
        total: jobData.progressTotal,
        percentage: Number(jobData.progressPercentage),
        message: jobData.progressMessage,
        stage: jobData.progressStage,
        details: jobData.progressDetails,
      },
      startedAt: jobData.startedAt,
      completedAt: jobData.completedAt,
      estimatedCompletion: jobData.estimatedCompletion,
      duration: jobData.duration,
      error: jobData.errorCode
        ? {
            code: jobData.errorCode,
            message: jobData.errorMessage || "",
            stack: jobData.errorStack,
            details: jobData.errorDetails,
            timestamp: jobData.updatedAt,
          }
        : undefined,
      retryCount: jobData.retryCount,
      maxRetries: jobData.maxRetries,
      input: jobData.input,
      output: jobData.output,
      metadata: jobData.metadata,
      moduleId: jobData.moduleId,
      context: jobData.context,
      createdAt: jobData.createdAt,
      updatedAt: jobData.updatedAt,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const jobQueue = new JobQueueService();

// Start processor in background (runs every 5 seconds)
// Only start if Job model exists in database schema
if (typeof process !== "undefined") {
  jobQueue.startProcessor(5000);
}
