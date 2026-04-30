/**
 * Proposal Generator Service
 *
 * Generates professional proposals, reports, and documents in multiple formats
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  Proposal,
  ProposalGenerationConfig,
  ProposalSection,
  ExportFormat,
  ExportResult,
  Quote,
  Shipment,
} from "@/types/proposals";
import type { Quote as TMSQuote } from "@/types/tms";

export class ProposalGenerator {
  /**
   * Generate proposal from configuration
   */
  async generateProposal(config: ProposalGenerationConfig): Promise<Proposal> {
    const proposal: Proposal = {
      id: `PROP-${Date.now()}`,
      proposalNumber: this.generateProposalNumber(config.proposalType),
      type: config.proposalType,
      title: this.generateTitle(config),
      description: this.generateDescription(config),
      executiveSummary: this.generateExecutiveSummary(config),
      sections: this.generateSections(config),
      status: "DRAFT",
      version: 1,
      recipients: config.recipients || [],
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      branding: config.branding || this.getDefaultBranding(),
    };

    // Add related entity IDs
    if (config.sourceData?.quote) {
      proposal.quoteId = config.sourceData.quote.id;
      proposal.totalAmount = config.sourceData.quote.charges.total;
      proposal.currency = config.sourceData.quote.currency;
      proposal.validUntil = config.sourceData.quote.validTo;
    }

    if (config.sourceData?.shipment) {
      proposal.shipmentId = config.sourceData.shipment.id;
    }

    return proposal;
  }

  /**
   * Export proposal to specified format
   */
  async exportProposal(
    proposal: Proposal,
    format: ExportFormat,
  ): Promise<ExportResult> {
    switch (format) {
      case "PDF":
        return this.exportToPDF(proposal);
      case "WORD":
        return this.exportToWord(proposal);
      case "EXCEL":
        return this.exportToExcel(proposal);
      case "HTML":
        return this.exportToHTML(proposal);
      case "CSV":
        return this.exportToCSV(proposal);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export to PDF using jsPDF
   */
  private async exportToPDF(proposal: Proposal): Promise<ExportResult> {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Header with branding
      yPosition = this.addPDFHeader(
        doc,
        proposal,
        pageWidth,
        margin,
        yPosition,
      );

      // Executive Summary
      if (proposal.executiveSummary) {
        yPosition = this.addPDFSection(
          doc,
          "Executive Summary",
          proposal.executiveSummary,
          margin,
          yPosition,
          contentWidth,
          pageHeight,
        );
      }

      // Sections
      for (const section of proposal.sections.filter((s) => s.visible)) {
        yPosition = this.addPDFSectionContent(
          doc,
          section,
          margin,
          yPosition,
          contentWidth,
          pageHeight,
        );
      }

      // Footer
      this.addPDFFooter(doc, proposal, pageWidth, pageHeight, margin);

      // Generate blob
      const pdfBlob = doc.output("blob");
      const fileName = `${proposal.proposalNumber}.pdf`;

      return {
        success: true,
        format: "PDF",
        fileName,
        fileSize: pdfBlob.size,
        generatedAt: new Date().toISOString(),
        fileUrl: URL.createObjectURL(pdfBlob),
      };
    } catch (error) {
      return {
        success: false,
        format: "PDF",
        fileName: `${proposal.proposalNumber}.pdf`,
        fileSize: 0,
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "PDF generation failed",
      };
    }
  }

  /**
   * Add PDF header with branding
   */
  private addPDFHeader(
    doc: jsPDF,
    proposal: Proposal,
    pageWidth: number,
    margin: number,
    yStart: number,
  ): number {
    const branding = proposal.branding || this.getDefaultBranding();
    let yPos = yStart;

    // Header background
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(0, 0, pageWidth, 50, "F");

    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(branding.companyName || "BlueDXP", margin, yPos + 15);

    // Document type
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("TRANSPORTATION PROPOSAL", pageWidth - margin, yPos + 10, {
      align: "right",
    });

    // Proposal number
    doc.setFontSize(10);
    doc.text(
      `Proposal #: ${proposal.proposalNumber}`,
      pageWidth - margin,
      yPos + 18,
      { align: "right" },
    );
    doc.text(
      `Date: ${new Date().toLocaleDateString()}`,
      pageWidth - margin,
      yPos + 24,
      { align: "right" },
    );

    return yPos + 60;
  }

  /**
   * Add PDF section
   */
  private addPDFSection(
    doc: jsPDF,
    title: string,
    content: string,
    margin: number,
    yStart: number,
    width: number,
    pageHeight: number,
  ): number {
    let yPos = yStart;

    // Check if new page needed
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    // Section title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPos);
    yPos += 8;

    // Section content
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
   * Add PDF section content (handles different section types)
   */
  private addPDFSectionContent(
    doc: jsPDF,
    section: ProposalSection,
    margin: number,
    yStart: number,
    width: number,
    pageHeight: number,
  ): number {
    let yPos = yStart;

    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    // Section title
    if (section.title) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(section.title, margin, yPos);
      yPos += 8;
    }

    // Handle different section types
    switch (section.type) {
      case "TEXT":
        if (section.content) {
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(section.content, width);
          for (const line of lines) {
            if (yPos > pageHeight - 20) {
              doc.addPage();
              yPos = margin;
            }
            doc.text(line, margin, yPos);
            yPos += 6;
          }
        }
        break;

      case "TABLE":
        if (section.data) {
          const tableData = this.formatTableData(section.data);
          autoTable(doc, {
            startY: yPos,
            head: tableData.headers,
            body: tableData.rows,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [59, 130, 246] },
          });
          yPos = (doc as any).lastAutoTable.finalY + 10;
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
          );
        }
        break;

      default:
        if (section.content) {
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(section.content, width);
          for (const line of lines) {
            if (yPos > pageHeight - 20) {
              doc.addPage();
              yPos = margin;
            }
            doc.text(line, margin, yPos);
            yPos += 6;
          }
        }
    }

    return yPos + 10;
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
  ): number {
    const headers = ["Item", "Description", "Quantity", "Unit Price", "Total"];
    const rows: any[][] = [];

    if (data.items) {
      for (const item of data.items) {
        rows.push([
          item.name || "",
          item.description || "",
          item.quantity || 1,
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

    autoTable(doc, {
      startY: yStart,
      head: [headers],
      body: rows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Add PDF footer
   */
  private addPDFFooter(
    doc: jsPDF,
    proposal: Proposal,
    pageWidth: number,
    pageHeight: number,
    margin: number,
  ): void {
    const branding = proposal.branding || this.getDefaultBranding();
    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);

      // Footer text
      if (branding.footerText) {
        doc.text(branding.footerText, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
      }

      // Page number
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" },
      );
    }
  }

  /**
   * Export to Word (HTML format)
   */
  private async exportToWord(proposal: Proposal): Promise<ExportResult> {
    const html = this.generateHTML(proposal);
    const blob = new Blob([html], { type: "application/msword" });
    const fileName = `${proposal.proposalNumber}.doc`;

    return {
      success: true,
      format: "WORD",
      fileName,
      fileSize: blob.size,
      generatedAt: new Date().toISOString(),
      fileUrl: URL.createObjectURL(blob),
    };
  }

  /**
   * Export to Excel
   */
  private async exportToExcel(proposal: Proposal): Promise<ExportResult> {
    // Convert proposal to CSV format
    const csv = this.generateCSV(proposal);
    const blob = new Blob([csv], { type: "text/csv" });
    const fileName = `${proposal.proposalNumber}.csv`;

    return {
      success: true,
      format: "EXCEL",
      fileName,
      fileSize: blob.size,
      generatedAt: new Date().toISOString(),
      fileUrl: URL.createObjectURL(blob),
    };
  }

  /**
   * Export to HTML
   */
  private async exportToHTML(proposal: Proposal): Promise<ExportResult> {
    const html = this.generateHTML(proposal);
    const blob = new Blob([html], { type: "text/html" });
    const fileName = `${proposal.proposalNumber}.html`;

    return {
      success: true,
      format: "HTML",
      fileName,
      fileSize: blob.size,
      generatedAt: new Date().toISOString(),
      fileUrl: URL.createObjectURL(blob),
    };
  }

  /**
   * Export to CSV
   */
  private async exportToCSV(proposal: Proposal): Promise<ExportResult> {
    const csv = this.generateCSV(proposal);
    const blob = new Blob([csv], { type: "text/csv" });
    const fileName = `${proposal.proposalNumber}.csv`;

    return {
      success: true,
      format: "CSV",
      fileName,
      fileSize: blob.size,
      generatedAt: new Date().toISOString(),
      fileUrl: URL.createObjectURL(blob),
    };
  }

  /**
   * Generate HTML content
   */
  private generateHTML(proposal: Proposal): string {
    const branding = proposal.branding || this.getDefaultBranding();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${proposal.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #3b82f6; color: white; padding: 30px; margin: -40px -40px 30px -40px; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
    .section-content { line-height: 1.6; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #3b82f6; color: white; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${branding.companyName || "BlueDXP"}</h1>
      <p>${proposal.title}</p>
      <p>Proposal #: ${proposal.proposalNumber} | Date: ${new Date().toLocaleDateString()}</p>
    </div>
    
    ${
      proposal.executiveSummary
        ? `
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="section-content">${proposal.executiveSummary}</div>
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
      <div class="section-content">
        ${section.content || ""}
        ${section.type === "TABLE" && section.data ? this.generateHTMLTable(section.data) : ""}
        ${section.type === "PRICING" && section.data ? this.generateHTMLPricing(section.data) : ""}
      </div>
    </div>
    `,
      )
      .join("")}
    
    <div class="footer">
      ${branding.footerText || "Confidential - For Internal Use Only"}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate CSV content
   */
  private generateCSV(proposal: Proposal): string {
    const rows: string[] = [];
    rows.push(`Proposal Number,${proposal.proposalNumber}`);
    rows.push(`Title,${proposal.title}`);
    rows.push(`Date,${new Date().toLocaleDateString()}`);
    rows.push("");

    if (proposal.executiveSummary) {
      rows.push("Executive Summary");
      rows.push(proposal.executiveSummary);
      rows.push("");
    }

    for (const section of proposal.sections.filter((s) => s.visible)) {
      if (section.title) {
        rows.push(section.title);
      }
      if (section.content) {
        rows.push(section.content);
      }
      rows.push("");
    }

    return rows.join("\n");
  }

  /**
   * Generate HTML table
   */
  private generateHTMLTable(data: any): string {
    if (!data.headers || !data.rows) return "";

    return `
      <table>
        <thead>
          <tr>
            ${data.headers.map((h: string) => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data.rows
            .map(
              (row: any[]) => `
            <tr>
              ${row.map((cell) => `<td>${cell}</td>`).join("")}
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  /**
   * Generate HTML pricing table
   */
  private generateHTMLPricing(data: any): string {
    if (!data.items) return "";

    return `
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (item: any) => `
            <tr>
              <td>${item.name || ""}</td>
              <td>${item.description || ""}</td>
              <td>${item.quantity || 1}</td>
              <td>${item.unitPrice || 0} ${data.currency || "SAR"}</td>
              <td>${(item.quantity || 1) * (item.unitPrice || 0)} ${data.currency || "SAR"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="text-align: right; font-weight: bold;">TOTAL</td>
            <td style="font-weight: bold;">${data.total || 0} ${data.currency || "SAR"}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  /**
   * Format table data for PDF
   */
  private formatTableData(data: any): { headers: string[]; rows: any[][] } {
    if (data.headers && data.rows) {
      return { headers: data.headers, rows: data.rows };
    }
    return { headers: [], rows: [] };
  }

  /**
   * Generate proposal number
   */
  private generateProposalNumber(type: ProposalType): string {
    const prefix =
      type === "QUOTE_PROPOSAL"
        ? "QTP"
        : type === "SHIPMENT_REPORT"
          ? "SHR"
          : type === "ANALYTICS_REPORT"
            ? "ANR"
            : type === "CUSTOMS_REPORT"
              ? "CUR"
              : type === "CARRIER_PROPOSAL"
                ? "CRP"
                : type === "COST_ANALYSIS"
                  ? "COS"
                  : type === "PERFORMANCE_REPORT"
                    ? "PER"
                    : "PRO";

    return `${prefix}-${Date.now()}`;
  }

  /**
   * Generate title
   */
  private generateTitle(config: ProposalGenerationConfig): string {
    if (config.sourceData?.quote) {
      return `Transportation Quote Proposal - ${config.sourceData.quote.quoteNumber}`;
    }
    if (config.sourceData?.shipment) {
      return `Shipment Report - ${config.sourceData.shipment.id}`;
    }
    return `Transportation Proposal - ${new Date().toLocaleDateString()}`;
  }

  /**
   * Generate description
   */
  private generateDescription(config: ProposalGenerationConfig): string {
    if (config.sourceData?.quote) {
      return `Professional proposal for transportation services from ${config.sourceData.quote.origin.name} to ${config.sourceData.quote.destination.name}`;
    }
    return "Transportation and logistics proposal";
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(config: ProposalGenerationConfig): string {
    if (config.sourceData?.quote) {
      const quote = config.sourceData.quote;
      return `This proposal outlines comprehensive transportation services for your shipment from ${quote.origin.name} to ${quote.destination.name}. The total cost is ${quote.charges.total} ${quote.currency}, valid until ${new Date(quote.validTo).toLocaleDateString()}.`;
    }
    return "This proposal provides detailed information about transportation services and logistics solutions.";
  }

  /**
   * Generate sections
   */
  private generateSections(
    config: ProposalGenerationConfig,
  ): ProposalSection[] {
    const sections: ProposalSection[] = [];

    if (config.sourceData?.quote) {
      sections.push(...this.generateQuoteSections(config.sourceData.quote));
    }

    if (config.customSections) {
      sections.push(...config.customSections);
    }

    return sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Generate quote sections
   */
  private generateQuoteSections(quote: TMSQuote): ProposalSection[] {
    return [
      {
        id: "route",
        type: "TEXT",
        title: "Route Information",
        content: `Origin: ${quote.origin.name}\nDestination: ${quote.destination.name}\nMode: ${quote.mode}\nType: ${quote.type}`,
        order: 1,
        visible: true,
      },
      {
        id: "cargo",
        type: "TEXT",
        title: "Cargo Details",
        content: `Weight: ${quote.weight} kg\nVolume: ${quote.volume} m³\nValue: ${quote.value} ${quote.currency}`,
        order: 2,
        visible: true,
      },
      {
        id: "pricing",
        type: "PRICING",
        title: "Pricing Breakdown",
        data: {
          items: [
            {
              name: "Freight Charges",
              description: "Base transportation cost",
              quantity: 1,
              unitPrice: quote.charges.baseRate,
            },
            {
              name: "Fuel Surcharge",
              description: "Fuel surcharge",
              quantity: 1,
              unitPrice: quote.charges.fuelSurcharge || 0,
            },
            {
              name: "Customs Duties",
              description: "Customs and duties",
              quantity: 1,
              unitPrice: quote.charges.customsDuties || 0,
            },
          ],
          total: quote.charges.total,
          currency: quote.currency,
        },
        order: 3,
        visible: true,
      },
      {
        id: "terms",
        type: "TEXT",
        title: "Terms & Conditions",
        content: `Valid From: ${new Date(quote.validFrom).toLocaleDateString()}\nValid To: ${new Date(quote.validTo).toLocaleDateString()}\n\nTerms: This quote is valid for 7 days from the date of issue. All prices are in ${quote.currency}.`,
        order: 4,
        visible: true,
      },
    ];
  }

  /**
   * Get default branding
   */
  private getDefaultBranding(): ProposalBranding {
    return {
      companyName: "BlueDXP",
      primaryColor: "#3b82f6",
      secondaryColor: "#10b981",
      footerText: "Confidential - For Internal Use Only",
    };
  }
}
