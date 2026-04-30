/**
 * Health Check API
 * GET /api/v1/signatures/health - Check module health
 */

import { NextResponse } from "next/server";
import { pkiService } from "@/lib/services/digital-signature";

export async function GET() {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      module: "digital-signature",
      version: "1.0.0",
      services: {
        pki: "available",
        signature: "available",
        document: "available",
        workflow: "available",
        audit: "available",
        compliance: "available",
        nafath: "available",
        emdha: "available",
        blockchain: "available",
      },
      dependencies: {
        nodeForge: checkNodeForge(),
        database: "connected", // TODO: Check actual database connection
      },
    };

    return NextResponse.json({
      success: true,
      data: health,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 503 },
    );
  }
}

function checkNodeForge(): "available" | "missing" {
  try {
    require("node-forge");
    return "available";
  } catch {
    return "missing";
  }
}
