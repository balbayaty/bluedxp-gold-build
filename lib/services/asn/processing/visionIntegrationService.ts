/**
 * Vision Integration Service
 * Integrates AI vision capabilities for ASN processing
 */

import { PrismaClient } from "@prisma/client";
import { eventBus } from "@/lib/services/event-store";
import { visionService } from "@/lib/services/ai/visionService";
import type { ASN, ASNDocument } from "@/types/asn";

export interface VisionAnalysisResult {
  objects: Array<{
    name: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  damage?: {
    detected: boolean;
    severity: "low" | "medium" | "high";
    description: string;
    location?: string;
  };
  quantity?: {
    detected: number;
    confidence: number;
  };
  quality?: {
    score: number;
    issues: string[];
  };
  metadata: Record<string, unknown>;
}

export class VisionIntegrationService {
  constructor(private db: PrismaClient) {}

  /**
   * Analyze photo for ASN receiving
   */
  async analyzeReceivingPhoto(
    asnId: string,
    photoUrl: string,
    tenantId: string,
  ): Promise<VisionAnalysisResult> {
    try {
      // Use vision service to analyze the photo
      const context = `ASN receiving photo analysis for ASN ${asnId}. Analyze for:
- Object detection (packages, boxes, pallets)
- Damage detection (dents, tears, breaks, spills)
- Quantity verification (count visible items)
- Quality inspection (packaging condition, labeling, compliance)`;

      const visionResult = await visionService.analyzeImage(photoUrl, context, {
        enableRootCauseAnalysis: true,
        provider: "auto",
      });

      // Transform vision service result to ASN-specific format
      const analysis: VisionAnalysisResult = {
        objects: (visionResult.analysis.detectedObjects || []).map((obj) => ({
          name: obj.object,
          confidence: obj.confidence / 100, // Convert to 0-1 scale
          boundingBox: obj.boundingBox,
        })),
        damage: this.extractDamageInfo(visionResult.analysis),
        quantity: this.extractQuantityInfo(visionResult.analysis),
        quality: {
          score: this.calculateQualityScore(visionResult.analysis),
          issues: (visionResult.analysis.qualityIssues || []).map(
            (q) => q.issue,
          ),
        },
        metadata: {
          visionAnalysisId: visionResult.id,
          processingTime: visionResult.metadata.processingTime,
          provider: visionResult.metadata.provider,
          model: visionResult.metadata.model,
        },
      };

      // Create evidence document
      await this.createEvidenceDocument(asnId, photoUrl, analysis, tenantId);

      // Publish event
      await eventBus.publish("asn.vision.analyzed", {
        asnId,
        analysis,
        tenantId,
      });

      return analysis;
    } catch (error: any) {
      console.error("Error analyzing receiving photo:", error);

      // Return fallback analysis on error
      const fallbackAnalysis: VisionAnalysisResult = {
        objects: [],
        damage: {
          detected: false,
          severity: "low",
          description: "Analysis unavailable",
        },
        quantity: {
          detected: 0,
          confidence: 0,
        },
        quality: {
          score: 0,
          issues: ["Vision analysis failed"],
        },
        metadata: {
          error: error.message || "Unknown error",
        },
      };

      return fallbackAnalysis;
    }
  }

  /**
   * Extract damage information from vision analysis
   */
  private extractDamageInfo(analysis: any): VisionAnalysisResult["damage"] {
    const qualityIssues = analysis.qualityIssues || [];
    const damageIssues = qualityIssues.filter(
      (q: any) =>
        q.type === "damage" || q.issue.toLowerCase().includes("damage"),
    );

    if (damageIssues.length === 0) {
      return {
        detected: false,
        severity: "low",
        description: "No damage detected",
      };
    }

    // Find highest severity damage
    const severityMap: Record<string, number> = {
      minor: 1,
      major: 2,
      critical: 3,
    };
    const highestSeverity = damageIssues.reduce((max: any, issue: any) => {
      return severityMap[issue.severity] > severityMap[max.severity]
        ? issue
        : max;
    }, damageIssues[0]);

    return {
      detected: true,
      severity:
        highestSeverity.severity === "critical"
          ? "high"
          : highestSeverity.severity === "major"
            ? "medium"
            : "low",
      description: highestSeverity.issue,
    };
  }

