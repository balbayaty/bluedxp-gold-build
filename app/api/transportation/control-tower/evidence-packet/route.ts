/**
 * Transportation Control Tower - Evidence Packet API
 *
 * Creates tamper-evident evidence packets (Merkle integrity) for incidents detected by the Control Tower.
 * - Tenant-scoped via withTransportationAPI
 * - RBAC protected
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { evidencePacketService } from "@/lib/services/evidence";
import { eventBus, createEvent } from "@/lib/services/event-store";
import type { ClaimType, EvidencePacket } from "@/lib/services/evidence";

type CreatePacketBody = {
  riskId: string;
  riskTitle?: string;
  riskDescription?: string;
  claimType?: ClaimType;
  entityType?: string;
  entityId?: string;
  jurisdictions?: string[];
  retentionPolicy?: "7y" | "10y" | "permanent" | "legal_hold";
  legalHold?: boolean;
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

  let body: CreatePacketBody;
  try {
    body = (await req.json()) as CreatePacketBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.riskId) {
    return NextResponse.json({ error: "riskId is required" }, { status: 400 });
  }

  const entityType = body.entityType || "transportation_incident";
  const entityId =
    body.entityId ||
    `ct-${safeIdPart(tenantId)}-${safeIdPart(body.riskId)}-${Date.now()}`;

  const claimType: ClaimType = body.claimType || "custom";
  const claim = body.riskTitle
    ? `Control Tower Incident: ${body.riskTitle}`
    : `Control Tower Incident: ${body.riskId}`;

  const packet: EvidencePacket = await evidencePacketService.generatePacket(
    {
      entityType,
      entityId,
      claimType,
      claim,
      includeEvents: true,
      includeDocuments: true,
      includeSignatures: true,
      jurisdictions: body.jurisdictions || ["SA"],
      retentionPolicy: body.retentionPolicy || "7y",
      legalHold: body.legalHold || false,
    },
    {
      id: userId,
      name: userId,
      tenantId,
      type: "user",
    },
  );

  // Emit a domain event for cross-module automation (webhooks, workflows, etc.)
  await eventBus.publish(
    createEvent(
      "transportation.control_tower.incident.packet_created",
      entityId,
      entityType,
      {
        packetId: packet.id,
        evidenceId: packet.evidenceId,
        riskId: body.riskId,
        riskTitle: body.riskTitle,
        riskDescription: body.riskDescription,
        claimType,
      },
      1,
      { tenantId, userId },
    ),
  );

  return NextResponse.json({
    packetId: packet.id,
    evidenceId: packet.evidenceId,
    entityType: packet.entityType,
    entityId: packet.entityId,
    claim: packet.claim,
    claimType: packet.claimType,
    merkleRoot: packet.merkleRoot,
    contentHash: packet.contentHash,
    contradictionIndex: packet.contradictionIndex,
    contradictions: packet.contradictions?.length || 0,
    generatedAt: packet.generatedAt,
  });
}

export const POST = withTransportationAPI(handler, {
  featureId: "control-tower",
  action: "create",
  requireAuth: true,
  rateLimit: true,
});
