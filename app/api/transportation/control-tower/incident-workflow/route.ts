/**
 * Transportation Control Tower - Incident Workflow
 *
 * Creates an operational incident workflow instance tied to:
 * - A Control Tower risk
 * - Optional Evidence Packet (tamper-evident)
 *
 * This is tenant-scoped and RBAC-protected through withTransportationAPI.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { templateLibrary } from "@/lib/services/process-lifecycle/workflow/templateLibrary";
import { workflowService } from "@/lib/services/process-lifecycle/workflow/workflowService";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus, createEvent } from "@/lib/services/event-store";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";

type CreateIncidentWorkflowBody = {
  riskId: string;
  riskTitle?: string;
  riskDescription?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  relatedEntity?: { entityType: string; entityId: string };
  evidencePacket?: { packetId: string; evidenceId: string };
  owner?: string;
  approver?: string;
  priority?: "P1" | "P2" | "P3" | "P4";
};

function safeIdPart(v: string): string {
  return v.replace(/[^a-zA-Z0-9-_:.]/g, "-").slice(0, 80);
}

async function handler(
  req: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  const tenantId = context.tenantId;
  const userId = context.userId || "api-user";
  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  let body: CreateIncidentWorkflowBody;
  try {
    body = (await req.json()) as CreateIncidentWorkflowBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.riskId)
    return NextResponse.json({ error: "riskId is required" }, { status: 400 });

  const incidentId = `cti-${safeIdPart(tenantId)}-${safeIdPart(body.riskId)}-${Date.now()}`;
  const owner = body.owner || userId;
  const approver = body.approver || userId;
  const priority =
    body.priority ||
    (body.severity === "CRITICAL"
      ? "P1"
      : body.severity === "HIGH"
        ? "P2"
        : "P3");

  const template = templateLibrary.getTemplate(
    "template-transportation-incident-response",
  );
  if (!template?.workflow?.steps || !Array.isArray(template.workflow.steps)) {
    return NextResponse.json(
      { error: "Incident workflow template not available" },
      { status: 500 },
    );
  }

  // Create an incident "case file" evidence record (lightweight, separate from packet)
  let incidentEvidenceId: string | undefined;
  try {
    const ev = await evidenceService.create({
      tenantId,
      type: "report",
      category: "operational",
      title: `Transportation Incident: ${body.riskTitle || body.riskId}`,
      description:
        body.riskDescription || "Control Tower detected operational risk",
      content: JSON.stringify(
        {
          incidentId,
          risk: {
            id: body.riskId,
            title: body.riskTitle,
            description: body.riskDescription,
            severity: body.severity,
          },
          relatedEntity: body.relatedEntity,
          evidencePacket: body.evidencePacket,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      createdBy: userId,
      metadata: { source: "control-tower", incidentId, riskId: body.riskId },
      relatedEntities: body.relatedEntity
        ? [
            {
              type: body.relatedEntity.entityType,
              id: body.relatedEntity.entityId,
            },
          ]
        : [],
      tags: ["tms", "transportation", "control-tower", "incident", body.riskId],
    } as any);
    incidentEvidenceId = ev.id;
  } catch {
    // non-critical
  }

  // Create workflow instance
  const workflow = await workflowService.createWorkflow({
    name: `Incident Response: ${body.riskTitle || body.riskId}`,
    description:
      `Incident ${incidentId} (${priority}) — ${body.riskDescription || ""}`.trim(),
    steps: template.workflow.steps as any,
    triggers: [
      {
        event: "transportation.control_tower.incident.created",
        conditions: { riskId: body.riskId },
      },
    ],
    status: "active",
  });

  // Execute workflow immediately with structured context (so future step executors can be real)
  const execution = await workflowService.executeWorkflow(
    workflow.id,
    incidentId,
    {
      tenantId,
      incidentId,
      riskId: body.riskId,
      riskTitle: body.riskTitle,
      riskDescription: body.riskDescription,
      severity: body.severity,
      priority,
      owner,
      approver,
      evidencePacketId: body.evidencePacket?.packetId,
      evidenceId: body.evidencePacket?.evidenceId,
      incidentEvidenceId,
      relatedEntity: body.relatedEntity,
    },
  );

  // Persist incident (tenant-scoped) so it appears in /transportation/incidents immediately
  await transportationDatabaseAdapterInstance.storeIncident(
    {
      id: incidentId,
      riskId: body.riskId,
      title: body.riskTitle,
      description: body.riskDescription,
      severity: body.severity,
      priority,
      status: "OPEN",
      owner,
      approver,
      workflowId: workflow.id,
      executionId: execution.id,
      incidentEvidenceId,
      evidencePacketId: body.evidencePacket?.packetId,
      evidenceId: body.evidencePacket?.evidenceId,
      relatedEntity: body.relatedEntity,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    },
    {
      tenantId,
      createdBy: userId,
      riskId: body.riskId,
      status: "OPEN",
      severity: body.severity,
      priority,
    },
  );

  // Publish events for ecosystem automation
  await eventBus.publish(
    createEvent(
      "transportation.control_tower.incident.created",
      incidentId,
      "TransportationIncident",
      {
        incidentId,
        riskId: body.riskId,
        riskTitle: body.riskTitle,
        riskDescription: body.riskDescription,
        severity: body.severity,
        priority,
        owner,
        approver,
        workflowId: workflow.id,
        executionId: execution.id,
        incidentEvidenceId,
        evidencePacket: body.evidencePacket,
        relatedEntity: body.relatedEntity,
      },
      1,
      { tenantId, userId },
    ),
  );

  return NextResponse.json({
    incidentId,
    workflowId: workflow.id,
    executionId: execution.id,
    incidentEvidenceId,
    evidencePacket: body.evidencePacket,
    links: {
      workflow: `/process-lifecycle/workflows/${workflow.id}`,
      workflows: "/process-lifecycle/workflows",
      incidents: "/transportation/incidents",
    },
  });
}

export const POST = withTransportationAPI(handler, {
  featureId: "control-tower",
  action: "create",
  requireAuth: true,
  rateLimit: true,
});
