/**
 * Automated Freight Auditing Service
 *
 * AI-powered freight invoice validation, billing anomaly detection,
 * and automated document processing
 * Integrates with existing AI/ML services
 */

import type { Shipment, FreightCharges } from "@/types/tms";
import { callAI } from "@/utils/aiClient";
import { mlModelRegistry } from "@/lib/services/ml-registry";
import { eventBus } from "@/lib/services/event-store";
import { assertRealInProduction } from "./strictMode";

export interface FreightInvoice {
  id: string;
  invoiceNumber: string;
  carrierId: string;
  carrierName: string;
  shipmentId: string;
  invoiceDate: Date | string;
  dueDate: Date | string;

  // Line items
  lineItems: {
    description: string;
    quantity?: number;
    rate: number;
    amount: number;
    type: "BASE_RATE" | "FUEL_SURCHARGE" | "ACCESSORIAL" | "TAX" | "OTHER";
  }[];

  // Totals
  subtotal: number;
  taxes: number;
  total: number;
  currency: string;

  // Document
  documentUrl?: string;
  ocrData?: any; // OCR extracted data

  // Status
  status: "PENDING" | "AUDITED" | "APPROVED" | "REJECTED" | "PAID";
  auditResult?: FreightAuditResult;
}

export interface FreightAuditResult {
  invoiceId: string;
  valid: boolean;
  confidence: number; // 0-100
  issues: AuditIssue[];
  savings?: number;
  recommendations: string[];
  auditDate: Date | string;
  auditedBy: "SYSTEM" | string;
}

export interface AuditIssue {
  type:
    | "RATE_MISMATCH"
    | "DUPLICATE"
    | "ANOMALY"
    | "MISSING_DOCUMENT"
    | "CALCULATION_ERROR"
    | "CONTRACT_VIOLATION";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  expectedValue?: number;
  actualValue?: number;
  difference?: number;
  evidence?: string[];
}

export interface BillingAnomaly {
  id: string;
  invoiceId: string;
  type:
    | "PRICE_SPIKE"
    | "UNUSUAL_PATTERN"
    | "DUPLICATE_CHARGE"
    | "MISSING_CHARGE"
    | "RATE_DEVIATION";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  detectedAt: Date | string;
  confidence: number;
  historicalComparison?: {
    average: number;
    median: number;
    deviation: number;
  };
}

export class FreightAuditService {
  private invoices: Map<string, FreightInvoice> = new Map();
  private anomalies: Map<string, BillingAnomaly[]> = new Map();
  private contractRates: Map<string, Map<string, number>> = new Map(); // carrierId -> serviceType -> rate

  /**
   * Process and audit freight invoice
   */
  async auditInvoice(invoice: FreightInvoice): Promise<FreightAuditResult> {
    // 1. OCR processing if document available
    if (invoice.documentUrl && !invoice.ocrData) {
      invoice.ocrData = await this.processInvoiceOCR(invoice.documentUrl);
    }

    // 2. Validate against contract rates
    const contractValidation = await this.validateAgainstContract(invoice);

    // 3. Check for duplicates
    const duplicateCheck = await this.checkDuplicates(invoice);

    // 4. Detect anomalies
    const anomalies = await this.detectAnomalies(invoice);

    // 5. Validate calculations
    const calculationValidation = await this.validateCalculations(invoice);

    // 6. Combine all issues
    const allIssues: AuditIssue[] = [
      ...contractValidation.issues,
      ...duplicateCheck.issues,
      ...anomalies.issues,
      ...calculationValidation.issues,
    ];

    // 7. Calculate savings
    const savings = this.calculateSavings(invoice, allIssues);

    // 8. Generate recommendations
    const recommendations = this.generateRecommendations(allIssues, invoice);

    // 9. Determine validity
    const valid =
      allIssues.filter(
        (i) => i.severity === "CRITICAL" || i.severity === "HIGH",
      ).length === 0;
    const confidence = this.calculateConfidence(allIssues, invoice);

    const result: FreightAuditResult = {
      invoiceId: invoice.id,
      valid,
      confidence,
      issues: allIssues,
      savings,
      recommendations,
      auditDate: new Date().toISOString(),
      auditedBy: "SYSTEM",
    };

    // Store result
    invoice.auditResult = result;
    invoice.status = valid ? "AUDITED" : "REJECTED";
    this.invoices.set(invoice.id, invoice);

    // Publish event
    await eventBus.publish("transportation.freight.audited", {
      invoiceId: invoice.id,
      valid,
      issuesCount: allIssues.length,
      savings,
    });

    return result;
  }