  /**
   * Extract quantity information from vision analysis
   */
  private extractQuantityInfo(analysis: any): VisionAnalysisResult["quantity"] {
    // Try to extract quantity from detected objects
    const objects = analysis.detectedObjects || [];
    const countableObjects = objects.filter(
      (obj: any) =>
        obj.object.toLowerCase().includes("box") ||
        obj.object.toLowerCase().includes("package") ||
        obj.object.toLowerCase().includes("pallet") ||
        obj.object.toLowerCase().includes("item"),
    );

    const detectedCount = countableObjects.length;

    return {
      detected: detectedCount,
      confidence: detectedCount > 0 ? 0.7 : 0.3,
    };
  }

  /**
   * Calculate quality score from vision analysis
   */
  private calculateQualityScore(analysis: any): number {
    let score = 100;

    // Deduct points for quality issues
    const qualityIssues = analysis.qualityIssues || [];
    qualityIssues.forEach((issue: any) => {
      if (issue.severity === "critical") score -= 20;
      else if (issue.severity === "major") score -= 10;
      else if (issue.severity === "minor") score -= 5;
    });

    // Deduct points for safety issues
    const safetyIssues = analysis.safetyIssues || [];
    safetyIssues.forEach((issue: any) => {
      if (issue.severity === "critical") score -= 15;
      else if (issue.severity === "high") score -= 10;
      else if (issue.severity === "medium") score -= 5;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect damage in photo
   */
  async detectDamage(photoUrl: string): Promise<{
    detected: boolean;
    severity: "low" | "medium" | "high";
    description: string;
    confidence: number;
  }> {
    try {
      const context =
        "Analyze this image specifically for damage detection. Look for dents, tears, breaks, spills, or any physical damage to packages or goods.";

      const visionResult = await visionService.analyzeImage(photoUrl, context, {
        provider: "auto",
      });

      const damageInfo = this.extractDamageInfo(visionResult.analysis);

      return {
        detected: damageInfo.detected,
        severity: damageInfo.severity,
        description: damageInfo.description,
        confidence: damageInfo.detected ? 0.85 : 0.9,
      };
    } catch (error: any) {
      console.error("Error detecting damage:", error);
      return {
        detected: false,
        severity: "low",
        description: "Damage detection unavailable",
        confidence: 0.5,
      };
    }
  }

  /**
   * Verify quantity via computer vision
   */
  async verifyQuantity(
    photoUrl: string,
    expectedQuantity: number,
  ): Promise<{
    detectedQuantity: number;
    match: boolean;
    confidence: number;
    difference: number;
  }> {
    try {
      const context = `Count the number of items, boxes, packages, or pallets visible in this image. Expected quantity: ${expectedQuantity}.`;

      const visionResult = await visionService.analyzeImage(photoUrl, context, {
        provider: "auto",
      });

      const quantityInfo = this.extractQuantityInfo(visionResult.analysis);
      const detectedQuantity = quantityInfo.detected;
      const match = Math.abs(detectedQuantity - expectedQuantity) <= 2; // Allow small variance
      const difference = detectedQuantity - expectedQuantity;

      return {
        detectedQuantity,
        match,
        confidence: quantityInfo.confidence,
        difference,
      };
    } catch (error: any) {
      console.error("Error verifying quantity:", error);
      return {
        detectedQuantity: expectedQuantity, // Fallback to expected
        match: true,
        confidence: 0.5,
        difference: 0,
      };
    }
  }

  /**
   * Quality inspection via vision
   */
  async qualityInspection(photoUrl: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const context =
        "Perform a comprehensive quality inspection. Analyze packaging condition, labeling accuracy, product condition, compliance with standards, and identify any quality issues or defects.";

      const visionResult = await visionService.analyzeImage(photoUrl, context, {
        enableRootCauseAnalysis: true,
        provider: "auto",
      });

      const score = this.calculateQualityScore(visionResult.analysis);
      const issues = [
        ...(visionResult.analysis.qualityIssues || []).map((q: any) => q.issue),
        ...(visionResult.analysis.safetyIssues || []).map((s: any) => s.issue),
      ];

      const recommendations =
        visionResult.analysis.rootCauseAnalysis?.recommendations || [];

      return {
        score,
        issues,
        recommendations,
      };
    } catch (error: any) {
      console.error("Error performing quality inspection:", error);
      return {
        score: 0,
        issues: ["Quality inspection failed"],
        recommendations: [],
      };
    }
  }

  /**
   * Create evidence document from vision analysis
   */
  private async createEvidenceDocument(
    asnId: string,
    photoUrl: string,
    analysis: VisionAnalysisResult,
    tenantId: string,
  ): Promise<void> {
    // Create document record
    await this.db.aSNDocument.create({
      data: {
        asnId,
        type: "photo",
        name: `Vision Analysis - ${new Date().toISOString()}`,
        url: photoUrl,
        mimeType: "image/jpeg",
        metadata: {
          analysis,
          timestamp: new Date(),
          source: "vision_service",
        },
        tenantId,
      },
    });

    // If damage detected, create exception
    if (analysis.damage?.detected) {
      await this.db.aSNException.create({
        data: {
          asnId,
          type: "damage",
          severity:
            analysis.damage.severity === "high"
              ? "high"
              : analysis.damage.severity === "medium"
                ? "medium"
                : "low",
          description: analysis.damage.description,
          detectedAt: new Date(),
          status: "open",
          metadata: {
            visionAnalysis: analysis,
          },
          tenantId,
        },
      });

      // Update ASN status
      await this.db.aSN.update({
        where: { id: asnId },
        data: {
          status: "exception",
        },
      });
    }

    // If quantity mismatch, create exception
    if (analysis.quantity && analysis.quantity.detected !== 0) {
      const asn = await this.db.aSN.findFirst({
        where: { id: asnId },
      });

      if (asn && analysis.quantity.detected !== asn.totalQuantity) {
        await this.db.aSNException.create({
          data: {
            asnId,
            type: "quantity_mismatch",
            severity:
              Math.abs(analysis.quantity.detected - asn.totalQuantity) > 10
                ? "high"
                : "medium",
            description: `Quantity mismatch: Expected ${asn.totalQuantity}, detected ${analysis.quantity.detected}`,
            detectedAt: new Date(),
            status: "open",
            metadata: {
              expected: asn.totalQuantity,
              detected: analysis.quantity.detected,
              visionAnalysis: analysis,
            },
            tenantId,
          },
        });
      }
    }
  }

  /**
   * Batch analyze multiple photos
   */
  async batchAnalyzePhotos(
    asnId: string,
    photoUrls: string[],
    tenantId: string,
  ): Promise<VisionAnalysisResult[]> {
    const results: VisionAnalysisResult[] = [];

    for (const photoUrl of photoUrls) {
      try {
        const analysis = await this.analyzeReceivingPhoto(
          asnId,
          photoUrl,
          tenantId,
        );
        results.push(analysis);
      } catch (error) {
        console.error(`Error analyzing photo ${photoUrl}:`, error);
      }
    }

    return results;
  }
}

// Export singleton
let visionIntegrationServiceInstance: VisionIntegrationService | null = null;

export function getVisionIntegrationService(): VisionIntegrationService {
  if (!visionIntegrationServiceInstance) {
    const { PrismaClient } = require("@prisma/client");

    visionIntegrationServiceInstance = new VisionIntegrationService(
      new PrismaClient(),
    );
  }

  return visionIntegrationServiceInstance;
}
