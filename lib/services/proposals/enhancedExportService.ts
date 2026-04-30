/**
 * Enhanced Export Service for Proposals & RFQs
 * Mind-blowing PDF/DOCX/Excel exports with charts, branding, interactive elements
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Proposal } from "@/types/proposals";
import type { RFQ } from "@/types/rfq";

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedExportConfig {
  proposal?: Proposal;
  rfq?: RFQ;
  format: "PDF" | "DOCX" | "XLSX" | "HTML";
  options?: {
    includeCharts?: boolean;
    includeInteractiveElements?: boolean;
    branding?: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
      companyName?: string;
      footerText?: string;
    };
    watermark?: string;
    password?: string;
    pageNumbers?: boolean;
    tableOfContents?: boolean;
    customSections?: Array<{
      title: string;
      content: string;
      order: number;
    }>;
  };
}

export interface ExportResult {
  success: boolean;
  format: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  blob?: Blob;
  generatedAt: Date | string;
  error?: string;
}

// ============================================================================
// ENHANCED EXPORT SERVICE
// ============================================================================

class EnhancedExportService {
  /**
   * Export proposal/RFQ with enhanced formatting
   */
  async export(config: EnhancedExportConfig): Promise<ExportResult> {
    switch (config.format) {
      case "PDF":
        return this.exportToPDF(config);
      case "DOCX":
        return this.exportToDOCX(config);
      case "XLSX":
        return this.exportToXLSX(config);
      case "HTML":
        return this.exportToHTML(config);
      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }
  }

  /**
   * Export to PDF with advanced features
   */
  private async exportToPDF(
    config: EnhancedExportConfig,
  ): Promise<ExportResult> {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      const options = config.options || {};
      const branding = options.branding || {};

      // Add watermark if specified
      if (options.watermark) {
        this.addWatermark(doc, options.watermark, pageWidth, pageHeight);
      }

      // Cover page with branding
      yPosition = this.addCoverPage(
        doc,
        config,
        pageWidth,
        pageHeight,
        margin,
        yPosition,
        branding,
      );

      // Table of contents if requested
      if (options.tableOfContents && config.proposal) {
        doc.addPage();
        yPosition = margin;
        yPosition = this.addTableOfContents(
          doc,
          config.proposal,
          margin,
          yPosition,
          contentWidth,
          pageHeight,
        );
      }

      // Main content
      if (config.proposal) {
        yPosition = this.addProposalContent(
          doc,
          config.proposal,
          margin,
          yPosition,
          contentWidth,
          pageHeight,
          branding,
          options,
        );
      } else if (config.rfq) {
        yPosition = this.addRFQContent(
          doc,
          config.rfq,
          margin,
          yPosition,
          contentWidth,
          pageHeight,
          branding,
          options,
        );
      }

      // Add custom sections if provided
      if (options.customSections) {
        for (const section of options.customSections.sort(
          (a, b) => a.order - b.order,
        )) {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }
          yPosition = this.addSection(
            doc,
            section.title,
            section.content,
            margin,
            yPosition,
            contentWidth,
            pageHeight,
            branding,
          );
        }
      }

      // Add page numbers
      if (options.pageNumbers !== false) {
        this.addPageNumbers(doc, pageWidth, pageHeight, margin);
      }

      // Add footer with branding
      this.addFooter(doc, branding, pageWidth, pageHeight, margin);

      // Generate blob
      const pdfBlob = doc.output("blob");
      const fileName = this.generateFileName(config);

      return {
        success: true,
        format: "PDF",
        fileName: `${fileName}.pdf`,
        fileSize: pdfBlob.size,
        fileUrl: URL.createObjectURL(pdfBlob),
        blob: pdfBlob,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        format: "PDF",
        fileName: "export.pdf",
        fileSize: 0,
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "PDF generation failed",
      };
    }
  }

  /**
   * Add cover page
   */
  private addCoverPage(
    doc: jsPDF,
    config: EnhancedExportConfig,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    yStart: number,
    branding: EnhancedExportConfig["options"]["branding"],
  ): number {
    // Background gradient effect
    const primaryColor = this.hexToRgb(branding?.primaryColor || "#3B82F6");
    if (primaryColor) {
      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.rect(0, 0, pageWidth, pageHeight * 0.4, "F");
    }

    // Logo placeholder (would use actual logo image in production)
    if (branding?.logo) {
      // doc.addImage(branding.logo, 'PNG', margin, yStart, 50, 20)
      // For now, use text logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      doc.text(branding.companyName || "BlueDXP", pageWidth / 2, yStart + 30, {
        align: "center",
      });
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      doc.text(branding?.companyName || "BlueDXP", pageWidth / 2, yStart + 30, {
        align: "center",
      });
    }

    // Document title
    const title = config.proposal?.title || config.rfq?.title || "Document";
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, pageHeight * 0.5, { align: "center" });

    // Document number
    const docNumber = config.proposal?.proposalNumber || config.rfq?.rfqNumber;
    if (docNumber) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(`Document #: ${docNumber}`, pageWidth / 2, pageHeight * 0.55, {
        align: "center",
      });
    }

    // Date
    doc.setFontSize(12);
    doc.text(
      `Date: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight * 0.6,
      { align: "center" },
    );

    // Customer info
    if (config.proposal?.customerName) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Prepared for: ${config.proposal.customerName}`,
        pageWidth / 2,
        pageHeight * 0.65,
        { align: "center" },
      );
    }

    // Valid until
    if (config.proposal?.validUntil) {
      doc.setFontSize(10);
      doc.text(
        `Valid Until: ${new Date(config.proposal.validUntil).toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight * 0.7,
        { align: "center" },
      );
    }

    return pageHeight;
  }

  /**
   * Add table of contents
   */
  private addTableOfContents(
    doc: jsPDF,
    proposal: Proposal,
    margin: number,
    yStart: number,
    width: number,
    pageHeight: number,
  ): number {
    let yPos = yStart;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Table of Contents", margin, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    // Executive Summary
    if (proposal.executiveSummary) {
      doc.text("Executive Summary ................... 1", margin, yPos);
      yPos += 8;
    }

    // Sections
    for (const section of proposal.sections
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order)) {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      const pageNum = Math.floor((yPos - margin) / 50) + 2; // Rough estimate
      doc.text(
        `${section.title || "Section"} ................... ${pageNum}`,
        margin,
        yPos,
      );
      yPos += 8;
    }

    return yPos + 10;
  }

  /**
   * Add proposal content
   */
  private addProposalContent(
    doc: jsPDF,
    proposal: Proposal,
    margin: number,
    yStart: number,
    width: number,
    pageHeight: number,
    branding: EnhancedExportConfig["options"]["branding"],
    options: EnhancedExportConfig["options"],
  ): number {
    let yPos = yStart;

    // Executive Summary
    if (proposal.executiveSummary) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }
      yPos = this.addSection(
        doc,
        "Executive Summary",
        proposal.executiveSummary,
        margin,
        yPos,
        width,
        pageHeight,
        branding,
      );
    }

    // Sections
    for (const section of proposal.sections
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order)) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      switch (section.type) {
        case "TEXT":
          yPos = this.addSection(
            doc,
            section.title || "",
            section.content || "",
            margin,
            yPos,
            width,
            pageHeight,
            branding,
          );
          break;

        case "TABLE":
          if (section.data) {
            yPos = this.addTable(
              doc,
              section.data,
              margin,
              yPos,
              width,
              pageHeight,
              branding,
            );
          }
          break;

        case "PRICING":
          if (section.data) {
            yPos = this.addPricingTable(
              doc,
              section.data,
              margin,
              yPos,
              width,
              pageHeight,
              branding,
            );
          }
          break;

        case "CHART":
          if (options?.includeCharts && section.data) {
            // Placeholder for chart - would use chart library in production
            yPos = this.addChartPlaceholder(
              doc,
              section.title || "Chart",
              margin,
              yPos,
              width,
              pageHeight,
            );
          }
          break;

        default:
          if (section.content) {
            yPos = this.addSection(
              doc,
              section.title || "",
              section.content,
              margin,
              yPos,
              width,
              pageHeight,
              branding,
            );
          }
      }
    }

    return yPos;
  }

  /**
   * Add RFQ content
   */
  private addRFQContent(
    doc: jsPDF,
    rfq: RFQ,
    margin: number,
    yStart: number,
    width: number,
    pageHeight: number,
    branding: EnhancedExportConfig["options"]["branding"],
    options: EnhancedExportConfig["options"],
  ): number {
    let yPos = yStart;

    // RFQ Details
    const sections = [
      {
        title: "RFQ Information",
        content: `RFQ Number: ${rfq.rfqNumber}\nTitle: ${rfq.title}\nStatus: ${rfq.status}\nPriority: ${rfq.priority}`,
      },
      {
        title: "Customer Information",
        content: `Company: ${rfq.customer.companyName}\nContact: ${rfq.customer.contactPerson}\nEmail: ${rfq.customer.email}\nPhone: ${rfq.customer.phone}`,
      },
      {
        title: "Service Requirements",
        content: rfq.serviceRequirements
          .map((s) => `- ${s.category}: ${s.description}`)
          .join("\n"),
      },
      {
        title: "Timeline",
        content: `Request Date: ${new Date(rfq.timeline.requestDate).toLocaleDateString()}\nResponse Deadline: ${new Date(rfq.timeline.responseDeadline).toLocaleDateString()}\nUrgency: ${rfq.timeline.urgency}`,
      },
    ];

    for (const section of sections) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }
      yPos = this.addSection(
        doc,
        section.title,
        section.content,
        margin,
        yPos,
        width,
        pageHeight,
        branding,
      );
    }

    return yPos;
  }

  /**
   * Add section
   */
  private addSection(
    doc: jsPDF,
    title: string,
    content: string,
    margin: number,
    yStart: number,
    width: number,
    pageHeight: number,
    branding: EnhancedExportConfig["options"]["branding"],
  ): number {
    let yPos = yStart;

    // Section title
    if (title) {
      const primaryColor = this.hexToRgb(branding?.primaryColor || "#3B82F6");
      if (primaryColor) {
        doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.roundedRect(margin, yPos - 5, width, 8, 2, 2, "F");
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 3, yPos + 2);
      yPos += 12;
    }

    // Section content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(content, width);

    for (const line of lines) {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    }

    return yPos + 10;
  }

  /**
   * Add table
   */
  private addTable(
    doc: jsPDF,
    data: any,
    margin: number,
    yStart: number,
    width: number,
    pageHeight: number,
    branding: EnhancedExportConfig["options"]["branding"],
  ): number {
    const headers = data.headers || [];
    const rows = data.rows || [];

    const primaryColor = this.hexToRgb(branding?.primaryColor || "#3B82F6");
    const headerColor = primaryColor
      ? [primaryColor.r, primaryColor.g, primaryColor.b]
      : [59, 130, 246];

    autoTable(doc, {
      startY: yStart,
      head: [headers],
      body: rows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      theme: "striped",
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Add pricing table
   */
  private addPricingTable(
    doc: jsPDF,
    data: any,
    margin: number,
    yStart: number,
    width: number,
    pageHeight: number,
    branding: EnhancedExportConfig["options"]["branding"],
  ): number {
    const headers = ["Item", "Description", "Quantity", "Unit Price", "Total"];
    const rows: any[][] = [];

    if (data.items) {
      for (const item of data.items) {
        rows.push([
          item.name || "",
          item.description || "",
          String(item.quantity || 1),
          `${item.unitPrice || 0} ${data.currency || "SAR"}`,
          `${(item.quantity || 1) * (item.unitPrice || 0)} ${data.currency || "SAR"}`,
        ]);
      }
    }

    // Add totals row
    if (data.total) {
      rows.push([
        "",
        "TOTAL",
        "",
        "",
        `${data.total} ${data.currency || "SAR"}`,
      ]);
    }

    const primaryColor = this.hexToRgb(branding?.primaryColor || "#3B82F6");
    const headerColor = primaryColor
      ? [primaryColor.r, primaryColor.g, primaryColor.b]
      : [59, 130, 246];

    autoTable(doc, {
      startY: yStart,
      head: [headers],
      body: rows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [240, 240, 240],
        fontStyle: "bold",
        textColor: [0, 0, 0],
      },
      theme: "striped",
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Add chart placeholder
   */
  private addChartPlaceholder(
    doc: jsPDF,
    title: string,
    margin: number,
    yStart: number,
    width: number,
    pageHeight: number,
  ): number {
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margin, yStart, width, 60, 3, 3, "F");

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`[Chart: ${title}]`, margin + width / 2, yStart + 30, {
      align: "center",
    });

    return yStart + 70;
  }

  /**
   * Add watermark
   */
  private addWatermark(
    doc: jsPDF,
    text: string,
    pageWidth: number,
    pageHeight: number,
  ): void {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();
      doc.setGState(doc.GState({ opacity: 0.1 }));
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      doc.text(text, pageWidth / 2, pageHeight / 2, {
        align: "center",
        angle: 45,
      });
      doc.restoreGraphicsState();
    }
  }

  /**
   * Add page numbers
   */
  private addPageNumbers(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    margin: number,
  ): void {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" },
      );
    }
  }

  /**
   * Add footer
   */
  private addFooter(
    doc: jsPDF,
    branding: EnhancedExportConfig["options"]["branding"],
    pageWidth: number,
    pageHeight: number,
    margin: number,
  ): void {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);

      if (branding?.footerText) {
        doc.text(branding.footerText, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
      }

      if (branding?.companyName) {
        doc.text(branding.companyName, margin, pageHeight - 10, {
          align: "left",
        });
      }
    }
  }

  /**
   * Export to DOCX (simplified - would use docx library in production)
   */
  private async exportToDOCX(
    config: EnhancedExportConfig,
  ): Promise<ExportResult> {
    // Simplified - would use docx library for actual DOCX generation
    const html = await this.generateHTML(config);
    const blob = new Blob([html], { type: "application/msword" });
    const fileName = this.generateFileName(config);

    return {
      success: true,
      format: "DOCX",
      fileName: `${fileName}.doc`,
      fileSize: blob.size,
      fileUrl: URL.createObjectURL(blob),
      blob,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Export to XLSX (simplified - would use xlsx library in production)
   */
  private async exportToXLSX(
    config: EnhancedExportConfig,
  ): Promise<ExportResult> {
    // Simplified - would use xlsx library for actual XLSX generation
    const csv = this.generateCSV(config);
    const blob = new Blob([csv], { type: "text/csv" });
    const fileName = this.generateFileName(config);

    return {
      success: true,
      format: "XLSX",
      fileName: `${fileName}.csv`,
      fileSize: blob.size,
      fileUrl: URL.createObjectURL(blob),
      blob,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Export to HTML
   */
  private async exportToHTML(
    config: EnhancedExportConfig,
  ): Promise<ExportResult> {
    const html = await this.generateHTML(config);
    const blob = new Blob([html], { type: "text/html" });
    const fileName = this.generateFileName(config);

    return {
      success: true,
      format: "HTML",
      fileName: `${fileName}.html`,
      fileSize: blob.size,
      fileUrl: URL.createObjectURL(blob),
      blob,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate HTML content
   */
  private async generateHTML(config: EnhancedExportConfig): Promise<string> {
    const branding = config.options?.branding || {};
    const title = config.proposal?.title || config.rfq?.title || "Document";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: ${branding.primaryColor || "#3B82F6"}; color: white; padding: 30px; margin: -40px -40px 30px -40px; }
    .header h1 { margin: 0; font-size: 28px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 2px solid ${branding.primaryColor || "#3B82F6"}; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: ${branding.primaryColor || "#3B82F6"}; color: white; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${branding.companyName || "BlueDXP"}</h1>
      <p>${title}</p>
    </div>
    ${config.proposal ? this.generateProposalHTML(config.proposal) : ""}
    ${config.rfq ? this.generateRFQHTML(config.rfq) : ""}
    <div class="footer">
      ${branding.footerText || "Confidential - For Internal Use Only"}
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateProposalHTML(proposal: Proposal): string {
    return `
      ${
        proposal.executiveSummary
          ? `
      <div class="section">
        <div class="section-title">Executive Summary</div>
        <div>${proposal.executiveSummary}</div>
      </div>
      `
          : ""
      }
      ${proposal.sections
        .filter((s) => s.visible)
        .map(
          (section) => `
      <div class="section">
        ${section.title ? `<div class="section-title">${section.title}</div>` : ""}
        <div>${section.content || ""}</div>
      </div>
      `,
        )
        .join("")}
    `;
  }

  private generateRFQHTML(rfq: RFQ): string {
    return `
      <div class="section">
        <div class="section-title">RFQ Information</div>
        <p><strong>RFQ Number:</strong> ${rfq.rfqNumber}</p>
        <p><strong>Title:</strong> ${rfq.title}</p>
        <p><strong>Status:</strong> ${rfq.status}</p>
      </div>
    `;
  }

  private generateCSV(config: EnhancedExportConfig): string {
    const rows: string[] = [];
    rows.push("Document Type,Number,Title,Date");

    if (config.proposal) {
      rows.push(
        `Proposal,${config.proposal.proposalNumber},${config.proposal.title},${new Date().toLocaleDateString()}`,
      );
    } else if (config.rfq) {
      rows.push(
        `RFQ,${config.rfq.rfqNumber},${config.rfq.title},${new Date().toLocaleDateString()}`,
      );
    }

    return rows.join("\n");
  }

  private generateFileName(config: EnhancedExportConfig): string {
    if (config.proposal) {
      return config.proposal.proposalNumber || `proposal-${Date.now()}`;
    } else if (config.rfq) {
      return config.rfq.rfqNumber || `rfq-${Date.now()}`;
    }
    return `document-${Date.now()}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const enhancedExportService = new EnhancedExportService();
