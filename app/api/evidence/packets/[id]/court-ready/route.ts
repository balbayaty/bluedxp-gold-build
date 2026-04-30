/**
 * Court-Ready Packet API Endpoint
 *
 * POST /api/evidence/packets/{id}/court-ready - Generate court-ready formatted packet
 *
 * @module api/evidence/packets
 */

import { NextRequest, NextResponse } from "next/server";
import { evidencePacketService } from "@/lib/services/evidence/packet-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const packetId = params.id;
    const body = await request.json();
    const { caseNumber } = body;

    if (!packetId) {
      return NextResponse.json(
        { error: "Packet ID is required" },
        { status: 400 },
      );
    }

    // Generate court-ready packet
    const courtReady = await evidencePacketService.generateCourtReadyPacket(
      packetId,
      caseNumber,
    );

    return NextResponse.json({
      success: true,
      data: courtReady,
      message: "Court-ready packet generated successfully",
    });
  } catch (error) {
    console.error("Error generating court-ready packet:", error);
    return NextResponse.json(
      {
        error: "Failed to generate court-ready packet",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
