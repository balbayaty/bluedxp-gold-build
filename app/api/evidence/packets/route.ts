/**
 * Evidence Packet API Endpoints
 *
 * POST /api/evidence/packets - Generate evidence packet
 * GET /api/evidence/packets - List packets (with filters)
 *
 * @module api/evidence/packets
 */

import { NextRequest, NextResponse } from "next/server";
import { evidencePacketService } from "@/lib/services/evidence/packet-service";
import type {
  EvidencePacketRequest,
  Actor,
} from "@/lib/services/evidence/packet-types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { request: packetRequest, actor } = body;

    if (!packetRequest || !actor) {
      return NextResponse.json(
        { error: "Packet request and actor are required" },
        { status: 400 },
      );
    }

    // Validate request
    if (
      !packetRequest.entityType ||
      !packetRequest.entityId ||
      !packetRequest.claimType
    ) {
      return NextResponse.json(
        { error: "entityType, entityId, and claimType are required" },
        { status: 400 },
      );
    }

    // Generate packet
    const packet = await evidencePacketService.generatePacket(
      packetRequest as EvidencePacketRequest,
      actor as Actor,
    );

    return NextResponse.json({
      success: true,
      data: packet,
      message: "Evidence packet generated successfully",
    });
  } catch (error) {
    console.error("Error generating evidence packet:", error);
    return NextResponse.json(
      {
        error: "Failed to generate evidence packet",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const tenantId = searchParams.get("tenantId");

    if (entityType && entityId) {
      // Get packets for specific entity
      const packets = await evidencePacketService.getPacketsByEntity(
        entityType,
        entityId,
      );
      return NextResponse.json({
        success: true,
        data: {
          packets,
          totalCount: packets.length,
        },
      });
    }

    // Would implement full list with pagination in production
    return NextResponse.json({
      success: true,
      data: {
        packets: [],
        totalCount: 0,
      },
      message: "Use entityType and entityId query parameters to filter",
    });
  } catch (error) {
    console.error("Error getting evidence packets:", error);
    return NextResponse.json(
      {
        error: "Failed to get evidence packets",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