  /**
   * Process invoice OCR
   */
  private async processInvoiceOCR(documentUrl: string): Promise<any> {
    // In production, use OCR service
    // For now, return mock data
    assertRealInProduction(
      "tms.freightAudit.ocr",
      "Invoice OCR is currently mocked. Configure OCR pipeline and invoice parsing to use in production.",
    );
    return {
      invoiceNumber: "INV-12345",
      date: new Date().toISOString(),
      total: 1000,
      lineItems: [],
    };
  }

  /**
   * Validate against contract rates
   */
  private async validateAgainstContract(invoice: FreightInvoice): Promise<{
    issues: AuditIssue[];
  }> {
    const issues: AuditIssue[] = [];

    // Get contract rates for carrier
    const carrierRates = this.contractRates.get(invoice.carrierId) || new Map();

    // Validate each line item
    for (const item of invoice.lineItems) {
      if (item.type === "BASE_RATE") {
        const contractRate = carrierRates.get("BASE_RATE");
        if (
          contractRate &&
          Math.abs(item.rate - contractRate) > contractRate * 0.05
        ) {
          issues.push({
            type: "RATE_MISMATCH",
            severity: "HIGH",
            description: `Base rate mismatch: Expected ${contractRate}, got ${item.rate}`,
            expectedValue: contractRate,
            actualValue: item.rate,
            difference: item.rate - contractRate,
          });
        }
      }

      if (item.type === "FUEL_SURCHARGE") {
        // Fuel surcharge should be percentage of base rate
        const baseRate =
          invoice.lineItems.find((i) => i.type === "BASE_RATE")?.amount || 0;
        const expectedSurcharge = baseRate * 0.12; // Typical 12%
        if (
          Math.abs(item.amount - expectedSurcharge) >
          expectedSurcharge * 0.1
        ) {
          issues.push({
            type: "RATE_MISMATCH",
            severity: "MEDIUM",
            description: `Fuel surcharge deviation: Expected ~${expectedSurcharge.toFixed(2)}, got ${item.amount}`,
            expectedValue: expectedSurcharge,
            actualValue: item.amount,
            difference: item.amount - expectedSurcharge,
          });
        }
      }
    }

    return { issues };
  }

  /**
   * Check for duplicate invoices
   */
  private async checkDuplicates(invoice: FreightInvoice): Promise<{
    issues: AuditIssue[];
  }> {
    const issues: AuditIssue[] = [];

    // Check invoice number
    const existingInvoice = Array.from(this.invoices.values()).find(
      (inv) =>
        inv.invoiceNumber === invoice.invoiceNumber && inv.id !== invoice.id,
    );

    if (existingInvoice) {
      issues.push({
        type: "DUPLICATE",
        severity: "CRITICAL",
        description: `Duplicate invoice number: ${invoice.invoiceNumber}`,
        evidence: [existingInvoice.id],
      });
    }

    // Check amount and date (potential duplicate)
    const similarInvoices = Array.from(this.invoices.values()).filter(
      (inv) =>
        inv.id !== invoice.id &&
        inv.carrierId === invoice.carrierId &&
        Math.abs(inv.total - invoice.total) < 1 &&
        Math.abs(
          new Date(inv.invoiceDate).getTime() -
            new Date(invoice.invoiceDate).getTime(),
        ) <
          24 * 60 * 60 * 1000,
    );

    if (similarInvoices.length > 0) {
      issues.push({
        type: "DUPLICATE",
        severity: "HIGH",
        description: `Potential duplicate: Similar invoice found`,
        evidence: similarInvoices.map((inv) => inv.id),
      });
    }

    return { issues };
  }

