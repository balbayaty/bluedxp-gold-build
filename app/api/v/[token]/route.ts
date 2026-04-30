/**
 * Public ETW Verification API
 *
 * GET /api/v/[token] - Public verification endpoint (token-based, no auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { etwQRVerificationService } from "@/lib/services/etw/qrVerificationService";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    // Get request metadata for forensics
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Verify token
    const result = await etwQRVerificationService.verifyToken(params.token, {
      ipAddress,
      userAgent,
    });

    // Return verification result (public endpoint, no sensitive data)
    return NextResponse.json({
      success: result.verified,
      verified: result.verified,
      status: result.status,
      tamperDetected: result.tamperDetected,
      etw: result.etw
        ? {
            etwNumber: result.etw.etwNumber,
            status: result.etw.status,
            scope: result.etw.scope,
            mode: result.etw.mode,
            route: {
              origin: result.etw.route.origin,
              destination: result.etw.route.destination,
            },
            cargo: {
              totalWeight: result.etw.cargo.totalWeight,
              totalValue: result.etw.cargo.totalValue,
              currency: result.etw.cargo.currency,
            },
            events: result.etw.events.map((e) => ({
              type: e.type,
              timestamp: e.timestamp,
              actor: {
                name: e.actor.name,
                role: e.actor.role,
              },
              location: e.location,
            })),
            delivery: result.etw.delivery,
            verification: result.verificationPayload
              ? {
                  hash:
                    result.verificationPayload.hash.substring(0, 16) + "...",
                  createdAt: result.verificationPayload.createdAt,
                }
              : undefined,
          }
        : undefined,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ETW Verification API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        status: "ERROR",
        message: error instanceof Error ? error.message : "Verification failed",
      },
      { status: 500 },
    );
  }
}
