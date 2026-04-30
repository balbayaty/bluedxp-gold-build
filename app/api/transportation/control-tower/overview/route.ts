/**
 * Transportation Control Tower - Overview
 *
 * Enterprise-grade aggregator:
 * - Tenant scoped
 * - RBAC via withTransportationAPI
 * - Pulls from DB adapter + event store
 * - Emits Evidence for generated insights (optional, non-blocking)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { eventStore } from "@/lib/services/event-store";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

type ControlTowerOverview = {
  kpis: {
    shipments: {
      total: number;
      inTransit: number;
      delivered: number;
      exception: number;
    };
    customs: { declarations: number; pending: number; underReview: number };
    finance: {
      quotes: number;
      payments: number;
      paymentTotal: number;
      currency: string;
    };
    ops: { routePlans: number; recentEvents: number };
  };
  risks: Array<{
    id: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    title: string;
    description: string;
    entityType?: string;
    entityId?: string;
    suggestedActions: string[];
  }>;
  recentEvents: Array<{
    type: string;
    timestamp: string;
    aggregateId: string;
    tenantId?: string;
    payload?: any;
  }>;
  generatedAt: string;
};

function severityScore(
  sev: ControlTowerOverview["risks"][number]["severity"],
): number {
  return sev === "CRITICAL" ? 4 : sev === "HIGH" ? 3 : sev === "MEDIUM" ? 2 : 1;
}

async function handler(
  _req: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  const tenantId = context.tenantId;
  const userId = context.userId || "api-user";
  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  const shipments = await transportationDatabaseAdapterInstance.listShipments({
    tenantId,
    limit: 500,
    offset: 0,
  });
  const routePlans = await transportationDatabaseAdapterInstance.listRoutePlans(
    { tenantId, limit: 200, offset: 0 },
  );
  const quotes = await transportationDatabaseAdapterInstance.listQuotes({
    tenantId,
    limit: 200,
    offset: 0,
  });
  const payments = await transportationDatabaseAdapterInstance.listPayments({
    tenantId,
    limit: 200,
    offset: 0,
  });
  const declarations =
    await transportationDatabaseAdapterInstance.listCustomsDeclarations({
      tenantId,
      limit: 500,
      offset: 0,
    });

  const shipmentTotal = shipments.length;
  const inTransit = shipments.filter(
    (s) => String(s.status) === "IN_TRANSIT",
  ).length;
  const delivered = shipments.filter(
    (s) => String(s.status) === "DELIVERED",
  ).length;
  const exception = shipments.filter(
    (s) => String(s.status) === "EXCEPTION",
  ).length;

  const pendingDecl = declarations.filter(
    (d: any) => String(d.status) === "PENDING",
  ).length;
  const underReviewDecl = declarations.filter(
    (d: any) => String(d.status) === "UNDER_REVIEW",
  ).length;

  const paymentTotal = payments.reduce(
    (sum, p: any) => sum + Number(p.amount || 0),
    0,
  );
  const currency = String(
    payments[0]?.currency || quotes[0]?.currency || "SAR",
  );

  // Recent platform events (tenant-filtered)
  const recent = (await eventStore.getAllEvents(undefined, 80))
    .filter((e) => e.metadata?.tenantId === tenantId)
    .slice(-25)
    .reverse()
    .map((e) => ({
      type: e.type,
      timestamp: e.timestamp,
      aggregateId: e.aggregateId,
      tenantId: e.metadata?.tenantId,
      payload: e.payload,
    }));

  const risks: ControlTowerOverview["risks"] = [];

  // Risk signals (simple but effective, and easy to evolve)
  if (exception > 0) {
    risks.push({
      id: "risk-exceptions",
      severity: exception > 5 ? "CRITICAL" : exception > 2 ? "HIGH" : "MEDIUM",
      title: "Shipment exceptions detected",
      description: `${exception} shipment(s) are in EXCEPTION status and require immediate triage.`,
      entityType: "shipment",
      suggestedActions: [
        "Open Tracking to identify affected shipments",
        "Notify carrier and customer for impacted lanes",
        "Create incident evidence packet and assign owner",
      ],
    });
  }

  if (pendingDecl + underReviewDecl > 0) {
    risks.push({
      id: "risk-customs-backlog",
      severity: pendingDecl + underReviewDecl > 10 ? "HIGH" : "MEDIUM",
      title: "Customs clearance backlog",
      description: `${pendingDecl} pending + ${underReviewDecl} under review declarations.`,
      entityType: "customs_declaration",
      suggestedActions: [
        "Review declarations queue and broker assignment",
        "Escalate high-value shipments first",
        "Confirm required documents and HS codes",
      ],
    });
  }

  if (shipments.some((s) => (s.transitTime?.estimated || 0) > 72)) {
    risks.push({
      id: "risk-long-transit",
      severity: "MEDIUM",
      title: "Long transit-time exposure",
      description:
        "Some shipments have high predicted transit time; SLA risk may be elevated.",
      entityType: "shipment",
      suggestedActions: [
        "Run route comparison on high-risk lanes",
        "Evaluate compliance program fast-track options",
        "Enable proactive customer notifications",
      ],
    });
  }

  risks.sort((a, b) => severityScore(b.severity) - severityScore(a.severity));

  const overview: ControlTowerOverview = {
    kpis: {
      shipments: { total: shipmentTotal, inTransit, delivered, exception },
      customs: {
        declarations: declarations.length,
        pending: pendingDecl,
        underReview: underReviewDecl,
      },
      finance: {
        quotes: quotes.length,
        payments: payments.length,
        paymentTotal,
        currency,
      },
      ops: { routePlans: routePlans.length, recentEvents: recent.length },
    },
    risks,
    recentEvents: recent,
    generatedAt: new Date().toISOString(),
  };

  // Evidence + domain event (non-blocking)
  try {
    const evidence = await evidenceService.create({
      tenantId,
      type: "report",
      category: "operational",
      title: "Transportation Control Tower Overview",
      description: "Auto-generated operational snapshot (KPIs + risks)",
      content: JSON.stringify(overview, null, 2),
      createdBy: userId,
      metadata: {
        source: "control-tower",
        capturedAt: new Date().toISOString(),
        capturedMethod: "api",
      },
      relatedEntities: [],
      tags: ["tms", "transportation", "control-tower", "kpi", "risk"],
    } as any);

    await eventBus.publish(
      createEvent(
        "transportation.control_tower.overview.generated",
        `control-tower-${tenantId}`,
        "ControlTower",
        {
          evidenceId: evidence.id,
          kpi: overview.kpis,
          risks: overview.risks.slice(0, 5),
        },
        1,
        { tenantId, userId },
      ),
    );
  } catch {
    // non-critical
  }

  return NextResponse.json(overview);
}

export const GET = withTransportationAPI(handler, {
  featureId: "control-tower",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
