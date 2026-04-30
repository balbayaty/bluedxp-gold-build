/**
 * Exception Prediction Service
 * Predicts and detects exceptions in ASN processing
 */

import { PrismaClient } from "@prisma/client";
import { eventBus } from "@/lib/services/event-store";
import type {
  ASN,
  ASNException,
  ExceptionType,
  ExceptionSeverity,
} from "@/types/asn";

export class ExceptionPredictionService {
  constructor(private db: PrismaClient) {}

  /**
   * Detect exceptions for an ASN
   */
  async detectExceptions(
    asnId: string,
    tenantId: string,
  ): Promise<ASNException[]> {
    const asn = await this.db.aSN.findFirst({
      where: { id: asnId, tenantId },
      include: {
        items: true,
        exceptions: true,
        trackingEvents: true,
      },
    });

    if (!asn) {
      throw new Error("ASN not found");
    }

    const detectedExceptions: ASNException[] = [];

    // Check for late arrival
    const lateArrivalException = await this.checkLateArrival(asn);
    if (lateArrivalException) {
      detectedExceptions.push(lateArrivalException);
    }

    // Check for early arrival
    const earlyArrivalException = await this.checkEarlyArrival(asn);
    if (earlyArrivalException) {
      detectedExceptions.push(earlyArrivalException);
    }

    // Check for quantity mismatches
    const quantityExceptions = await this.checkQuantityMismatches(asn);
    detectedExceptions.push(...quantityExceptions);

    // Check for quality issues
    const qualityExceptions = await this.checkQualityIssues(asn);
    detectedExceptions.push(...qualityExceptions);

    // Check for missing documents
    const documentExceptions = await this.checkMissingDocuments(asn);
    detectedExceptions.push(...documentExceptions);

    // Save detected exceptions
    for (const exception of detectedExceptions) {
      await this.createException(exception, tenantId);
    }

    // Update ASN status if exceptions found
    if (detectedExceptions.length > 0) {
      await this.db.aSN.update({
        where: { id: asnId },
        data: {
          status: "exception",
          exceptionProbability: 1.0,
        },
      });

      // Publish event
      await eventBus.publish("asn.exception.detected", {
        asnId,
        exceptions: detectedExceptions,
        tenantId,
      });
    }

    return detectedExceptions;
  }

  /**
   * Predict potential exceptions before they occur
   */
  async predictExceptions(
    asnId: string,
    tenantId: string,
  ): Promise<
    Array<{
      type: ExceptionType;
      probability: number;
      severity: ExceptionSeverity;
    }>
  > {
    const asn = await this.db.aSN.findFirst({
      where: { id: asnId, tenantId },
      include: {
        items: true,
      },
    });

    if (!asn) {
      throw new Error("ASN not found");
    }

    const predictions: Array<{
      type: ExceptionType;
      probability: number;
      severity: ExceptionSeverity;
    }> = [];

    // Predict late arrival
    const lateArrivalProb = await this.predictLateArrival(asn);
    if (lateArrivalProb > 0.3) {
      predictions.push({
        type: "late_arrival",
        probability: lateArrivalProb,
        severity: lateArrivalProb > 0.7 ? "high" : "medium",
      });
    }

    // Predict quantity mismatch
    const quantityMismatchProb = await this.predictQuantityMismatch(asn);
    if (quantityMismatchProb > 0.3) {
      predictions.push({
        type: "quantity_mismatch",
        probability: quantityMismatchProb,
        severity: quantityMismatchProb > 0.7 ? "high" : "medium",
      });
    }

    // Predict quality issues
    const qualityIssueProb = await this.predictQualityIssues(asn);
    if (qualityIssueProb > 0.3) {
      predictions.push({
        type: "quality_issue",
        probability: qualityIssueProb,
        severity: qualityIssueProb > 0.7 ? "high" : "medium",
      });
    }

    return predictions;
  }

