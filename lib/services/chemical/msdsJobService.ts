import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { MSDSJob, MSDSJobItem } from "@/types/msdsJob";
import { redisService } from "@/lib/services/cache/redisService";
import { msdsExtractionRegistry } from "./extraction/msdsExtractionRegistry";
import { msdsDomainService } from "./msdsDomainService";
import { HazardPredictionService } from "@/lib/services/ml/hazard-prediction";
import { ChemicalRiskAssessmentService } from "@/lib/services/ml/risk-assessment";
import { ChemicalCompatibilityService } from "@/lib/services/ml/chemical-compatibility";
import { ocrService } from "@/lib/services/ocr/ocrService";
import { eventBus, createEvent } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import { notificationService } from "@/lib/services/notifications/notificationService";

type AIKeys = { openaiKey?: string | null; anthropicKey?: string | null };

function nowIso() {
  return new Date().toISOString();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeId(prefix: string) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
}

function jobKey(tenantId: string, jobId: string) {
  return `msdsjob:${tenantId}:${jobId}`;
}

function jobListKey(tenantId: string) {
  return `msdsjobs:${tenantId}`;
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function detectFileKind(filename: string, mimeType?: string) {
  const name = filename.toLowerCase();
  const mt = (mimeType || "").toLowerCase();
  const isPDF = mt === "application/pdf" || name.endsWith(".pdf");
  const isExcel =
    mt.includes("spreadsheet") ||
    mt.includes("excel") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls");
  const isCSV = mt === "text/csv" || name.endsWith(".csv");
  return { isPDF, isExcel, isCSV };
}

export class MSDSJobService {
  private mem = new Map<string, MSDSJob>();

  private async ensureRedis(): Promise<void> {
    if (redisService.isEnabled()) return;
    await redisService.initialize(process.env.REDIS_URL);
  }

  private async save(job: MSDSJob): Promise<void> {
    job.updatedAt = nowIso();
    this.mem.set(jobKey(job.tenantId, job.id), job);
    await this.ensureRedis();
    await redisService.set(jobKey(job.tenantId, job.id), job, {
      ttl: 60 * 60 * 24,
      tags: [jobListKey(job.tenantId)],
    });
    // maintain list
    const existing =
      (await redisService.get<string[]>(jobListKey(job.tenantId))) || [];
    if (!existing.includes(job.id)) {
      existing.unshift(job.id);
      await redisService.set(jobListKey(job.tenantId), existing.slice(0, 200), {
        ttl: 60 * 60 * 24,
      });
    }
  }

  async get(tenantId: string, jobId: string): Promise<MSDSJob | null> {
    const k = jobKey(tenantId, jobId);
    const mem = this.mem.get(k);
    if (mem) return mem;
    await this.ensureRedis();
    const v = await redisService.get<MSDSJob>(k);
    if (v) this.mem.set(k, v);
    return v || null;
  }

  async list(tenantId: string): Promise<MSDSJob[]> {
    await this.ensureRedis();
    const ids = (await redisService.get<string[]>(jobListKey(tenantId))) || [];
    const jobs: MSDSJob[] = [];
    for (const id of ids.slice(0, 50)) {
      const j = await this.get(tenantId, id);
      if (j) jobs.push(j);
    }
    return jobs;
  }

  async createJob(params: {
    tenantId: string;
    createdBy: string;
    files: Array<{
      filename: string;
      mimeType?: string;
      size?: number;
      buffer: Buffer;
    }>;
  }): Promise<MSDSJob> {
    const jobId = safeId("msdsjob");
    const items: MSDSJobItem[] = params.files.map((f) => ({
      id: safeId("item"),
      filename: f.filename,
      mimeType: f.mimeType,
      size: f.size,
      status: "queued",
      progress: 0,
    }));

    const job: MSDSJob = {
      id: jobId,
      tenantId: params.tenantId,
      createdBy: params.createdBy,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: "queued",
      progress: 0,
      items,
      summary: { total: items.length, completed: 0, failed: 0 },
    };

    // Persist files to temp storage (local-dev friendly; replace with object store for cloud)
    const baseDir = path.join(
      process.cwd(),
      ".tmp",
      "msds-jobs",
      params.tenantId,
      jobId,
    );
    ensureDir(baseDir);
    params.files.forEach((f, idx) => {
      const filePath = path.join(
        baseDir,
        `${idx}-${path.basename(f.filename)}`,
      );
      fs.writeFileSync(filePath, f.buffer);
    });

    await this.save(job);
    return job;
  }

  private async updateProgress(job: MSDSJob): Promise<void> {
    const total = job.items.length || 1;
    const completed = job.items.filter((i) => i.status === "completed").length;
    const failed = job.items.filter((i) => i.status === "failed").length;
    const previousProgress = job.progress;
    job.summary = { total, completed, failed };
    job.progress = clamp(
      Math.round(((completed + failed) / total) * 100),
      0,
      100,
    );
    await this.save(job);

    // Publish progress event if progress changed significantly (every 10%)
    if (
      Math.abs(job.progress - previousProgress) >= 10 ||
      job.progress === 100
    ) {
      try {
        await this.publishJobEvent(
          "msds.job.progress",
          job,
          job.tenantId,
          job.createdBy,
          {
            progress: job.progress,
            completed,
            failed,
            total,
          },
        );
      } catch (error) {
        // Non-blocking
        console.error("[msds-job] Failed to publish progress event:", error);
      }
    }
  }

  async runJob(params: {
    tenantId: string;
    jobId: string;
    actor: { userId: string; roles?: string[] };
    keys?: AIKeys;
  }): Promise<MSDSJob> {
    const job = await this.get(params.tenantId, params.jobId);
    if (!job) throw new Error("Job not found");
    if (job.status === "completed" || job.status === "cancelled") return job;
    // Allow rerun of failed jobs by resetting failed items back to queued.
    if (job.status === "failed") {
      for (const item of job.items) {
        if (item.status === "failed") {
          item.status = "queued";
          item.progress = 0;
          item.error = undefined;
        }
      }
      job.progress = 0;
    }

    job.status = "running";
    await this.save(job);

    // Publish event: job started
    await this.publishJobEvent(
      "msds.job.started",
      job,
      params.tenantId,
      params.actor.userId,
      {
        totalItems: job.items.length,
      },
    );

    const hazardPrediction = new HazardPredictionService();
    const riskAssessment = new ChemicalRiskAssessmentService();
    const compatibilityService = new ChemicalCompatibilityService();

    const baseDir = path.join(
      process.cwd(),
      ".tmp",
      "msds-jobs",
      params.tenantId,
      params.jobId,
    );

    // Determine if cloud OCR is available (used for PDF processing)
    const cloudEnabled = !!(
      params.keys?.openaiKey || params.keys?.anthropicKey
    );

    for (let idx = 0; idx < job.items.length; idx++) {
      const item = job.items[idx];
      if (item.status === "completed") continue;
      item.status = "running";
      item.progress = 5;
      await this.save(job);

      const filePath = path.join(
        baseDir,
        `${idx}-${path.basename(item.filename)}`,
      );
      const itemStartTime = Date.now();
      const ITEM_TIMEOUT = 5 * 60 * 1000; // 5 minutes per item

      try {
        const buffer = fs.readFileSync(filePath);
        const { isPDF, isExcel, isCSV } = detectFileKind(
          item.filename,
          item.mimeType,
        );

        let text = "";
        if (isExcel) {
          const XLSX = require("xlsx");
          const workbook = XLSX.read(buffer, { type: "buffer" });
          let excelText = "";
          workbook.SheetNames.forEach((sheetName: string) => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: "",
            });
            sheetData.forEach((row: any[]) => {
              if (Array.isArray(row)) {
                excelText +=
                  row
                    .filter(
                      (cell) =>
                        cell !== null && cell !== undefined && cell !== "",
                    )
                    .join(" ") + "\n";
              }
            });
          });
          text = excelText;
        } else if (isCSV) {
          text = new TextDecoder("utf-8").decode(buffer);
        } else if (isPDF) {
          // WORLD-CLASS MULTI-STRATEGY PDF EXTRACTION
          // Uses enhanced PDF extractor with intelligent fallback chain
          console.log(
            "[msds-job] Processing PDF with enhanced multi-strategy extractor:",
            item.filename,
            {
              fileSize: buffer.length,
              cloudEnabled,
              hasOpenAIKey: !!params.keys?.openaiKey,
              hasAnthropicKey: !!params.keys?.anthropicKey,
            },
          );

          try {
            const { enhancedPdfExtractor } =
              await import("@/lib/services/pdf/enhancedPdfExtractor");

            const extractionResult = await enhancedPdfExtractor.extractText(
              buffer,
              {
                tenantId: params.tenantId,
                openaiKey: params.keys?.openaiKey,
                anthropicKey: params.keys?.anthropicKey,
                maxPages: 10,
                preferCloudOCR: cloudEnabled, // Use cloud OCR first if available
              },
            );

            text = extractionResult.text;
            console.log(
              `[msds-job] ✅ PDF extraction complete: ${text.length} chars using ${extractionResult.method} (${extractionResult.pages} pages, ${extractionResult.confidence}% confidence)`,
            );

            if (
              extractionResult.warnings &&
              extractionResult.warnings.length > 0
            ) {
              console.warn(
                "[msds-job] ⚠️ Extraction warnings:",
                extractionResult.warnings,
              );
            }

            if (extractionResult.errors && extractionResult.errors.length > 0) {
              console.warn(
                "[msds-job] ⚠️ Extraction errors (non-fatal):",
                extractionResult.errors,
              );
            }

            // Log to error tracking if there were issues
            if (extractionResult.errors && extractionResult.errors.length > 0) {
              try {
                const { errorTrackingService } =
                  await import("@/lib/services/observability/errorTracking");
                errorTrackingService.captureException(
                  new Error(
                    `PDF extraction had issues: ${extractionResult.errors.join("; ")}`,
                  ),
                  {
                    module: "msds",
                    service: "pdf-extraction",
                    tenantId: params.tenantId,
                    fileName: item.filename,
                    method: extractionResult.method,
                    confidence: extractionResult.confidence,
                  },
                );
              } catch (logError) {
                console.error(
                  "[msds-job] Failed to log extraction issues:",
                  logError,
                );
              }
            }
          } catch (extractionError: any) {
            const errorMsg =
              extractionError instanceof Error
                ? extractionError.message
                : String(extractionError);
            const errorStack =
              extractionError instanceof Error
                ? extractionError.stack
                : undefined;

            console.error("[msds-job] ❌ Enhanced PDF extraction failed:", {
              error: errorMsg,
              stack: errorStack,
              fileName: item.filename,
              fileSize: buffer.length,
              hasOpenAIKey: !!params.keys?.openaiKey,
              hasAnthropicKey: !!params.keys?.anthropicKey,
            });

            // Log to error tracking
            try {
              const { errorTrackingService } =
                await import("@/lib/services/observability/errorTracking");
              const errorObj = new Error(
                `Enhanced PDF extraction failed: ${errorMsg}`,
              );
              if (errorStack) {
                errorObj.stack = errorStack;
              }
              errorTrackingService.captureException(errorObj, {
                module: "msds",
                service: "pdf-extraction",
                tenantId: params.tenantId,
                fileName: item.filename,
                hasOpenAIKey: !!params.keys?.openaiKey,
                hasAnthropicKey: !!params.keys?.anthropicKey,
                fileSize: buffer.length,
              });
            } catch (logError) {
              console.error("[msds-job] Failed to log error:", logError);
            }

            // Re-throw to be handled by outer error handler
            throw extractionError;
          }
        } else {
          text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
        }

        // Enhanced text validation with graceful degradation
        // Accept partial text and try to extract what we can
        const textLength = text?.trim().length || 0;
        const meaningfulText = text ? text.replace(/[\s\n\r\t]/g, "") : "";
        const meaningfulLength = meaningfulText.length;

        if (!text || textLength === 0) {
          // No text at all - this is a real failure
          if (isPDF && cloudEnabled) {
            throw new Error(
              "Could not extract any text from PDF even after trying both local and cloud OCR. PDF may be password-protected, corrupted, or contain only unreadable images. Try: 1) Remove password protection, 2) Convert to Excel/CSV, 3) Use a different PDF file.",
            );
          } else if (isPDF) {
            throw new Error(
              "Could not extract any text from PDF. For scanned PDFs, configure OPENAI_API_KEY or ANTHROPIC_API_KEY for cloud OCR. Alternatively, remove password protection or convert to Excel/CSV format.",
            );
          } else {
            throw new Error(
              "Could not extract any text from document. Document may be corrupted or in an unsupported format.",
            );
          }
        }

        // Graceful degradation: accept partial text if we have at least some meaningful content
        if (textLength < 50 || meaningfulLength < 20) {
          console.warn(
            `[msds-job] ⚠️ Low text extraction (${textLength} chars, ${meaningfulLength} meaningful). Continuing with partial extraction...`,
          );
          // Don't throw - continue with what we have
          // The extraction will proceed with low confidence, which is better than failing completely
        }

        item.progress = 35;
        await this.save(job);

        // Check for timeout before expensive operations
        if (Date.now() - itemStartTime > ITEM_TIMEOUT) {
          throw new Error(
            `Processing timeout: Item exceeded ${ITEM_TIMEOUT / 1000}s limit. This may indicate a slow LLM response or network issue.`,
          );
        }

        const adapter = msdsExtractionRegistry.getForTenant(params.tenantId);

        // Add timeout wrapper for extraction (LLM call can be slow)
        // Pass API keys to extraction adapter so AI service can use them
        const extractionPromise = adapter.extractFromText(text, {
          tenantId: params.tenantId,
          language: "en",
          openaiKey: params.keys?.openaiKey,
          anthropicKey: params.keys?.anthropicKey,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Extraction timeout: LLM call exceeded 3 minutes. Check your API keys and network connection.",
                ),
              ),
            3 * 60 * 1000,
          ),
        );

        const extraction = (await Promise.race([
          extractionPromise,
          timeoutPromise,
        ])) as any;

        item.progress = 70;
        await this.save(job);

        // Check timeout again before ML enrichment
        if (Date.now() - itemStartTime > ITEM_TIMEOUT) {
          console.warn(
            "[msds-job] Item processing time exceeded, skipping ML enrichment",
          );
        }

        // ML enrichment (best-effort)
        let hazards: any[] = [];
        let riskResult: any = null;
        let compatibility: any = null;
        try {
          hazards = await hazardPrediction.predictHazards({
            name:
              (extraction.parsed as any)?.chemicalName ||
              extraction.extractedData.productName,
            casNumber: extraction.extractedData.casNumber,
            hazardStatements: extraction.extractedData.hazardStatements || [],
            physicalProperties: (extraction.parsed as any)?.physicalProperties,
          } as any);

          // NOTE: riskAssessment expects internal types; we mimic the route’s minimal subset.
          const chemical = {
            id: extraction.extractedData.casNumber || "unknown",
            name: extraction.extractedData.productName,
            casNumber: extraction.extractedData.casNumber,
            hazardStatements: extraction.extractedData.hazardStatements || [],
            physicalProperties: (extraction.parsed as any)?.physicalProperties,
          } as any;
          const scenario = {
            id: "default",
            name: "General Handling",
            exposureRoute: "multiple",
            duration: "intermediate",
            frequency: "occasional",
            magnitude: "moderate",
            controlMeasures: [],
          } as any;
          const workplace = {
            id: "default",
            name: "Warehouse",
            type: "Warehouse",
            area: 1000,
            controlMeasures: [],
            averageOccupancy: 5,
            activities: [],
          } as any;
          const assessment = await riskAssessment.performRiskAssessment(
            chemical,
            scenario,
            workplace,
          );
          riskResult = {
            overallRiskScore: assessment.riskScore / 20,
            riskLevel: assessment.riskLevel,
            recommendedPPE: assessment.recommendedPPE,
            recommendedControls: assessment.recommendedControls,
          };
        } catch {
          // ignore
        }

        try {
          compatibility = await compatibilityService.checkCompatibility({
            chemicalName: extraction.extractedData.productName,
            casNumber: extraction.extractedData.casNumber,
            hazardStatements: extraction.extractedData.hazardStatements || [],
          } as any);
        } catch {
          // ignore
        }

        // Store MSDS for cross-module access with full parsed data including all 16 sections
        let storedId: string | undefined;
        try {
          const msdsId = safeId("msds");

          // Prepare extracted data with all sections and NFPA
          const fullExtractedData = {
            ...extraction.extractedData,
            // Include all 16 SDS sections if available
            sections: extraction.parsed?.sections || {},
            // Include NFPA diamond data
            nfpa: extraction.parsed?.nfpa || {
              health: parseInt(extraction.extractedData.healthRating || "0"),
              flammability: parseInt(
                extraction.extractedData.flammabilityRating || "0",
              ),
              reactivity: parseInt(
                extraction.extractedData.reactivityRating || "0",
              ),
            },
            // Include full parsed data for reference
            fullParsedData: extraction.parsed,
          };

          const msds: any = {
            id: msdsId,
            chemicalName: extraction.extractedData.productName || item.filename,
            manufacturer: extraction.extractedData.manufacturer || "Unknown",
            version: "1.0",
            language: "en",
            fileType: isPDF
              ? "pdf"
              : isExcel
                ? "excel"
                : isCSV
                  ? "csv"
                  : "unknown",
            fileUrl: filePath, // Store file path for attachment access (relative to .tmp/msds-jobs/)
            fileSize: item.size,
            extractedData: fullExtractedData, // Store full data with sections
            status: "analyzing",
            workflowStatus: "pending_analysis",
            metadata: {
              submittedDate: nowIso(),
              source: "batch_upload",
              filename: item.filename,
              jobId: params.jobId,
              itemId: item.id,
              // Store original file location
              filePath: filePath,
              // Store all sections for reference
              hasSections: !!extraction.parsed?.sections,
              sectionCount: extraction.parsed?.sections
                ? Object.keys(extraction.parsed.sections).length
                : 0,
            },
          };
          storedId = await msdsDomainService.storeExtractedMSDS({
            tenantId: params.tenantId,
            actor: { userId: params.actor.userId, roles: params.actor.roles },
            msds,
            extractedData: fullExtractedData,
            source: "batch_upload",
          });
        } catch (storeError) {
          console.error("[msds-job] Failed to store MSDS:", storeError);
          // non-blocking - continue processing
        }

        item.status = "completed";
        item.progress = 100;
        item.result = {
          extractedData: extraction.extractedData,
          confidence: extraction.confidence,
          issues: extraction.issues,
          msdsId: storedId,
          // Include production readiness info
          isProductionReady:
            (extraction.extractedData as any).isProductionReady || false,
          validationScore:
            (extraction.extractedData as any).validationScore || 0,
          sectionsCount: extraction.parsed?.sections
            ? Object.keys(extraction.parsed.sections).length
            : 0,
          hasNFPA: !!(extraction.parsed as any)?.nfpa,
        };
        await this.updateProgress(job);

        // Publish event: item completed
        await this.publishJobEvent(
          "msds.job.item.completed",
          job,
          params.tenantId,
          params.actor.userId,
          {
            itemId: item.id,
            fileName: item.filename,
            confidence: extraction.confidence,
            msdsId: storedId,
          },
        );
      } catch (e) {
        item.status = "failed";
        item.progress = 100;
        const errorMessage = e instanceof Error ? e.message : String(e);
        const errorStack = e instanceof Error ? e.stack : undefined;
        item.error = errorMessage;

        // Store detailed error log
        try {
          const { logger } =
            await import("@/lib/services/observability/logger");
          const { errorTrackingService } =
            await import("@/lib/services/observability/errorTracking");

          logger.error("MSDS batch processing failed", {
            module: "msds",
            service: "batch-processing",
            tenantId: params.tenantId,
            jobId: params.jobId,
            itemIndex: idx,
            fileName: item.filename,
            error: errorMessage,
            stack: errorStack,
            metadata: {
              fileType: isPDF
                ? "pdf"
                : isExcel
                  ? "excel"
                  : isCSV
                    ? "csv"
                    : "unknown",
              textLength: text?.length || 0,
            },
          });

          // Track error with error tracking service
          const errorObj = new Error(errorMessage);
          if (errorStack) {
            errorObj.stack = errorStack;
          }
          errorTrackingService.captureException(
            errorObj,
            {
              module: "msds",
              service: "batch-processing",
              tenantId: params.tenantId,
              jobId: params.jobId,
              itemIndex: idx,
              fileName: item.filename,
            },
            {
              jobId: params.jobId,
              itemId: item.id,
              fileName: item.filename,
              fileType: isPDF
                ? "pdf"
                : isExcel
                  ? "excel"
                  : isCSV
                    ? "csv"
                    : "unknown",
            },
          );
        } catch (logError) {
          // Non-blocking: if logging fails, still continue
          console.error("[msds-job] Failed to log error:", logError);
        }

        await this.updateProgress(job);

        // Publish event: item failed
        await this.publishJobEvent(
          "msds.job.item.failed",
          job,
          params.tenantId,
          params.actor.userId,
          {
            itemId: item.id,
            fileName: item.filename,
            error: errorMessage,
          },
        );

        // Send notification for critical failures
        try {
          await notificationService.add({
            id: `msds-job-failed-${item.id}`,
            type: "error",
            priority: "high",
            channel: "in-app",
            title: "MSDS Processing Failed",
            message: `Failed to process ${item.filename}: ${errorMessage}`,
            userId: params.actor.userId,
            tenantId: params.tenantId,
            data: {
              jobId: job.id,
              itemId: item.id,
              fileName: item.filename,
              error: errorMessage,
            },
            entityId: job.id,
            entityType: "msds_job",
            actionUrl: `/msds?jobId=${job.id}`,
          });
        } catch (notifError) {
          // Non-blocking
          console.error("[msds-job] Failed to send notification:", notifError);
        }
      }
    }

    job.status = job.items.some((i) => i.status === "failed")
      ? "failed"
      : "completed";
    await this.updateProgress(job);

    // Publish final job event
    const successful = job.items.filter((i) => i.status === "completed").length;
    const failed = job.items.filter((i) => i.status === "failed").length;

    await this.publishJobEvent(
      job.status === "completed" ? "msds.job.completed" : "msds.job.failed",
      job,
      params.tenantId,
      params.actor.userId,
      {
        successful,
        failed,
        total: job.items.length,
      },
    );

    // Send completion notification
    if (job.status === "completed" || failed > 0) {
      try {
        await notificationService.add({
          id: `msds-job-${job.status}-${job.id}`,
          type: failed > 0 ? "warning" : "success",
          priority: failed > 0 ? "medium" : "low",
          channel: "in-app",
          title: `MSDS Batch Processing ${job.status === "completed" ? "Complete" : "Failed"}`,
          message: `${successful} successful, ${failed} failed out of ${job.items.length} files`,
          userId: params.actor.userId,
          tenantId: params.tenantId,
          data: {
            jobId: job.id,
            successful,
            failed,
            total: job.items.length,
          },
          entityId: job.id,
          entityType: "msds_job",
          actionUrl: `/msds?jobId=${job.id}`,
        });
      } catch (notifError) {
        // Non-blocking
        console.error("[msds-job] Failed to send notification:", notifError);
      }
    }

    return job;
  }

  /**
   * Publish job event to event bus
   */
  private async publishJobEvent(
    eventType: string,
    job: MSDSJob,
    tenantId: string,
    userId: string,
    additionalData?: any,
  ): Promise<void> {
    try {
      const event = createEvent(
        eventType,
        job.id,
        "MSDS_JOB",
        {
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          totalItems: job.items.length,
          completedItems: job.items.filter((i) => i.status === "completed")
            .length,
          failedItems: job.items.filter((i) => i.status === "failed").length,
          ...additionalData,
        },
        1,
        {
          tenantId,
          userId,
          correlationId: `msds-job-${job.id}`,
          source: "msds",
        },
      );
      await eventBus.publish(event);
    } catch (error) {
      // Non-blocking: event publishing should not break job processing
      console.error("[msds-job] Failed to publish event:", error);
    }
  }
}

export const msdsJobService = new MSDSJobService();
