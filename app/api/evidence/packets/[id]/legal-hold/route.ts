/**
 * Legal Hold API Endpoint
 *
 * PUT /api/evidence/packets/{id}/legal-hold - Set or remove legal hold
 *
 * @module api/evidence/packets
 */

import { NextRequest, NextResponse } from "next/server";
import { evidencePacketService } from "@/lib/services/evidence/packet-service";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const packetId = params.id;
    const body = await request.json();
    const { legalHold, reason } = body;

    if (!packetId) {
      return NextResponse.json(
        { error: "Packet ID is required" },
        { status: 400 },
      );
    }

    if (typeof legalHold !== "boolean") {
      return NextResponse.json(
        { error: "legalHold must be a boolean" },
        { status: 400 },
      );
    }

    // Set legal hold
    const packet = await evidencePacketService.setLegalHold(
      packetId,
      legalHold,
      reason,
    );

    return NextResponse.json({
      success: true,
      data: packet,
      message: legalHold
        ? "Legal hold set on packet"
        : "Legal hold removed from packet",
    });
  } catch (error) {
    console.error("Error setting legal hold:", error);
    return NextResponse.json(
      {
        error: "Failed to set legal hold",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
