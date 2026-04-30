/**
 * Transportation Data Export Job Handler
 *
 * Exports transportation data (shipments, routes, analytics) to various formats
 */

import { JobHandler, JobProgress } from "@/types/job";
import { prisma } from "@/lib/services/database/prismaClient";

export const transportationExportHandler: JobHandler = {
  type: "DATA_EXPORT",

  async validate(input: Record<string, any>) {
    if (
      !input.format ||
      !["PDF", "EXCEL", "CSV", "JSON"].includes(input.format)
    ) {
      return {
        valid: false,
        error: "Valid format (PDF, EXCEL, CSV, JSON) is required",
      };
    }
    if (
      !input.dataType ||
      !["shipments", "routes", "carriers", "analytics", "customs"].includes(
        input.dataType,
      )
    ) {
      return { valid: false, error: "Valid dataType is required" };
    }
    return { valid: true };
  },

  async estimateDuration(input: Record<string, any>) {
    const recordCount = input.estimatedCount || 1000;
    const format = input.format || "CSV";

    // Estimate: 100 records per second for CSV, 50 for Excel, 20 for PDF
    const recordsPerSecond =
      format === "CSV" ? 100 : format === "EXCEL" ? 50 : 20;
    return (recordCount / recordsPerSecond) * 1000;
  },

  async process(job, onProgress) {
    const { format, dataType, filters, columns } = job.input;
    const tenantId = job.tenantId;

    await onProgress({
      current: 0,
      total: 100,
      percentage: 0,
      message: `Preparing ${dataType} export...`,
      stage: "initialization",
    });

    // Fetch data based on type
    let data: any[] = [];
    let totalRecords = 0;

    switch (dataType) {
      case "shipments":
        await onProgress({
          current: 10,
          total: 100,
          percentage: 10,
          message: "Fetching shipments...",
          stage: "data_fetch",
        });

        const shipmentWhere: any = { tenantId };
        if (filters?.status) shipmentWhere.status = { in: filters.status };
        if (filters?.dateFrom)
          shipmentWhere.createdAt = { gte: new Date(filters.dateFrom) };
        if (filters?.dateTo)
          shipmentWhere.createdAt = {
            ...shipmentWhere.createdAt,
            lte: new Date(filters.dateTo),
          };

        const shipments = await prisma.transportationShipment.findMany({
          where: shipmentWhere,
          take: filters?.limit || 10000,
        });

        data = shipments.map((s: any) => ({
          shipmentNumber: s.shipmentNumber,
          status: s.status,
          mode: (s.shipment as any)?.mode || "UNKNOWN",
          origin: (s.shipment as any)?.origin?.address || "",
          destination: (s.shipment as any)?.destination?.address || "",
          createdAt: s.createdAt,
          ...(s.shipment as any),
        }));
        totalRecords = data.length;
        break;

      case "routes":
        await onProgress({
          current: 10,
          total: 100,
          percentage: 10,
          message: "Fetching routes...",
          stage: "data_fetch",
        });

        const routeWhere: any = { tenantId: tenantId || undefined };
        if (filters?.mode) routeWhere.mode = filters.mode;

        const routes = await prisma.transportationRoutePlan.findMany({
          where: routeWhere,
          take: filters?.limit || 10000,
        });

        data = routes.map((r: any) => ({
          name: r.name,
          mode: r.mode,
          type: r.type,
          origin: r.origin,
          destination: r.destination,
          score: r.score,
          createdAt: r.createdAt,
        }));
        totalRecords = data.length;
        break;

      case "carriers":
        await onProgress({
          current: 10,
          total: 100,
          percentage: 10,
          message: "Fetching carriers...",
          stage: "data_fetch",
        });

        // Note: Carriers might be in a different table or service
        // This is a placeholder - adjust based on your schema
        data = [];
        totalRecords = 0;
        break;

      case "analytics":
        await onProgress({
          current: 10,
          total: 100,
          percentage: 10,
          message: "Generating analytics data...",
          stage: "data_fetch",
        });

        // Generate analytics summary
        const analyticsData = await generateAnalyticsData(tenantId, filters);
        data = analyticsData;
        totalRecords = data.length;
        break;

      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }

    await onProgress({
      current: 30,
      total: 100,
      percentage: 30,
      message: `Found ${totalRecords} records. Formatting data...`,
      stage: "formatting",
    });

    // Format data based on requested format
    let formattedData: string | Buffer;
    let mimeType: string;
    let fileExtension: string;

    switch (format) {
      case "CSV":
        formattedData = formatAsCSV(data, columns);
        mimeType = "text/csv";
        fileExtension = "csv";
        break;

      case "EXCEL":
        formattedData = await formatAsExcel(data, columns);
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileExtension = "xlsx";
        break;

      case "PDF":
        formattedData = await formatAsPDF(data, columns, dataType);
        mimeType = "application/pdf";
        fileExtension = "pdf";
        break;

      case "JSON":
        formattedData = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        fileExtension = "json";
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    await onProgress({
      current: 80,
      total: 100,
      percentage: 80,
      message: "Saving export file...",
      stage: "saving",
    });

    // Save file (in production, save to S3 or similar)
    const fileName = `${dataType}_export_${Date.now()}.${fileExtension}`;
    const fileUrl = await saveExportFile(
      fileName,
      formattedData,
      mimeType,
      tenantId,
    );

    await onProgress({
      current: 100,
      total: 100,
      percentage: 100,
      message: "Export completed successfully!",
      stage: "completed",
    });

    return {
      fileName,
      fileUrl,
      format,
      recordCount: totalRecords,
      fileSize: Buffer.byteLength(formattedData as Buffer),
      mimeType,
    };
  },

  async cleanup(job) {
    // Cleanup temporary files if any
    console.log(`Cleaning up export job ${job.id}`);
  },
};

// Helper functions
function formatAsCSV(data: any[], columns?: string[]): string {
  if (data.length === 0) return "";

  const keys = columns || Object.keys(data[0]);
  const header = keys.join(",");
  const rows = data.map((item) =>
    keys
      .map((key) => {
        const value = item[key];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value).replace(/"/g, '""');
      })
      .join(","),
  );

  return [header, ...rows].join("\n");
}

async function formatAsExcel(data: any[], columns?: string[]): Promise<Buffer> {
  // In production, use a library like 'exceljs' or 'xlsx'
  // For now, return CSV as placeholder
  const csv = formatAsCSV(data, columns);
  return Buffer.from(csv, "utf-8");
}

async function formatAsPDF(
  data: any[],
  columns: string[] | undefined,
  dataType: string,
): Promise<Buffer> {
  // In production, use a library like 'pdfkit' or 'puppeteer'
  // For now, return a simple text representation
  const text = `Export: ${dataType}\nRecords: ${data.length}\n\n${JSON.stringify(data.slice(0, 10), null, 2)}`;
  return Buffer.from(text, "utf-8");
}

async function saveExportFile(
  fileName: string,
  data: string | Buffer,
  mimeType: string,
  tenantId: string,
): Promise<string> {
  // In production, save to S3, Azure Blob, or similar
  // For now, store metadata in database
  await prisma.transportationExportRecord.create({
    data: {
      tenantId,
      reportType: "data_export",
      format: mimeType.includes("csv")
        ? "CSV"
        : mimeType.includes("excel")
          ? "EXCEL"
          : mimeType.includes("pdf")
            ? "PDF"
            : "JSON",
      fileName,
      mimeType,
      objectName: `exports/${tenantId}/${fileName}`,
      fileSize: Buffer.byteLength(data as Buffer),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdBy: "system",
    },
  });

  // Return a download URL (in production, this would be a signed S3 URL)
  return `/api/transportation/exports/${fileName}`;
}

async function generateAnalyticsData(
  tenantId: string,
  filters: any,
): Promise<any[]> {
  // Generate analytics summary data
  const shipments = await prisma.transportationShipment.findMany({
    where: { tenantId },
    take: 1000,
  });

  // Group by status
  const byStatus = new Map<string, number>();
  shipments.forEach((s: any) => {
    const status = s.status || "UNKNOWN";
    byStatus.set(status, (byStatus.get(status) || 0) + 1);
  });

  return Array.from(byStatus.entries()).map(([status, count]) => ({
    metric: "shipments_by_status",
    status,
    count,
    percentage: (count / shipments.length) * 100,
  }));
}
