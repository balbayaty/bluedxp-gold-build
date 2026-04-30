/**
 * Unified Performance KPI Catalog
 *
 * A curated set of Truth Engine KPIs focused on customer↔supplier SLA/KPI evaluation.
 * These definitions are registered into Truth Engine and then calculated from TruthEvents.
 *
 * Notes:
 * - TruthKPI currently does not include tenantId; we tag KPIs with `tenant:<id>` when registering.
 * - Calculations currently use the Truth Engine formula engine / event counts as implemented.
 *   As we expand, we will map more module events -> TruthEventType for richer KPI values.
 */

import type { TruthKPI, TruthEventType } from "@/types/truth-engine";

type TruthKPIDef = Omit<
  TruthKPI,
  "id" | "value" | "calculatedAt" | "evidenceIds" | "breakdown"
>;

function evidenceReq(eventType: TruthEventType, minEvidenceCount: number) {
  return { eventType, minEvidenceCount };
}

export function getDefaultPerformanceKPIs(params: {
  tenantId: string;
}): TruthKPIDef[] {
  const { tenantId } = params;

  return [
    {
      name: "Picking Completed",
      description:
        "Counts completed picking activities. When events include employeeId/customerId, this becomes an audit-ready, activity-based KPI.",
      formula: "count(picking_completed)",
      requiredEventTypes: ["picking_completed"] as TruthEventType[],
      minimumEvidenceRequirements: [evidenceReq("picking_completed", 1)],
      unit: "count",
      calculationMethod: "count",
      target: 0,
      threshold: { warning: 0, critical: 0 },
      category: "operational",
      module: "performance",
      tags: [`tenant:${tenantId}`, "kpi:wms", "kpi:picking", "kpi:activity"],
      validationStatus: "pending",
    },
    {
      name: "Putaway Completed",
      description:
        "Counts completed putaway activities. When events include employeeId/customerId, this becomes an audit-ready, activity-based KPI.",
      formula: "count(putaway_completed)",
      requiredEventTypes: ["putaway_completed"] as TruthEventType[],
      minimumEvidenceRequirements: [evidenceReq("putaway_completed", 1)],
      unit: "count",
      calculationMethod: "count",
      target: 0,
      threshold: { warning: 0, critical: 0 },
      category: "operational",
      module: "performance",
      tags: [`tenant:${tenantId}`, "kpi:wms", "kpi:putaway", "kpi:activity"],
      validationStatus: "pending",
    },
    {
      name: "On-Time Delivery Events",
      description:
        "Counts delivery completions as a baseline on-time indicator (to be refined with delay/ETA evidence).",
      formula: "count(delivered)",
      requiredEventTypes: ["delivered"] as TruthEventType[],
      minimumEvidenceRequirements: [evidenceReq("delivered", 1)],
      unit: "count",
      calculationMethod: "count",
      target: 0,
      threshold: { warning: 0, critical: 0 },
      category: "customer",
      module: "performance",
      tags: [`tenant:${tenantId}`, "kpi:delivery", "kpi:sla"],
      validationStatus: "pending",
    },
    {
      name: "SLA Breach Count",
      description: "Counts SLA breach events captured across the ecosystem.",
      formula: "count(sla_breached)",
      requiredEventTypes: ["sla_breached"] as TruthEventType[],
      minimumEvidenceRequirements: [evidenceReq("sla_breached", 1)],
      unit: "count",
      calculationMethod: "count",
      target: 0,
      threshold: { warning: 1, critical: 5 },
      category: "customer",
      module: "performance",
      tags: [`tenant:${tenantId}`, "kpi:sla", "kpi:breach"],
      validationStatus: "pending",
    },
    {
      name: "SLA Met Count",
      description: "Counts SLA met events captured across the ecosystem.",
      formula: "count(sla_met)",
      requiredEventTypes: ["sla_met"] as TruthEventType[],
      minimumEvidenceRequirements: [evidenceReq("sla_met", 1)],
      unit: "count",
      calculationMethod: "count",
      target: 0,
      threshold: { warning: 0, critical: 0 },
      category: "customer",
      module: "performance",
      tags: [`tenant:${tenantId}`, "kpi:sla", "kpi:met"],
      validationStatus: "pending",
    },
    {
      name: "Evidence Coverage (Low Confidence Events)",
      description:
        "Counts events with missing/insufficient evidence indirectly via KPI validation warnings (placeholder metric).",
      formula: "count(events_with_missing_evidence)",
      requiredEventTypes: ["custom"] as TruthEventType[],
      minimumEvidenceRequirements: [evidenceReq("custom", 0)],
      unit: "count",
      calculationMethod: "count",
      target: 0,
      threshold: { warning: 10, critical: 50 },
      category: "compliance",
      module: "performance",
      tags: [`tenant:${tenantId}`, "kpi:evidence", "kpi:truth"],
      validationStatus: "pending",
    },
  ];
}
