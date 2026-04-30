/**
 * QHSE Smart Alerts API
 * Provides intelligent, contextual alerts based on AI predictions and anomalies
 */

import { NextRequest, NextResponse } from "next/server";
import { intelligentQHSEService } from "@/lib/services/qhse/intelligentQHSEService";
import { qhseIncidentService } from "@/lib/services/qhse/incidentService";
import { qhseInspectionService } from "@/lib/services/qhse/inspectionService";
import { qhseTrainingService } from "@/lib/services/qhse/trainingService";
import { withAPIGateway } from "@/middleware/apiGateway";

async function handler(request: NextRequest, context: { tenantId?: string }) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context?.tenantId;
    const customerId = searchParams.get("customerId");
    const warehouseId = searchParams.get("warehouseId");
    const facilityId = searchParams.get("facilityId");

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    // Fetch intelligent insights
    const [
      insights,
      risks,
      recommendations,
      incidents,
      inspections,
      trainings,
    ] = await Promise.all([
      intelligentQHSEService.getInsights({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        timeframe: "MONTH",
      }),
      intelligentQHSEService.getSafetyRisks({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        timeframe: "MONTH",
      }),
      intelligentQHSEService.getComplianceRecommendations({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        timeframe: "MONTH",
      }),
      qhseIncidentService.getIncidents({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        limit: 10,
      }),
      qhseInspectionService.getInspections({
        tenantId,
        customerId,
        warehouseId,
        facilityId,
        limit: 10,
      }),
      qhseTrainingService.getTrainingRecords({
        tenantId,
        customerId,
        warehouseId,
      }),
    ]);

    const alerts: any[] = [];

    // Critical risk alerts
    if (risks.length > 0) {
      risks
        .filter((r) => r.overallRisk === "CRITICAL" || r.overallRisk === "HIGH")
        .forEach((risk) => {
          alerts.push({
            id: `risk-${risk.id}`,
            type: "RISK",
            severity: risk.overallRisk === "CRITICAL" ? "CRITICAL" : "HIGH",
            title: `${risk.riskType.replace(/_/g, " ")} Risk Detected`,
            description: `Risk score: ${risk.riskScore.toFixed(0)}/100. ${risk.riskFactors[0]?.description || "Immediate attention required."}`,
            action: {
              label: "View Details",
              onClick: () => {},
            },
            timestamp: new Date(),
            read: false,
          });
        });
    }

    // Anomaly alerts from insights
    insights.forEach((insight) => {
      if (insight.insightType === "ANOMALY" && insight.confidence > 70) {
        alerts.push({
          id: `anomaly-${insight.id}`,
          type: "ANOMALY",
          severity: insight.priority === "CRITICAL" ? "CRITICAL" : "HIGH",
          title: `Anomaly Detected: ${insight.title}`,
          description: insight.description,
          timestamp: new Date(insight.generatedAt),
          read: false,
        });
      }
    });

    // Deadline alerts
    inspections.forEach((inspection) => {
      if (inspection.status === "SCHEDULED" && inspection.scheduledDate) {
        const daysUntil = Math.floor(
          (new Date(inspection.scheduledDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        if (daysUntil <= 7 && daysUntil >= 0) {
          alerts.push({
            id: `deadline-${inspection.id}`,
            type: "DEADLINE",
            severity:
              daysUntil <= 1 ? "CRITICAL" : daysUntil <= 3 ? "HIGH" : "MEDIUM",
            title: `Inspection Due: ${inspection.type}`,
            description: `Scheduled inspection is due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}.`,
            timestamp: new Date(),
            read: false,
            relatedEntity: {
              type: "Inspection",
              id: inspection.id,
              name: inspection.type,
            },
          });
        }
      }
    });

    // Training expiration alerts
    trainings.forEach((training) => {
      if (training.status === "EXPIRING_SOON" && training.expiryDate) {
        const daysUntil = Math.floor(
          (new Date(training.expiryDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        alerts.push({
          id: `training-${training.id}`,
          type: "DEADLINE",
          severity: daysUntil <= 7 ? "HIGH" : "MEDIUM",
          title: `Training Expiring: ${training.programName}`,
          description: `Training certificate expires in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}.`,
          timestamp: new Date(),
          read: false,
          relatedEntity: {
            type: "Training",
            id: training.id,
            name: training.programName,
          },
        });
      }
    });

    // Recommendation alerts
    recommendations.slice(0, 3).forEach((rec) => {
      if (rec.priority === "CRITICAL" || rec.priority === "HIGH") {
        alerts.push({
          id: `rec-${rec.id}`,
          type: "RECOMMENDATION",
          severity: rec.priority === "CRITICAL" ? "CRITICAL" : "HIGH",
          title: rec.title,
          description: rec.description,
          action: {
            label: "View Recommendation",
            onClick: () => {},
          },
          timestamp: new Date(rec.generatedAt),
          read: false,
        });
      }
    });

    // Sort by severity and timestamp
    alerts.sort((a, b) => {
      const severityOrder: Record<string, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };
      const severityDiff =
        (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error("Error fetching QHSE alerts:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch alerts",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  moduleId: "qhse",
  featureId: "qhse.alerts",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
