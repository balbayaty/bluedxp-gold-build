/**
 * Export & Reporting Service
 *
 * Comprehensive export and reporting capabilities
 * PDF, Excel, CSV, JSON exports
 * Custom report builder
 * Scheduled reports
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";
import type { Shipment, JourneyAnalysis } from "@/lib/services/transportation";
import { prisma } from "@/lib/services/database/prismaClient";
import { objectStorageService } from "@/lib/services/storage/objectStorageService";

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = "PDF" | "EXCEL" | "CSV" | "JSON" | "XML" | "HTML";

export type ReportType =
  | "SHIPMENT_SUMMARY"
  | "SHIPMENT_DETAILED"
  | "JOURNEY_ANALYSIS"
  | "ROUTE_COMPARISON"
  | "COST_ANALYSIS"
  | "EMISSIONS_REPORT"
  | "CARRIER_PERFORMANCE"
  | "CUSTOMS_STATUS"
  | "EXCEPTION_REPORT"
  | "ANALYTICS_DASHBOARD"
  | "CUSTOM";

export interface ExportRequest {
  reportType: ReportType;
  format: ExportFormat;
  data: any;
  filters?: {
    dateRange?: { start: Date; end: Date };
    shipmentIds?: string[];
    carrierIds?: string[];
    statuses?: string[];
    modes?: string[];
  };
  options?: {
    includeCharts?: boolean;
    includeImages?: boolean;
    includeDetails?: boolean;
    template?: string;
    customFields?: string[];
  };
  createdBy: string;
}

export interface ExportResult {
  id: string;
  reportType: ReportType;
  format: ExportFormat;
  fileName: string;
  fileSize: number; // bytes
  downloadUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ScheduledReport {
  id: string;
  name: string;
  reportType: ReportType;
  format: ExportFormat;
  schedule: {
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
    dayOfWeek?: number; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    time?: string; // HH:mm
    timezone?: string;
  };
  filters?: ExportRequest["filters"];
  recipients: string[]; // Email addresses
  options?: ExportRequest["options"];
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
  createdBy: string;
}

export interface CustomReportTemplate {
  id: string;
  name: string;
  description: string;
  reportType: ReportType;
  sections: ReportSection[];
  layout: "PORTRAIT" | "LANDSCAPE";
  header?: ReportHeader;
  footer?: ReportFooter;
  styling?: ReportStyling;
  createdAt: Date;
  createdBy: string;
}

export interface ReportSection {
  id: string;
  type: "TEXT" | "TABLE" | "CHART" | "IMAGE" | "SUMMARY" | "DETAILS";
  title?: string;
  dataSource: string;
  fields?: string[];
  chartType?: "BAR" | "LINE" | "PIE" | "AREA" | "SCATTER";
  position: number;
  options?: Record<string, any>;
}

export interface ReportHeader {
  logo?: string;
  title: string;
  subtitle?: string;
  companyInfo?: {
    name: string;
    address: string;
    contact: string;
  };
}

export interface ReportFooter {
  text?: string;
  pageNumbers?: boolean;
  date?: boolean;
  customFields?: Record<string, string>;
}

export interface ReportStyling {
  fontFamily?: string;
  fontSize?: number;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  theme?: "LIGHT" | "DARK" | "CUSTOM";
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class ExportReportingService {
  private exports: Map<string, ExportResult> = new Map();
  private exportPayloads: Map<
    string,
    { content: Buffer; mimeType: string; fileName: string }
  > = new Map();
  private scheduledReports: Map<string, ScheduledReport> = new Map();
  private templates: Map<string, CustomReportTemplate> = new Map();
  private storageReady: boolean = false;

  private async ensureObjectStorage(): Promise<void> {
    if (this.storageReady) return;
    await objectStorageService.initialize();
    if (!objectStorageService.isEnabled()) {
      throw new Error(
        "Object storage is not enabled (MinIO). Exports require durable object storage in production.",
      );
    }
    this.storageReady = true;
  }

  /**
   * Export data to specified format
   */
  async exportData(request: ExportRequest): Promise<ExportResult> {
    // Generate file based on format
    let fileName: string;
    let fileContent: Buffer | string;
    let mimeType: string;

    switch (request.format) {
      case "PDF":
        const pdfResult = await this.generatePDF(request);
        fileName = pdfResult.fileName;
        fileContent = pdfResult.content;
        mimeType = "application/pdf";
        break;

      case "EXCEL":
        const excelResult = await this.generateExcel(request);
        fileName = excelResult.fileName;
        fileContent = excelResult.content;
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;

      case "CSV":
        const csvResult = await this.generateCSV(request);
        fileName = csvResult.fileName;
        fileContent = csvResult.content;
        mimeType = "text/csv";
        break;

      case "JSON":
        const jsonResult = await this.generateJSON(request);
        fileName = jsonResult.fileName;
        fileContent = jsonResult.content;
        mimeType = "application/json";
        break;

      case "XML":
        const xmlResult = await this.generateXML(request);
        fileName = xmlResult.fileName;
        fileContent = xmlResult.content;
        mimeType = "application/xml";
        break;

      case "HTML":
        const htmlResult = await this.generateHTML(request);
        fileName = htmlResult.fileName;
        fileContent = htmlResult.content;
        mimeType = "text/html";
        break;

      default:
        throw new Error(`Unsupported export format: ${request.format}`);
    }

    // Create export result
    const exportId = `export-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const result: ExportResult = {
      id: exportId,
      reportType: request.reportType,
      format: request.format,
      fileName,
      fileSize: Buffer.isBuffer(fileContent)
        ? fileContent.length
        : Buffer.from(fileContent).length,
      downloadUrl: `/api/transportation/exports/${exportId}/download`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    };

    const payloadBuffer = Buffer.isBuffer(fileContent)
      ? fileContent
      : Buffer.from(fileContent);

    if (process.env.NODE_ENV === "production") {
      if (!request.tenantId) {
        throw new Error("tenantId is required for exports in production");
      }
      await this.ensureObjectStorage();
      const objectName = `transportation/exports/${request.tenantId}/${exportId}/${fileName}`;
      await objectStorageService.upload(objectName, payloadBuffer, {
        contentType: mimeType,
        metadata: {
          "x-tenant-id": request.tenantId,
          "x-export-id": exportId,
          "x-report-type": request.reportType,
          "x-format": request.format,
        },
      });

      await prisma.transportationExportRecord.create({
        data: {
          id: exportId,
          tenantId: request.tenantId,
          reportType: request.reportType,
          format: request.format,
          fileName,
          mimeType,
          objectName,
          fileSize: payloadBuffer.length,
          expiresAt: result.expiresAt,
          createdBy: request.createdBy,
        },
      });
    } else {
      this.exports.set(exportId, result);
      // Dev: store payload in-memory
      this.exportPayloads.set(exportId, {
        content: payloadBuffer,
        mimeType,
        fileName,
      });
    }

    // Store file content (in production, store in cloud storage)
    // For now, store in memory (would use S3, Azure Blob, etc.)

    // Publish event
    await eventBus.publish("transportation.export.created", {
      exportId,
      reportType: request.reportType,
      format: request.format,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Generate PDF report
   */
  private async generatePDF(
    request: ExportRequest,
  ): Promise<{ fileName: string; content: Buffer }> {
    const reportData = this.prepareReportData(request);
    const fileName = `${request.reportType.toLowerCase().replace(/_/g, "-")}-${Date.now()}.pdf`;
    // Generate a real PDF (server-side)
    const { jsPDF } = await import("jspdf");
    const autoTableModule: any = await import("jspdf-autotable");
    const autoTable = autoTableModule.default || autoTableModule;

    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text(`Transportation Report: ${request.reportType}`, 40, 50);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toISOString()}`, 40, 70);

    let cursorY = 95;

    const addKeyValueBlock = (title: string, obj: Record<string, any>) => {
      doc.setFontSize(12);
      doc.text(title, 40, cursorY);
      cursorY += 12;
      doc.setFontSize(9);
      const lines = Object.entries(obj).map(
        ([k, v]) =>
          `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
      );
      for (const line of lines.slice(0, 40)) {
        doc.text(line, 40, cursorY);
        cursorY += 11;
        if (cursorY > 740) {
          doc.addPage();
          cursorY = 50;
        }
      }
      cursorY += 10;
    };

    const addTable = (title: string, rows: any[]) => {
      doc.setFontSize(12);
      doc.text(title, 40, cursorY);
      cursorY += 8;
      const first = rows[0] || {};
      const headers = Object.keys(first).slice(0, 12);
      const body = rows.slice(0, 200).map((r) =>
        headers.map((h) => {
          const v = (r as any)[h];
          return typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
        }),
      );
      autoTable(doc, {
        startY: cursorY,
        head: [headers],
        body,
        styles: { fontSize: 7, cellPadding: 2 },
      });
      cursorY = (doc as any).lastAutoTable?.finalY
        ? (doc as any).lastAutoTable.finalY + 18
        : cursorY + 18;
    };

    // Common patterns in prepared data
    if (reportData?.summary && typeof reportData.summary === "object") {
      addKeyValueBlock("Summary", reportData.summary);
    }
    if (Array.isArray(reportData?.shipments)) {
      addTable("Shipments", reportData.shipments);
    } else if (Array.isArray(reportData?.carriers)) {
      addTable("Carriers", reportData.carriers);
    } else if (Array.isArray(reportData?.routes)) {
      addTable("Routes", reportData.routes);
    } else if (Array.isArray(reportData?.touchpoints)) {
      addTable("Touchpoints", reportData.touchpoints);
    } else if (Array.isArray(reportData)) {
      addTable("Rows", reportData);
    } else if (reportData && typeof reportData === "object") {
      addKeyValueBlock("Report Data", reportData);
    } else {
      addKeyValueBlock("Report Data", { value: reportData });
    }

    const arrayBuffer = doc.output("arraybuffer");
    return { fileName, content: Buffer.from(arrayBuffer) };
  }

  /**
   * Generate Excel report
   */
  private async generateExcel(
    request: ExportRequest,
  ): Promise<{ fileName: string; content: Buffer }> {
    const reportData = this.prepareReportData(request);
    const fileName = `${request.reportType.toLowerCase().replace(/_/g, "-")}-${Date.now()}.xlsx`;
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, json: any) => {
      const rows = Array.isArray(json) ? json : [json];
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    };

    if (reportData?.summary && typeof reportData.summary === "object")
      addSheet("Summary", reportData.summary);
    if (Array.isArray(reportData?.shipments))
      addSheet("Shipments", reportData.shipments);
    if (Array.isArray(reportData?.touchpoints))
      addSheet("Touchpoints", reportData.touchpoints);
    if (Array.isArray(reportData?.transportLegs))
      addSheet("TransportLegs", reportData.transportLegs);
    if (Array.isArray(reportData?.routes))
      addSheet("Routes", reportData.routes);
    if (Array.isArray(reportData?.carriers))
      addSheet("Carriers", reportData.carriers);
    if (Object.keys(wb.Sheets).length === 0) addSheet("Report", reportData);

    const out = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx",
    }) as unknown as Buffer;
    return { fileName, content: out };
  }

  /**
   * Generate CSV report
   */
  private async generateCSV(
    request: ExportRequest,
  ): Promise<{ fileName: string; content: string }> {
    const reportData = this.prepareReportData(request);
    const csvRows = this.buildCSVRows(reportData, request);

    const fileName = `${request.reportType.toLowerCase().replace(/_/g, "-")}-${Date.now()}.csv`;
    const content = csvRows.join("\n");

    return { fileName, content };
  }

  /**
   * Generate JSON report
   */
  private async generateJSON(
    request: ExportRequest,
  ): Promise<{ fileName: string; content: string }> {
    const reportData = this.prepareReportData(request);
    const fileName = `${request.reportType.toLowerCase().replace(/_/g, "-")}-${Date.now()}.json`;
    const content = JSON.stringify(reportData, null, 2);

    return { fileName, content };
  }

  /**
   * Generate XML report
   */
  private async generateXML(
    request: ExportRequest,
  ): Promise<{ fileName: string; content: string }> {
    const reportData = this.prepareReportData(request);
    const xmlContent = this.buildXMLContent(reportData, request);

    const fileName = `${request.reportType.toLowerCase().replace(/_/g, "-")}-${Date.now()}.xml`;
    return { fileName, content: xmlContent };
  }

  /**
   * Generate HTML report
   */
  private async generateHTML(
    request: ExportRequest,
  ): Promise<{ fileName: string; content: string }> {
    const reportData = this.prepareReportData(request);
    const htmlContent = this.buildHTMLContent(reportData, request);

    const fileName = `${request.reportType.toLowerCase().replace(/_/g, "-")}-${Date.now()}.html`;
    return { fileName, content: htmlContent };
  }

  /**
   * Prepare report data
   */
  private prepareReportData(request: ExportRequest): any {
    // Filter and prepare data based on report type
    let data = request.data;

    // Apply filters
    if (request.filters) {
      if (request.filters.dateRange) {
        // Filter by date range
      }
      if (request.filters.shipmentIds) {
        // Filter by shipment IDs
      }
      if (request.filters.carrierIds) {
        // Filter by carrier IDs
      }
      if (request.filters.statuses) {
        // Filter by statuses
      }
      if (request.filters.modes) {
        // Filter by modes
      }
    }

    // Transform based on report type
    switch (request.reportType) {
      case "SHIPMENT_SUMMARY":
        return this.prepareShipmentSummary(data);
      case "SHIPMENT_DETAILED":
        return this.prepareShipmentDetailed(data);
      case "JOURNEY_ANALYSIS":
        return this.prepareJourneyAnalysis(data);
      case "ROUTE_COMPARISON":
        return this.prepareRouteComparison(data);
      case "COST_ANALYSIS":
        return this.prepareCostAnalysis(data);
      case "EMISSIONS_REPORT":
        return this.prepareEmissionsReport(data);
      case "CARRIER_PERFORMANCE":
        return this.prepareCarrierPerformance(data);
      case "CUSTOMS_STATUS":
        return this.prepareCustomsStatus(data);
      case "EXCEPTION_REPORT":
        return this.prepareExceptionReport(data);
      case "ANALYTICS_DASHBOARD":
        return this.prepareAnalyticsDashboard(data);
      default:
        return data;
    }
  }

  /**
   * Prepare shipment summary data
   */
  private prepareShipmentSummary(data: any): any {
    return {
      summary: {
        totalShipments: Array.isArray(data) ? data.length : 1,
        totalWeight: Array.isArray(data)
          ? data.reduce((sum: number, s: any) => sum + (s.totalWeight || 0), 0)
          : data.totalWeight || 0,
        totalVolume: Array.isArray(data)
          ? data.reduce((sum: number, s: any) => sum + (s.totalVolume || 0), 0)
          : data.totalVolume || 0,
        totalValue: Array.isArray(data)
          ? data.reduce((sum: number, s: any) => sum + (s.totalValue || 0), 0)
          : data.totalValue || 0,
      },
      shipments: Array.isArray(data) ? data : [data],
    };
  }

  /**
   * Prepare shipment detailed data
   */
  private prepareShipmentDetailed(data: any): any {
    const shipments = Array.isArray(data) ? data : [data];
    return {
      shipments: shipments.map((s: any) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        status: s.status,
        origin: s.origin,
        destination: s.destination,
        mode: s.mode,
        type: s.type,
        cargo: {
          items: s.items,
          totalWeight: s.totalWeight,
          totalVolume: s.totalVolume,
          totalValue: s.totalValue,
        },
        dates: {
          pickup: s.pickupDate,
          estimatedDelivery: s.estimatedDelivery,
          actualDelivery: s.actualDelivery,
        },
        carrier: s.carrier,
        route: s.route,
        cost: s.cost,
        documents: s.documents,
        exceptions: s.exceptions,
      })),
    };
  }

  /**
   * Prepare journey analysis data
   */
  private prepareJourneyAnalysis(data: JourneyAnalysis): any {
    return {
      journey: {
        id: data.id,
        journeyName: data.journeyName,
        origin: data.origin,
        destination: data.destination,
        totalDistance: data.totalDistance,
        estimatedTotalDuration: data.estimatedTotalDuration,
        status: data.status,
      },
      touchpoints: data.touchpoints.map((tp) => ({
        sequence: tp.sequence,
        type: tp.type,
        name: tp.name,
        location: tp.location,
        status: tp.status,
        estimatedArrival: tp.estimatedArrival,
        estimatedDeparture: tp.estimatedDeparture,
        processingTime: tp.processingTime,
        customsStatus: tp.customsStatus,
      })),
      transportLegs: data.transportLegs.map((leg) => ({
        sequence: leg.sequence,
        mode: leg.mode,
        distance: leg.distance,
        estimatedDuration: leg.estimatedDuration,
        status: leg.status,
      })),
      bottlenecks: data.bottlenecks,
      insights: data.insights,
    };
  }

  /**
   * Prepare route comparison data
   */
  private prepareRouteComparison(data: any): any {
    return {
      routes: data.routes || [],
      recommended: data.recommended,
      comparison: data.comparison,
    };
  }

  /**
   * Prepare cost analysis data
   */
  private prepareCostAnalysis(data: any): any {
    return {
      totalCost: data.totalCost || 0,
      breakdown: data.breakdown || {},
      trends: data.trends || [],
      savings: data.savings || 0,
    };
  }

  /**
   * Prepare emissions report data
   */
  private prepareEmissionsReport(data: any): any {
    return {
      totalCO2e: data.totalCO2e || 0,
      breakdown: data.breakdown || {},
      byMode: data.byMode || {},
      recommendations: data.recommendations || [],
    };
  }

  /**
   * Prepare carrier performance data
   */
  private prepareCarrierPerformance(data: any): any {
    return {
      carriers: Array.isArray(data) ? data : [data],
      metrics: {
        onTimeRate: data.onTimeRate || 0,
        averageTransitTime: data.averageTransitTime || 0,
        costEfficiency: data.costEfficiency || 0,
      },
    };
  }

  /**
   * Prepare customs status data
   */
  private prepareCustomsStatus(data: any): any {
    return {
      customs: Array.isArray(data) ? data : [data],
      statuses: {
        cleared: data.filter((c: any) => c.status === "CLEARED").length,
        pending: data.filter((c: any) => c.status === "PENDING").length,
        held: data.filter((c: any) => c.status === "HELD").length,
      },
    };
  }

  /**
   * Prepare exception report data
   */
  private prepareExceptionReport(data: any): any {
    const shipments = Array.isArray(data) ? data : [data];
    const exceptions = shipments.flatMap((s: any) => s.exceptions || []);

    return {
      totalExceptions: exceptions.length,
      byType: this.groupBy(exceptions, "type"),
      bySeverity: this.groupBy(exceptions, "severity"),
      exceptions: exceptions,
    };
  }

  /**
   * Prepare analytics dashboard data
   */
  private prepareAnalyticsDashboard(data: any): any {
    return {
      metrics: data.metrics || {},
      charts: data.charts || [],
      insights: data.insights || [],
    };
  }

  /**
   * Build PDF content
   */
  private buildPDFContent(data: any, request: ExportRequest): any {
    // In production, use jsPDF with proper formatting
    return {
      title: this.getReportTitle(request.reportType),
      data,
      generatedAt: new Date().toISOString(),
      generatedBy: request.createdBy,
    };
  }

  /**
   * Build Excel content
   */
  private buildExcelContent(data: any, request: ExportRequest): any {
    // In production, use xlsx library
    return {
      sheets: [
        {
          name: "Summary",
          data: this.flattenData(data),
        },
      ],
    };
  }

  /**
   * Build CSV rows
   */
  private buildCSVRows(data: any, request: ExportRequest): string[] {
    const rows: string[] = [];
    const flatData = this.flattenData(data);

    if (flatData.length > 0) {
      // Header row
      const headers = Object.keys(flatData[0]);
      rows.push(headers.join(","));

      // Data rows
      flatData.forEach((row) => {
        rows.push(
          headers.map((h) => this.escapeCSV(String(row[h] || ""))).join(","),
        );
      });
    }

    return rows;
  }

  /**
   * Build XML content
   */
  private buildXMLContent(data: any, request: ExportRequest): string {
    const xml = ['<?xml version="1.0" encoding="UTF-8"?>'];
    xml.push(`<report type="${request.reportType}">`);
    xml.push(this.objectToXML(data, 1));
    xml.push("</report>");
    return xml.join("\n");
  }

  /**
   * Build HTML content
   */
  private buildHTMLContent(data: any, request: ExportRequest): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${this.getReportTitle(request.reportType)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .header { margin-bottom: 30px; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.getReportTitle(request.reportType)}</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  ${this.dataToHTML(data)}
  <div class="footer">
    <p>Generated by: ${request.createdBy}</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Helper methods
   */
  private flattenData(data: any): any[] {
    if (Array.isArray(data)) return data;
    return [data];
  }

  private escapeCSV(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private objectToXML(obj: any, indent: number): string {
    const spaces = "  ".repeat(indent);
    const lines: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        lines.push(`${spaces}<${key}>`);
        lines.push(this.objectToXML(value, indent + 1));
        lines.push(`${spaces}</${key}>`);
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          lines.push(`${spaces}<${key}>`);
          if (typeof item === "object") {
            lines.push(this.objectToXML(item, indent + 1));
          } else {
            lines.push(`${spaces}  ${this.escapeXML(String(item))}`);
          }
          lines.push(`${spaces}</${key}>`);
        });
      } else {
        lines.push(
          `${spaces}<${key}>${this.escapeXML(String(value))}</${key}>`,
        );
      }
    }

    return lines.join("\n");
  }

  private escapeXML(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private dataToHTML(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return "<p>No data available</p>";

      const headers = Object.keys(data[0]);
      let html = "<table><thead><tr>";
      headers.forEach((h) => {
        html += `<th>${h}</th>`;
      });
      html += "</tr></thead><tbody>";

      data.forEach((row) => {
        html += "<tr>";
        headers.forEach((h) => {
          html += `<td>${row[h] || ""}</td>`;
        });
        html += "</tr>";
      });

      html += "</tbody></table>";
      return html;
    }

    if (typeof data === "object") {
      let html = "<table>";
      for (const [key, value] of Object.entries(data)) {
        html += `<tr><th>${key}</th><td>${typeof value === "object" ? JSON.stringify(value) : value}</td></tr>`;
      }
      html += "</table>";
      return html;
    }

    return `<p>${data}</p>`;
  }

  private getReportTitle(reportType: ReportType): string {
    const titles: Record<ReportType, string> = {
      SHIPMENT_SUMMARY: "Shipment Summary Report",
      SHIPMENT_DETAILED: "Detailed Shipment Report",
      JOURNEY_ANALYSIS: "Journey Analysis Report",
      ROUTE_COMPARISON: "Route Comparison Report",
      COST_ANALYSIS: "Cost Analysis Report",
      EMISSIONS_REPORT: "CO2 Emissions Report",
      CARRIER_PERFORMANCE: "Carrier Performance Report",
      CUSTOMS_STATUS: "Customs Status Report",
      EXCEPTION_REPORT: "Exception Report",
      ANALYTICS_DASHBOARD: "Analytics Dashboard Report",
      CUSTOM: "Custom Report",
    };
    return titles[reportType] || "Report";
  }

  private groupBy(array: any[], key: string): Record<string, any[]> {
    return array.reduce(
      (groups, item) => {
        const group = item[key] || "UNKNOWN";
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
        return groups;
      },
      {} as Record<string, any[]>,
    );
  }

  /**
   * Create scheduled report
   */
  async createScheduledReport(request: {
    name: string;
    reportType: ReportType;
    format: ExportFormat;
    schedule: ScheduledReport["schedule"];
    filters?: ExportRequest["filters"];
    recipients: string[];
    options?: ExportRequest["options"];
    createdBy: string;
  }): Promise<ScheduledReport> {
    const nextRun = this.calculateNextRun(request.schedule);

    const scheduled: ScheduledReport = {
      id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: request.name,
      reportType: request.reportType,
      format: request.format,
      schedule: request.schedule,
      filters: request.filters,
      recipients: request.recipients,
      options: request.options,
      isActive: true,
      nextRun,
      createdAt: new Date(),
      createdBy: request.createdBy,
    };

    this.scheduledReports.set(scheduled.id, scheduled);

    await eventBus.publish("transportation.report.scheduled", {
      reportId: scheduled.id,
      nextRun: scheduled.nextRun.toISOString(),
      timestamp: new Date().toISOString(),
    });

    return scheduled;
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(schedule: ScheduledReport["schedule"]): Date {
    const now = new Date();
    const next = new Date(now);

    switch (schedule.frequency) {
      case "DAILY":
        next.setDate(next.getDate() + 1);
        break;
      case "WEEKLY":
        const daysUntilNext = (schedule.dayOfWeek || 0) - now.getDay();
        next.setDate(
          next.getDate() +
            (daysUntilNext > 0 ? daysUntilNext : daysUntilNext + 7),
        );
        break;
      case "MONTHLY":
        next.setMonth(next.getMonth() + 1);
        next.setDate(schedule.dayOfMonth || 1);
        break;
    }

    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(":").map(Number);
      next.setHours(hours, minutes, 0, 0);
    }

    return next;
  }

  /**
   * Create custom report template
   */
  async createCustomTemplate(request: {
    name: string;
    description: string;
    reportType: ReportType;
    sections: ReportSection[];
    layout?: "PORTRAIT" | "LANDSCAPE";
    header?: ReportHeader;
    footer?: ReportFooter;
    styling?: ReportStyling;
    createdBy: string;
  }): Promise<CustomReportTemplate> {
    const template: CustomReportTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: request.name,
      description: request.description,
      reportType: request.reportType,
      sections: request.sections,
      layout: request.layout || "PORTRAIT",
      header: request.header,
      footer: request.footer,
      styling: request.styling,
      createdAt: new Date(),
      createdBy: request.createdBy,
    };

    this.templates.set(template.id, template);

    return template;
  }

  /**
   * Get export by ID
   */
  async getExport(
    tenantId: string,
    exportId: string,
  ): Promise<ExportResult | undefined> {
    if (process.env.NODE_ENV === "production") {
      const row = await prisma.transportationExportRecord.findUnique({
        where: { id: exportId },
      });
      if (!row) return undefined;
      if (row.tenantId !== tenantId) return undefined;
      return {
        id: row.id,
        reportType: row.reportType as any,
        format: row.format as any,
        fileName: row.fileName,
        fileSize: row.fileSize,
        downloadUrl: `/api/transportation/exports/${row.id}/download`,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
      };
    }
    return this.exports.get(exportId);
  }

  /**
   * Get export payload by ID
   */
  async getExportPayload(
    tenantId: string,
    exportId: string,
  ): Promise<
    { content: Buffer; mimeType: string; fileName: string } | undefined
  > {
    if (process.env.NODE_ENV === "production") {
      const row = await prisma.transportationExportRecord.findUnique({
        where: { id: exportId },
      });
      if (!row) return undefined;
      if (row.tenantId !== tenantId) return undefined;
      if (new Date() > row.expiresAt) return undefined;
      await this.ensureObjectStorage();
      const content = await objectStorageService.download(row.objectName);
      return { content, mimeType: row.mimeType, fileName: row.fileName };
    }
    return this.exportPayloads.get(exportId);
  }

  /**
   * Get scheduled report by ID
   */
  getScheduledReport(reportId: string): ScheduledReport | undefined {
    return this.scheduledReports.get(reportId);
  }

  /**
   * Get custom template by ID
   */
  getCustomTemplate(templateId: string): CustomReportTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * List all scheduled reports
   */
  listScheduledReports(): ScheduledReport[] {
    return Array.from(this.scheduledReports.values());
  }

  /**
   * List all custom templates
   */
  listCustomTemplates(): CustomReportTemplate[] {
    return Array.from(this.templates.values());
  }
}

export const exportReportingService = new ExportReportingService();
