/**
 * Pulse Wellness API
 * POST /api/pulse/wellness/manual - Log manual wellness data
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { PrismaClient } from "@prisma/client";
import { pulseScoringService } from "@/lib/services/pulse";

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
    const { date, activeMinutes, steps, calories } = body;

    // Check consent
    const consent = await prisma.pulseConsent.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!consent || !consent.wellnessOptIn) {
      return NextResponse.json(
        { success: false, error: "Wellness tracking not opted in" },
        { status: 403 },
      );
    }

    const wellnessDate = date ? new Date(date) : new Date();
    wellnessDate.setHours(0, 0, 0, 0);

    // Upsert wellness data
    const existing = await prisma.pulseDailyWellness.findUnique({
      where: {
        tenantId_userId_date: {
          tenantId,
          userId,
          date: wellnessDate,
        },
      },
    });

    const wellness = existing
      ? await prisma.pulseDailyWellness.update({
          where: {
            tenantId_userId_date: {
              tenantId,
              userId,
              date: wellnessDate,
            },
          },
          data: {
            steps: steps !== undefined ? steps : existing.steps,
            activeMinutes:
              activeMinutes !== undefined
                ? activeMinutes
                : existing.activeMinutes,
            calories: calories !== undefined ? calories : existing.calories,
            sourceType: "manual",
          },
        })
      : await prisma.pulseDailyWellness.create({
          data: {
            tenantId,
            userId,
            date: wellnessDate,
            steps: steps || 0,
            activeMinutes: activeMinutes || 0,
            calories: calories || null,
            sourceType: "manual",
            confidenceScore: 100,
          },
        });

    // Award points if applicable
    if (activeMinutes || steps) {
      await pulseScoringService.processEvent({
        tenantId,
        userId,
        occurredAt: new Date(),
        eventType: "WELLNESS_LOGGED",
        sourceModule: "pulse",
        sourceRef: wellness.id,
        pointsAwardedPP: 0, // Will be calculated by scoring service
        creditsAwardedIC: 0,
        metadataJson: {
          activeMinutes: activeMinutes || 0,
          steps: steps || 0,
          calories: calories || 0,
        },
      });
    }

    return NextResponse.json({ success: true, data: wellness });
  } catch (error) {
    console.error("Log wellness error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log wellness data" },
      { status: 500 },
    );
  }
}
