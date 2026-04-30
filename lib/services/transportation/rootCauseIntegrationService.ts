/**
 * Root Cause Analysis Integration Service
 *
 * Integrates transportation shipments with Root Cause Analysis module
 * for exception analysis and problem resolution
 */

import type { Shipment, Exception } from "@/types/tms";
import type { RootCauseAnalysis } from "@/types/process-lifecycle";

export interface RootCauseIntegration {
  shipmentId: string;
  rootCauseAnalysisId: string;
  exceptions: Exception[];
  rootCauses: RootCauseAnalysis["primaryCauses"];
  recommendations: string[];
  lastAnalyzedAt: Date | string;
}

export class RootCauseIntegrationService {
  /**
   * Analyze shipment exceptions and generate root cause analysis
   */
  async analyzeShipmentExceptions(shipment: Shipment): Promise<string> {
    if (!shipment.exceptions || shipment.exceptions.length === 0) {
      return ""; // No exceptions to analyze
    }

    // In production, call Root Cause Analysis module API
    // For now, generate analysis ID
    const rootCauseAnalysisId = `rca-${shipment.id}`;

    // Analyze exceptions
    const analysis = this.analyzeExceptions(shipment.exceptions, shipment);

    // Store integration (in production, save to database)
    // rootCauseIntegrations.set(shipment.id, { shipmentId: shipment.id, rootCauseAnalysisId, ...analysis })

    return rootCauseAnalysisId;
  }

  /**
   * Analyze exceptions and identify root causes
   */
  private analyzeExceptions(
    exceptions: Exception[],
    shipment: Shipment,
  ): {
    rootCauses: RootCauseAnalysis["primaryCauses"];
    recommendations: string[];
  } {
    const rootCauses: RootCauseAnalysis["primaryCauses"] = [];
    const recommendations: string[] = [];

    // Group exceptions by type
    const exceptionGroups = new Map<string, Exception[]>();
    exceptions.forEach((ex) => {
      const group = exceptionGroups.get(ex.type) || [];
      group.push(ex);
      exceptionGroups.set(ex.type, group);
    });

    // Analyze each exception type
    exceptionGroups.forEach((group, type) => {
      if (type === "DELAY") {
        rootCauses.push({
          id: `rc-delay-${shipment.id}`,
          type: "primary",
          title: "Shipment Delays",
          description: `${group.length} delay exception(s) detected`,
          confidence: 0.8,
          evidence: group.map((ex) => ({
            id: ex.id,
            type: "EXCEPTION",
            description: ex.description,
            timestamp: ex.detectedAt,
            source: "SHIPMENT",
          })),
          impact: {
            severity: group.some((ex) => ex.severity === "CRITICAL")
              ? "critical"
              : group.some((ex) => ex.severity === "HIGH")
                ? "high"
                : "medium",
            affectedStages: ["IN_TRANSIT", "DELIVERY"],
            affectedCases: group.length,
          },
          recommendations: [
            {
              id: `rec-delay-1`,
              action: "Review carrier performance",
              description:
                "Consider alternative carriers with better on-time performance",
              priority: "HIGH",
            },
            {
              id: `rec-delay-2`,
              action: "Add buffer time",
              description: "Add buffer time to estimated delivery dates",
              priority: "MEDIUM",
            },
          ],
        });

        recommendations.push(
          "Review carrier performance and consider alternatives",
        );
        recommendations.push("Add buffer time to delivery estimates");
      }

      if (type === "CUSTOMS_HOLD") {
        rootCauses.push({
          id: `rc-customs-${shipment.id}`,
          type: "primary",
          title: "Customs Clearance Issues",
          description: `${group.length} customs hold exception(s) detected`,
          confidence: 0.85,
          evidence: group.map((ex) => ({
            id: ex.id,
            type: "EXCEPTION",
            description: ex.description,
            timestamp: ex.detectedAt,
            source: "CUSTOMS",
          })),
          impact: {
            severity: "high",
            affectedStages: ["CUSTOMS_CLEARANCE"],
            affectedCases: group.length,
          },
          recommendations: [
            {
              id: `rec-customs-1`,
              action: "Improve documentation",
              description:
                "Ensure all customs documents are complete and accurate",
              priority: "HIGH",
            },
            {
              id: `rec-customs-2`,
              action: "Work with experienced broker",
              description:
                "Partner with customs broker with high clearance rate",
              priority: "MEDIUM",
            },
          ],
        });

        recommendations.push("Improve customs documentation accuracy");
        recommendations.push("Partner with experienced customs broker");
      }

      if (type === "DAMAGE" || type === "LOSS") {
        rootCauses.push({
          id: `rc-damage-${shipment.id}`,
          type: "primary",
          title: "Cargo Damage/Loss",
          description: `${group.length} ${type.toLowerCase()} exception(s) detected`,
          confidence: 0.9,
          evidence: group.map((ex) => ({
            id: ex.id,
            type: "EXCEPTION",
            description: ex.description,
            timestamp: ex.detectedAt,
            source: "CARRIER",
          })),
          impact: {
            severity: "critical",
            affectedStages: ["IN_TRANSIT", "DELIVERY"],
            affectedCases: group.length,
            costImpact: shipment.totalValue * 0.1, // Estimate 10% of value
          },
          recommendations: [
            {
              id: `rec-damage-1`,
              action: "Review packaging",
              description: "Improve packaging to prevent damage",
              priority: "HIGH",
            },
            {
              id: `rec-damage-2`,
              action: "Increase insurance coverage",
              description: "Ensure adequate insurance coverage",
              priority: "HIGH",
            },
          ],
        });

        recommendations.push("Review and improve packaging");
        recommendations.push("Ensure adequate insurance coverage");
      }
    });

    return { rootCauses, recommendations };
  }

  /**
   * Get root cause analysis for shipment
   */
  async getRootCauseAnalysis(
    shipment: Shipment,
  ): Promise<RootCauseIntegration | null> {
    if (!shipment.rootCauseAnalysisId) {
      // Generate if not exists
      if (shipment.exceptions && shipment.exceptions.length > 0) {
        const analysisId = await this.analyzeShipmentExceptions(shipment);
        shipment.rootCauseAnalysisId = analysisId;
      } else {
        return null;
      }
    }

    // In production, fetch from Root Cause Analysis module
    // For now, analyze from shipment data
    const analysis = this.analyzeExceptions(
      shipment.exceptions || [],
      shipment,
    );

    return {
      shipmentId: shipment.id,
      rootCauseAnalysisId: shipment.rootCauseAnalysisId,
      exceptions: shipment.exceptions || [],
      rootCauses: analysis.rootCauses,
      recommendations: analysis.recommendations,
      lastAnalyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Resolve exception with root cause analysis
   */
  async resolveException(
    shipment: Shipment,
    exceptionId: string,
    resolution: string,
  ): Promise<void> {
    const exception = shipment.exceptions.find((ex) => ex.id === exceptionId);
    if (exception) {
      exception.resolvedAt = new Date().toISOString();
      exception.resolvedBy = "system"; // In production, use actual user
      exception.resolution = resolution;
    }

    // Re-analyze if needed
    if (shipment.exceptions.some((ex) => !ex.resolvedAt)) {
      await this.analyzeShipmentExceptions(shipment);
    }
  }
}

export const rootCauseIntegrationService = new RootCauseIntegrationService();