  /**
   * Check for late arrival
   */
  private async checkLateArrival(asn: any): Promise<ASNException | null> {
    if (!asn.actualArrivalDate || !asn.expectedArrivalDate) {
      return null;
    }

    const expected = new Date(asn.expectedArrivalDate);
    const actual = new Date(asn.actualArrivalDate);
    const delayHours =
      (actual.getTime() - expected.getTime()) / (1000 * 60 * 60);

    if (delayHours > 24) {
      return {
        id: "", // Will be generated
        asnId: asn.id,
        type: "late_arrival",
        severity:
          delayHours > 72 ? "critical" : delayHours > 48 ? "high" : "medium",
        description: `ASN arrived ${Math.round(delayHours / 24)} days late`,
        detectedAt: new Date(),
        status: "open",
        estimatedDelay: delayHours,
        metadata: {
          expectedArrival: asn.expectedArrivalDate,
          actualArrival: asn.actualArrivalDate,
          delayHours,
        },
      };
    }

    return null;
  }

  /**
   * Check for early arrival
   */
  private async checkEarlyArrival(asn: any): Promise<ASNException | null> {
    if (!asn.actualArrivalDate || !asn.expectedArrivalDate) {
      return null;
    }

    const expected = new Date(asn.expectedArrivalDate);
    const actual = new Date(asn.actualArrivalDate);
    const earlyHours =
      (expected.getTime() - actual.getTime()) / (1000 * 60 * 60);

    // Early arrival is only an exception if it's more than 3 days early
    if (earlyHours > 72) {
      return {
        id: "",
        asnId: asn.id,
        type: "early_arrival",
        severity: "low",
        description: `ASN arrived ${Math.round(earlyHours / 24)} days early`,
        detectedAt: new Date(),
        status: "open",
        metadata: {
          expectedArrival: asn.expectedArrivalDate,
          actualArrival: asn.actualArrivalDate,
          earlyHours,
        },
      };
    }

    return null;
  }

  /**
   * Check for quantity mismatches
   */
  private async checkQuantityMismatches(asn: any): Promise<ASNException[]> {
    const exceptions: ASNException[] = [];

    for (const item of asn.items || []) {
      if (
        item.receivedQuantity !== undefined &&
        item.receivedQuantity !== item.quantity
      ) {
        const difference = item.quantity - item.receivedQuantity;
        const percentage = (difference / item.quantity) * 100;

        exceptions.push({
          id: "",
          asnId: asn.id,
          itemId: item.id,
          type: "quantity_mismatch",
          severity:
            percentage > 20 ? "high" : percentage > 10 ? "medium" : "low",
          description: `Item ${item.sku}: Expected ${item.quantity}, received ${item.receivedQuantity || 0}`,
          detectedAt: new Date(),
          status: "open",
          metadata: {
            expectedQuantity: item.quantity,
            receivedQuantity: item.receivedQuantity,
            difference,
            percentage,
          },
        });
      }
    }

    return exceptions;
  }

  /**
   * Check for quality issues
   */
  private async checkQualityIssues(asn: any): Promise<ASNException[]> {
    const exceptions: ASNException[] = [];

    // Check if quality score is below threshold
    if (asn.qualityScore !== null && asn.qualityScore < 70) {
      exceptions.push({
        id: "",
        asnId: asn.id,
        type: "quality_issue",
        severity: asn.qualityScore < 50 ? "high" : "medium",
        description: `Quality score is ${asn.qualityScore}, below acceptable threshold`,
        detectedAt: new Date(),
        status: "open",
        metadata: {
          qualityScore: asn.qualityScore,
          threshold: 70,
        },
      });
    }

    return exceptions;
  }

  /**
   * Check for missing documents
   */
  private async checkMissingDocuments(asn: any): Promise<ASNException[]> {
    const exceptions: ASNException[] = [];
    const requiredDocs = ["asn_document", "packing_list"];

    const existingDocTypes = (asn.documents || []).map((doc: any) => doc.type);

    for (const requiredDoc of requiredDocs) {
      if (!existingDocTypes.includes(requiredDoc)) {
        exceptions.push({
          id: "",
          asnId: asn.id,
          type: "document_issue",
          severity: "medium",
          description: `Missing required document: ${requiredDoc}`,
          detectedAt: new Date(),
          status: "open",
          metadata: {
            missingDocument: requiredDoc,
          },
        });
      }
    }

    return exceptions;
  }

