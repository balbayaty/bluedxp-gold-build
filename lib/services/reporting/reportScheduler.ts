/**
 * Report Scheduler Service
 * Schedule automated report generation and delivery
 */

import { ReportConfig } from "./reportBuilder";
import { reportGenerator } from "./reportGenerator";

export interface ScheduledReport {
  id: string;
  reportId: string;
  schedule: {
    frequency: "daily" | "weekly" | "monthly";
    time: string; // HH:mm format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
  recipients: string[];
  lastRun?: Date;
  nextRun: Date;
  enabled: boolean;
}

export class ReportScheduler {
  private scheduledReports: Map<string, ScheduledReport> = new Map();
  private interval: NodeJS.Timeout | null = null;

  /**
   * Start scheduler
   */
  start(): void {
    if (this.interval) {
      return;
    }

    // Check every minute for scheduled reports
    this.interval = setInterval(() => {
      this.checkScheduledReports();
    }, 60000); // Check every minute
  }

  /**
   * Stop scheduler
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Schedule a report
   */
  scheduleReport(report: ScheduledReport): void {
    this.scheduledReports.set(report.id, report);
    this.calculateNextRun(report);
  }

  /**
   * Unschedule a report
   */
  unscheduleReport(reportId: string): void {
    this.scheduledReports.delete(reportId);
  }

  /**
   * Check and run scheduled reports
   */
  private async checkScheduledReports(): Promise<void> {
    const now = new Date();

    for (const [id, scheduled] of this.scheduledReports.entries()) {
      if (!scheduled.enabled) continue;

      if (scheduled.nextRun <= now) {
        await this.runScheduledReport(scheduled);
        this.calculateNextRun(scheduled);
      }
    }
  }

  /**
   * Run a scheduled report
   */
  private async runScheduledReport(scheduled: ScheduledReport): Promise<void> {
    try {
      // Fetch report config from database
      let reportConfig: ReportConfig | null = null;

      try {
        const { prisma } = await import("@/lib/services/database/prismaClient");

        const savedReport = await prisma.savedReport.findUnique({
          where: { id: scheduled.reportId },
        });

        if (savedReport) {
          reportConfig = {
            id: savedReport.id,
            name: savedReport.name,
            description: savedReport.description || undefined,
            module: (savedReport as any).module || "general",
            type: (savedReport as any).type || "summary",
            format: (savedReport as any).format || "pdf",
            filters: (savedReport as any).filters || {},
            columns: (savedReport as any).columns || [],
            sorting: (savedReport as any).sorting || [],
            grouping: (savedReport as any).grouping || [],
            aggregations: (savedReport as any).aggregations || [],
          };
        }
      } catch (dbError) {
        console.warn("Could not fetch report config from database:", dbError);
      }

      if (!reportConfig) {
        console.error(
          `Report config not found for scheduled report: ${scheduled.reportId}`,
        );
        return;
      }

      // Generate report data
      const data = await reportGenerator.generateReportData(reportConfig);

      // Generate report file
      let blob: Blob;
      switch (reportConfig.format) {
        case "pdf":
          blob = await reportGenerator.generatePDF(reportConfig, data);
          break;
        case "excel":
          blob = await reportGenerator.generateExcel(reportConfig, data);
          break;
        case "csv":
          const csv = await reportGenerator.generateCSV(reportConfig, data);
          blob = new Blob([csv], { type: "text/csv" });
          break;
        case "json":
          const json = await reportGenerator.generateJSON(reportConfig, data);
          blob = new Blob([json], { type: "application/json" });
          break;
        default:
          return;
      }

      // Send to recipients
      await this.sendReportToRecipients(scheduled, blob, reportConfig);

      // Update last run
      scheduled.lastRun = new Date();
    } catch (error) {
      console.error("Error running scheduled report:", error);
    }
  }

  /**
   * Send report to recipients
   */
  private async sendReportToRecipients(
    scheduled: ScheduledReport,
    blob: Blob,
    config: ReportConfig,
  ): Promise<void> {
    console.log(
      `Sending report ${config.name} to ${scheduled.recipients.length} recipients`,
    );

    // Convert blob to buffer for storage
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate report filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = this.getFileExtension(config.format);
    const filename = `${config.name.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}.${extension}`;

    // Store report in file system (in production, use cloud storage like S3, MinIO)
    try {
      const fs = await import("fs").then((m) => m.promises);
      const path = await import("path");

      // Create reports directory if it doesn't exist
      const reportsDir = path.join(process.cwd(), "reports", "scheduled");
      try {
        await fs.mkdir(reportsDir, { recursive: true });
      } catch (e) {
        // Directory might already exist
      }

      // Save report file
      const filePath = path.join(reportsDir, filename);
      await fs.writeFile(filePath, buffer);

      console.log(`Report saved to: ${filePath}`);

      // Log notification for each recipient (in production, send via email)
      for (const recipient of scheduled.recipients) {
        // Import notification service
        try {
          const { notificationService } =
            await import("@/lib/services/notifications");

          await notificationService.sendNotification({
            type: "REPORT_READY",
            userId: recipient,
            title: `Scheduled Report Ready: ${config.name}`,
            message: `Your scheduled report "${config.name}" is ready for download.`,
            data: {
              reportId: scheduled.reportId,
              filename,
              format: config.format,
              generatedAt: new Date().toISOString(),
            },
            priority: "LOW",
          });
        } catch (notifyError) {
          console.warn(`Could not notify recipient ${recipient}:`, notifyError);
        }
      }

      // Also publish event for integrations
      try {
        const { eventBus } = await import("@/lib/services/event-bus");
        await eventBus.publish({
          type: "report.scheduled.generated",
          aggregateId: scheduled.reportId,
          aggregateType: "ScheduledReport",
          payload: {
            reportId: scheduled.reportId,
            reportName: config.name,
            filename,
            format: config.format,
            recipientCount: scheduled.recipients.length,
            filePath,
          },
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });
      } catch (eventError) {
        console.warn("Could not publish report event:", eventError);
      }
    } catch (error) {
      console.error("Error storing/sending scheduled report:", error);
      throw error;
    }
  }

  /**
   * Get file extension for report format
   */
  private getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
      pdf: "pdf",
      excel: "xlsx",
      csv: "csv",
      json: "json",
      html: "html",
    };
    return extensions[format] || "dat";
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(scheduled: ScheduledReport): void {
    const now = new Date();
    const [hours, minutes] = scheduled.schedule.time.split(":").map(Number);

    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (scheduled.schedule.frequency) {
      case "daily":
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case "weekly":
        const targetDay = scheduled.schedule.dayOfWeek || 0;
        const currentDay = now.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;

        if (daysUntilTarget === 0 && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        }
        break;

      case "monthly":
        const targetDayOfMonth = scheduled.schedule.dayOfMonth || 1;
        nextRun.setDate(targetDayOfMonth);

        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }

    scheduled.nextRun = nextRun;
  }

  /**
   * Get all scheduled reports
   */
  getAllScheduled(): ScheduledReport[] {
    return Array.from(this.scheduledReports.values());
  }

  /**
   * Get scheduled report by ID
   */
  getScheduled(id: string): ScheduledReport | null {
    return this.scheduledReports.get(id) || null;
  }
}

export const reportScheduler = new ReportScheduler();

// Auto-start scheduler
if (typeof window === "undefined") {
  // Server-side only
  reportScheduler.start();
}
