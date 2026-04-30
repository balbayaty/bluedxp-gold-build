/**
 * Evidence Packet by ID API Endpoints
 *
 * GET /api/evidence/packets/{id} - Get packet
 * PUT /api/evidence/packets/{id}/verify - Update verification status
 * PUT /api/evidence/packets/{id}/legal-hold - Set legal hold
 *
 * @module api/evidence/packets
 */

import { NextRequest, NextResponse } from "next/server";
import { evidencePacketService } from "@/lib/services/evidence/packet-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const packetId = params.id;

    if (!packetId) {
      return NextResponse.json(
        { error: "Packet ID is required" },
        { status: 400 },
      );
    }

    const packet = await evidencePacketService.getPacket(packetId);

    if (!packet) {
      return NextResponse.json({ error: "Packet not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: packet,
    });
  } catch (error) {
    console.error("Error getting evidence packet:", error);
    return NextResponse.json(
      {
        error: "Failed to get evidence packet",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
