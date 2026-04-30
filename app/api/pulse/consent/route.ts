/**
 * Pulse Consent API
 * POST /api/pulse/consent/optin - Opt in/out of wellness tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const { userId, tenantId } = auth.context;
    const body = await request.json();
    const { wellnessOptIn, retentionDays } = body;

    const consentVersion = "1.0";
    const consentText = "I consent to wellness data tracking for Pulse module";
    const consentTextHash = require("crypto")
      .createHash("sha256")
      .update(consentText)
      .digest("hex");

    const existing = await prisma.pulseConsent.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    const consent = existing
      ? await prisma.pulseConsent.update({
          where: {
            tenantId_userId: {
              tenantId,
              userId,
            },
          },
          data: {
            wellnessOptIn:
              wellnessOptIn !== undefined
                ? wellnessOptIn
                : existing.wellnessOptIn,
            consentVersion,
            consentTextHash,
            consentedAt: wellnessOptIn ? new Date() : existing.consentedAt,
            revokedAt: wellnessOptIn ? undefined : new Date(),
            dataRetentionDays: retentionDays || existing.dataRetentionDays,
          },
        })
      : await prisma.pulseConsent.create({
          data: {
            tenantId,
            userId,
            wellnessOptIn: wellnessOptIn || false,
            consentVersion,
            consentTextHash,
            consentedAt: new Date(),
            dataRetentionDays: retentionDays || 365,
          },
        });

    return NextResponse.json({ success: true, data: consent });
  } catch (error) {
    console.error("Consent opt-in error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update consent" },
      { status: 500 },
    );
  }
}
