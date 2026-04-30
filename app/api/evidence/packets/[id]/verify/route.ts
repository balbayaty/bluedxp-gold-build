/**
 * Evidence Packet Verification API Endpoint
 *
 * POST /api/evidence/packets/{id}/verify - Verify packet integrity
 * PUT /api/evidence/packets/{id}/verify - Update verification status
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

    if (!packetId) {
      return NextResponse.json(
        { error: "Packet ID is required" },
        { status: 400 },
      );
    }

    // Verify packet integrity
    const verification = await evidencePacketService.verifyPacket(packetId);

    return NextResponse.json({
      success: true,
      data: verification,
      message: verification.valid
        ? "Packet integrity verified"
        : "Packet integrity issues detected",
    });
  } catch (error) {
    console.error("Error verifying evidence packet:", error);
    return NextResponse.json(
      {
        error: "Failed to verify evidence packet",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const packetId = params.id;
    const body = await request.json();
    const { status, verifiedBy, notes } = body;

    if (!packetId) {
      return NextResponse.json(
        { error: "Packet ID is required" },
        { status: 400 },
      );
    }

    if (!status || !verifiedBy) {
      return NextResponse.json(
        { error: "Status and verifiedBy are required" },
        { status: 400 },
      );
    }

    if (!["verified", "disputed", "court_submitted"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be verified, disputed, or court_submitted" },
        { status: 400 },
      );
    }

    // Update verification status
    const packet = await evidencePacketService.updateVerificationStatus(
      packetId,
      status as "verified" | "disputed" | "court_submitted",
      verifiedBy,
      notes,
    );

    return NextResponse.json({
      success: true,
      data: packet,
      message: `Packet verification status updated to ${status}`,
    });
  } catch (error) {
    console.error("Error updating verification status:", error);
    return NextResponse.json(
      {
        error: "Failed to update verification status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
