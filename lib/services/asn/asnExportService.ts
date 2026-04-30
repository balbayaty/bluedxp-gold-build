/**
 * ASN Export Service
 * Integrates ASN data with export service
 * Provides Excel, PDF, CSV exports for ASN data
 */

import { exportService } from "@/lib/services/export/exportService";
import { asnService } from "./asnService";
import type { ASNData } from "@/types/asn";

class ASNExportService {
  /**
   * Export ASNs to Excel
   */
  async exportToExcel(filters?: {
    status?: string;
    processType?: "INBOUND" | "OUTBOUND";
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ filename: string; blob: Blob; url?: string }> {
    const asns = await asnService.getAllASNs(filters);

    const columns = [
      {
        key: "documentNumber",
        label: "Document Number",
        type: "string" as const,
      },
      { key: "vendorName", label: "Vendor Name", type: "string" as const },
      { key: "vendorNumber", label: "Vendor Number", type: "string" as const },
      { key: "status", label: "Status", type: "string" as const },
      { key: "priority", label: "Priority", type: "string" as const },
      {
        key: "expectedDeliveryDate",
        label: "Expected Delivery",
        type: "date" as const,
        format: "yyyy-MM-dd HH:mm",
      },
      {
        key: "actualDeliveryDate",
        label: "Actual Delivery",
        type: "date" as const,
        format: "yyyy-MM-dd HH:mm",
      },
      { key: "destination", label: "Destination", type: "string" as const },
      { key: "totalItems", label: "Total Items", type: "number" as const },
      {
        key: "totalWeight",
        label: "Total Weight (kg)",
        type: "number" as const,
      },
      {
        key: "complianceStatus",
        label: "Compliance Status",
        type: "string" as const,
      },
      {
        key: "slaComplianceStatus",
        label: "SLA Compliance",
        type: "string" as const,
      },
    ];

    const result = await exportService.export({
      format: "xlsx",
      filename: `ASN_Export_${new Date().toISOString().split("T")[0]}.xlsx`,
      title: "ASN Export",
      description: `Exported ${asns.length} ASN records`,
      data: asns,
      columns,
      includeHeaders: true,
      includeTimestamp: true,
      includeMetadata: true,
      sheetName: "ASN Data",
    });

    return {
      filename: result.filename,
      blob: result.blob!,
      url: result.url,
    };
  }

  /**
   * Export ASNs to PDF
   */
  async exportToPDF(filters?: {
    status?: string;
    processType?: "INBOUND" | "OUTBOUND";
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ filename: string; blob: Blob; url?: string }> {
    const asns = await asnService.getAllASNs(filters);

    const columns = [
      {
        key: "documentNumber",
        label: "Document Number",
        type: "string" as const,
      },
      { key: "vendorName", label: "Vendor Name", type: "string" as const },
      { key: "status", label: "Status", type: "string" as const },
      {
        key: "expectedDeliveryDate",
        label: "Expected Delivery",
        type: "date" as const,
        format: "yyyy-MM-dd HH:mm",
      },
      { key: "destination", label: "Destination", type: "string" as const },
      { key: "totalItems", label: "Total Items", type: "number" as const },
    ];

    const result = await exportService.export({
      format: "pdf",
      filename: `ASN_Export_${new Date().toISOString().split("T")[0]}.pdf`,
      title: "ASN Export Report",
      description: `Exported ${asns.length} ASN records`,
      data: asns,
      columns,
      includeHeaders: true,
      includeTimestamp: true,
      includeMetadata: true,
      orientation: "landscape",
      pageSize: "a4",
    });

    return {
      filename: result.filename,
      blob: result.blob!,
      url: result.url,
    };
  }

  /**
   * Export ASNs to CSV
   */
  async exportToCSV(filters?: {
    status?: string;
    processType?: "INBOUND" | "OUTBOUND";
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ filename: string; blob: Blob; url?: string }> {
    const asns = await asnService.getAllASNs(filters);

    const columns = [
      {
        key: "documentNumber",
        label: "Document Number",
        type: "string" as const,
      },
      { key: "vendorName", label: "Vendor Name", type: "string" as const },
      { key: "vendorNumber", label: "Vendor Number", type: "string" as const },
      { key: "status", label: "Status", type: "string" as const },
      {
        key: "expectedDeliveryDate",
        label: "Expected Delivery",
        type: "date" as const,
        format: "yyyy-MM-dd HH:mm",
      },
      { key: "destination", label: "Destination", type: "string" as const },
    ];

    const result = await exportService.export({
      format: "csv",
      filename: `ASN_Export_${new Date().toISOString().split("T")[0]}.csv`,
      title: "ASN Export",
      data: asns,
      columns,
      includeHeaders: true,
      includeTimestamp: true,
    });

    return {
      filename: result.filename,
      blob: result.blob!,
      url: result.url,
    };
  }

  /**
   * Export single ASN detail to PDF
   */
  async exportASNDetailToPDF(
    asnId: string,
  ): Promise<{ filename: string; blob: Blob; url?: string }> {
    const asn = await asnService.getASNById(asnId);
    if (!asn) {
      throw new Error(`ASN ${asnId} not found`);
    }

    const result = await exportService.export({
      format: "pdf",
      filename: `ASN_${asn.documentNumber}_${new Date().toISOString().split("T")[0]}.pdf`,
      title: `ASN Detail: ${asn.documentNumber}`,
      description: `Detailed information for ASN ${asn.documentNumber}`,
      data: asn,
      includeHeaders: false,
      includeTimestamp: true,
      includeMetadata: true,
      orientation: "portrait",
      pageSize: "a4",
    });

    return {
      filename: result.filename,
      blob: result.blob!,
      url: result.url,
    };
  }
}

export const asnExportService = new ASNExportService();