  /**
   * Detect billing anomalies using ML
   */
  private async detectAnomalies(invoice: FreightInvoice): Promise<{
    issues: AuditIssue[];
  }> {
    const issues: AuditIssue[] = [];

    // Get historical invoices for this carrier
    const historicalInvoices = Array.from(this.invoices.values()).filter(
      (inv) => inv.carrierId === invoice.carrierId && inv.status === "PAID",
    );

    if (historicalInvoices.length < 5) {
      // Not enough data for anomaly detection
      return { issues };
    }

    // Calculate statistics
    const amounts = historicalInvoices.map((inv) => inv.total);
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const median = amounts.sort((a, b) => a - b)[
      Math.floor(amounts.length / 2)
    ];
    const stdDev = Math.sqrt(
      amounts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
        amounts.length,
    );

    // Check for price spike
    if (invoice.total > average + 3 * stdDev) {
      issues.push({
        type: "ANOMALY",
        severity: "HIGH",
        description: `Price spike detected: ${invoice.total} vs average ${average.toFixed(2)}`,
        expectedValue: average,
        actualValue: invoice.total,
        difference: invoice.total - average,
      });

      // Store anomaly
      const anomaly: BillingAnomaly = {
        id: `anomaly-${invoice.id}-${Date.now()}`,
        invoiceId: invoice.id,
        type: "PRICE_SPIKE",
        severity: "HIGH",
        description: `Price spike: ${((invoice.total / average - 1) * 100).toFixed(1)}% above average`,
        detectedAt: new Date().toISOString(),
        confidence: 85,
        historicalComparison: {
          average,
          median,
          deviation: stdDev,
        },
      };

      const existingAnomalies = this.anomalies.get(invoice.carrierId) || [];
      existingAnomalies.push(anomaly);
      this.anomalies.set(invoice.carrierId, existingAnomalies);
    }

    // Use ML model for anomaly detection if available
    try {
      const mlResult = await mlModelRegistry.predict(
        "billing-anomaly-detection",
        {
          invoiceTotal: invoice.total,
          carrierId: invoice.carrierId,
          historicalAverage: average,
          historicalStdDev: stdDev,
        },
      );

      if (mlResult && mlResult.anomaly && mlResult.confidence > 0.7) {
        issues.push({
          type: "ANOMALY",
          severity: mlResult.severity || "MEDIUM",
          description: `ML-detected anomaly: ${mlResult.reason}`,
          actualValue: invoice.total,
        });
      }
    } catch (error) {
      // ML model not available, continue with rule-based
    }

    return { issues };
  }

  /**
   * Validate calculations
   */
  private async validateCalculations(invoice: FreightInvoice): Promise<{
    issues: AuditIssue[];
  }> {
    const issues: AuditIssue[] = [];

    // Calculate expected subtotal
    const expectedSubtotal = invoice.lineItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    if (Math.abs(invoice.subtotal - expectedSubtotal) > 0.01) {
      issues.push({
        type: "CALCULATION_ERROR",
        severity: "CRITICAL",
        description: `Subtotal mismatch: Expected ${expectedSubtotal.toFixed(2)}, got ${invoice.subtotal.toFixed(2)}`,
        expectedValue: expectedSubtotal,
        actualValue: invoice.subtotal,
        difference: invoice.subtotal - expectedSubtotal,
      });
    }

    // Validate tax calculation
    const expectedTax = invoice.subtotal * 0.15; // 15% VAT for Saudi Arabia
    if (Math.abs(invoice.taxes - expectedTax) > 0.01) {
      issues.push({
        type: "CALCULATION_ERROR",
        severity: "HIGH",
        description: `Tax calculation error: Expected ${expectedTax.toFixed(2)}, got ${invoice.taxes.toFixed(2)}`,
        expectedValue: expectedTax,
        actualValue: invoice.taxes,
        difference: invoice.taxes - expectedTax,
      });
    }

    // Validate total
    const expectedTotal = invoice.subtotal + invoice.taxes;
    if (Math.abs(invoice.total - expectedTotal) > 0.01) {
      issues.push({
        type: "CALCULATION_ERROR",
        severity: "CRITICAL",
        description: `Total mismatch: Expected ${expectedTotal.toFixed(2)}, got ${invoice.total.toFixed(2)}`,
        expectedValue: expectedTotal,
        actualValue: invoice.total,
        difference: invoice.total - expectedTotal,
      });
    }

    return { issues };
  }