  /**
   * Predict late arrival
   */
  private async predictLateArrival(asn: any): Promise<number> {
    const now = new Date();
    const expected = new Date(asn.expectedArrivalDate);
    const daysUntil =
      (expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    // If already past expected date, high probability
    if (daysUntil < 0) {
      return 0.9;
    }

    // Get supplier history
    const supplierHistory = await this.getSupplierLateArrivalRate(
      asn.supplierId,
      asn.tenantId,
    );

    // Base probability from supplier history
    let probability = supplierHistory;

    // Adjust based on days until arrival
    if (daysUntil < 1) {
      probability += 0.2;
    } else if (daysUntil < 3) {
      probability += 0.1;
    }

    return Math.min(probability, 0.95);
  }

  /**
   * Predict quantity mismatch
   */
  private async predictQuantityMismatch(asn: any): Promise<number> {
    // Get supplier history
    const supplierHistory = await this.getSupplierQuantityMismatchRate(
      asn.supplierId,
      asn.tenantId,
    );

    // Adjust based on item count (more items = higher risk)
    let probability = supplierHistory;
    if (asn.items.length > 50) {
      probability += 0.15;
    } else if (asn.items.length > 20) {
      probability += 0.1;
    }

    return Math.min(probability, 0.95);
  }

  /**
   * Predict quality issues
   */
  private async predictQualityIssues(asn: any): Promise<number> {
    // Get supplier quality history
    const supplierQualityHistory = await this.getSupplierQualityIssueRate(
      asn.supplierId,
      asn.tenantId,
    );

    return supplierQualityHistory;
  }

  /**
   * Get supplier late arrival rate
   */
  private async getSupplierLateArrivalRate(
    supplierId: string,
    tenantId: string,
  ): Promise<number> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const totalAsns = await this.db.aSN.count({
      where: {
        supplierId,
        tenantId,
        createdAt: { gte: last30Days },
        actualArrivalDate: { not: null },
      },
    });

    if (totalAsns === 0) return 0.1;

    const lateAsns = await this.db.aSN.count({
      where: {
        supplierId,
        tenantId,
        createdAt: { gte: last30Days },
        actualArrivalDate: { not: null },
        expectedArrivalDate: { not: null },
      },
    });

    // Check which ones are actually late
    const asns = await this.db.aSN.findMany({
      where: {
        supplierId,
        tenantId,
        createdAt: { gte: last30Days },
        actualArrivalDate: { not: null },
        expectedArrivalDate: { not: null },
      },
      select: {
        expectedArrivalDate: true,
        actualArrivalDate: true,
      },
    });

    const lateCount = asns.filter((asn) => {
      const expected = new Date(asn.expectedArrivalDate!);
      const actual = new Date(asn.actualArrivalDate!);
      return actual > expected;
    }).length;

    return lateCount / totalAsns;
  }

  /**
   * Get supplier quantity mismatch rate
   */
  private async getSupplierQuantityMismatchRate(
    supplierId: string,
    tenantId: string,
  ): Promise<number> {
    // Simplified - in real implementation, check historical exceptions
    return 0.1; // Default 10%
  }

  /**
   * Get supplier quality issue rate
   */
  private async getSupplierQualityIssueRate(
    supplierId: string,
    tenantId: string,
  ): Promise<number> {
    // Simplified - in real implementation, check historical quality scores
    return 0.15; // Default 15%
  }

  /**
   * Create exception in database
   */
  private async createException(
    exception: ASNException,
    tenantId: string,
  ): Promise<void> {
    // Check if exception already exists
    const existing = await this.db.asnException.findFirst({
      where: {
        asnId: exception.asnId,
        type: exception.type,
        itemId: exception.itemId,
        status: { in: ["open", "in_progress"] },
      },
    });

    if (existing) {
      return; // Don't create duplicate
    }

    await this.db.aSNException.create({
      data: {
        asnId: exception.asnId,
        itemId: exception.itemId,
        type: exception.type,
        severity: exception.severity,
        description: exception.description,
        detectedAt: exception.detectedAt,
        detectedBy: exception.detectedBy,
        status: exception.status,
        estimatedCost: exception.estimatedCost,
        estimatedDelay: exception.estimatedDelay,
        metadata: exception.metadata || {},
        tenantId,
      },
    });
  }
}

// Export singleton
let exceptionPredictionServiceInstance: ExceptionPredictionService | null =
  null;

export function getExceptionPredictionService(): ExceptionPredictionService {
  if (!exceptionPredictionServiceInstance) {
    const { PrismaClient } = require("@prisma/client");

    exceptionPredictionServiceInstance = new ExceptionPredictionService(
      new PrismaClient(),
    );
  }

  return exceptionPredictionServiceInstance;
}
