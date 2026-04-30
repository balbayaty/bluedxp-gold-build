/**
 * ETW PDF Service
 *
 * Generates print-ready A4 PDFs for ETWs
 * Follows existing PDF generation patterns
 */

import jsPDF from "jspdf";
import type { ETW } from "@/types/etw";

export interface ETWPDFService {
  generatePDF(
    etw: ETW,
    options?: {
      includeQR?: boolean;
      includeSignature?: boolean;
      language?: "en" | "ar";
    },
  ): Promise<Buffer>;
}

class ETWPDFServiceImpl implements ETWPDFService {
  async generatePDF(
    etw: ETW,
    options?: {
      includeQR?: boolean;
      includeSignature?: boolean;
      language?: "en" | "ar";
    },
  ): Promise<Buffer> {
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

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("e-Waybill (ETW)", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`ETW Number: ${etw.etwNumber}`, margin, yPosition);
    yPosition += 8;

    // Transport Reference Matrix
    yPosition = this.addSection(
      doc,
      "Transport Reference Matrix",
      {
        "ETW Number": etw.etwNumber,
        "Shipment Number": etw.references.shipmentNumber || "N/A",
        "Customer Reference": etw.references.customerReference || "N/A",
      },
      margin,
      yPosition,
      contentWidth,
      pageHeight,
    );

    // Scope & Mode
    yPosition = this.addSection(
      doc,
      "Transport Scope & Mode",
      {
        Scope: etw.scope,
        Mode: etw.mode,
        Multimodal: etw.isMultimodal ? "Yes" : "No",
      },
      margin,
      yPosition,
      contentWidth,
      pageHeight,
    );

    // Parties
    yPosition = this.addSection(
      doc,
      "Parties & Legal Roles",
      etw.parties.reduce(
        (acc, party) => {
          acc[party.type] = party.name;
          return acc;
        },
        {} as Record<string, string>,
      ),
      margin,
      yPosition,
      contentWidth,
      pageHeight,
    );

    // Cargo
    yPosition = this.addSection(
      doc,
      "Cargo Declaration",
      {
        "Total Weight": `${etw.cargo.totalWeight} kg`,
        "Total Value": `${etw.cargo.totalValue} ${etw.cargo.currency}`,
        "Total Pieces": etw.cargo.totalPieces.toString(),
        Items: etw.cargo.items.length.toString(),
      },
      margin,
      yPosition,
      contentWidth,
      pageHeight,
    );

    // Route
    yPosition = this.addSection(
      doc,
      "Route & Execution",
      {
        Origin: etw.route.origin.name,
        Destination: etw.route.destination.name,
      },
      margin,
      yPosition,
      contentWidth,
      pageHeight,
    );

    // Events Timeline
    if (etw.events.length > 0) {
      yPosition = this.addSection(
        doc,
        "Event Timeline",
        etw.events.reduce(
          (acc, event, index) => {
            acc[`Event ${index + 1}`] =
              `${event.type} - ${new Date(event.timestamp).toLocaleString()}`;
            return acc;
          },
          {} as Record<string, string>,
        ),
        margin,
        yPosition,
        contentWidth,
        pageHeight,
      );
    }

    // Verification (if included)
    if (options?.includeQR && etw.verification) {
      yPosition = this.addSection(
        doc,
        "Digital Verification",
        {
          Hash: etw.verification.hash.substring(0, 32) + "...",
          "Verification URL": etw.verification.verificationUrl,
        },
        margin,
        yPosition,
        contentWidth,
        pageHeight,
      );
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 10,
    );

    // Convert to buffer
    const pdfBlob = doc.output("arraybuffer");
    return Buffer.from(pdfBlob);
  }

  private addSection(
    doc: jsPDF,
    title: string,
    data: Record<string, string>,
    margin: number,
    yStart: number,
    contentWidth: number,
    pageHeight: number,
  ): number {
    let yPosition = yStart;

    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Section title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin, yPosition);
    yPosition += 8;

    // Section data
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    for (const [key, value] of Object.entries(data)) {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(`${key}: ${value}`, margin + 5, yPosition);
      yPosition += 6;
    }

    return yPosition + 5;
  }
}

export const etwPDFService: ETWPDFService = new ETWPDFServiceImpl();