  /**
   * Calculate potential savings
   */
  private calculateSavings(
    invoice: FreightInvoice,
    issues: AuditIssue[],
  ): number {
    let savings = 0;

    for (const issue of issues) {
      if (issue.difference && issue.difference > 0) {
        savings += issue.difference;
      }
    }

    return savings;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    issues: AuditIssue[],
    invoice: FreightInvoice,
  ): string[] {
    const recommendations: string[] = [];

    if (issues.some((i) => i.type === "RATE_MISMATCH")) {
      recommendations.push("Review contract rates with carrier");
    }

    if (issues.some((i) => i.type === "DUPLICATE")) {
      recommendations.push("Verify invoice is not duplicate before payment");
    }

    if (issues.some((i) => i.type === "ANOMALY")) {
      recommendations.push("Investigate pricing anomaly with carrier");
    }

    if (issues.some((i) => i.type === "CALCULATION_ERROR")) {
      recommendations.push("Request corrected invoice from carrier");
    }

    return recommendations;
  }

  /**
   * Calculate audit confidence
   */
  private calculateConfidence(
    issues: AuditIssue[],
    invoice: FreightInvoice,
  ): number {
    let confidence = 100;

    // Reduce confidence based on issues
    for (const issue of issues) {
      switch (issue.severity) {
        case "CRITICAL":
          confidence -= 20;
          break;
        case "HIGH":
          confidence -= 10;
          break;
        case "MEDIUM":
          confidence -= 5;
          break;
        case "LOW":
          confidence -= 2;
          break;
      }
    }

    // Increase confidence if OCR data available
    if (invoice.ocrData) {
      confidence += 5;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Batch audit invoices
   */
  async batchAudit(invoiceIds: string[]): Promise<FreightAuditResult[]> {
    const results: FreightAuditResult[] = [];

    for (const invoiceId of invoiceIds) {
      const invoice = this.invoices.get(invoiceId);
      if (invoice) {
        const result = await this.auditInvoice(invoice);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(
    carrierId?: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<{
    totalInvoices: number;
    audited: number;
    approved: number;
    rejected: number;
    totalSavings: number;
    averageSavings: number;
    issuesByType: Record<string, number>;
  }> {
    let invoices = Array.from(this.invoices.values());

    if (carrierId) {
      invoices = invoices.filter((inv) => inv.carrierId === carrierId);
    }

    if (dateRange) {
      invoices = invoices.filter((inv) => {
        const date = new Date(inv.invoiceDate);
        return date >= dateRange.from && date <= dateRange.to;
      });
    }

    const audited = invoices.filter((inv) => inv.auditResult).length;
    const approved = invoices.filter((inv) => inv.status === "APPROVED").length;
    const rejected = invoices.filter((inv) => inv.status === "REJECTED").length;

    const savings = invoices
      .filter((inv) => inv.auditResult)
      .reduce((sum, inv) => sum + (inv.auditResult?.savings || 0), 0);

    const issuesByType: Record<string, number> = {};
    invoices.forEach((inv) => {
      if (inv.auditResult) {
        inv.auditResult.issues.forEach((issue) => {
          issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
        });
      }
    });

    return {
      totalInvoices: invoices.length,
      audited,
      approved,
      rejected,
      totalSavings: savings,
      averageSavings: audited > 0 ? savings / audited : 0,
      issuesByType,
    };
  }
}

export const freightAuditService = new FreightAuditService();
