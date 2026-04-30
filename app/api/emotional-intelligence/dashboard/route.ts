/**
 * Emotional Intelligence Dashboard Data API
 *
 * GET /api/emotional-intelligence/dashboard
 * Get aggregated data for dashboard (heat map, relationships, predictions, insights)
 *
 * PRODUCTION READY - Multi-tenant, bulletproof error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { PrismaClient } from "@prisma/client";
import type { EntityType } from "@/lib/services/emotional-intelligence/unifiedEmotionalIntelligenceService";

const prisma = new PrismaClient();

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (request.method !== "GET") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }

    // Validate tenant context
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required", code: "TENANT_REQUIRED" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "7d";
    const entityTypeFilter = searchParams.get("entityType")?.split(",") || [];

    // Calculate time cutoff
    const now = new Date();
    let cutoff: Date;
    switch (timeRange) {
      case "24h":
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoff = new Date(0); // All time
    }

    // Build where clause
    const where: any = {
      tenantId: context.tenantId,
      createdAt: {
        gte: cutoff,
      },
    };

    if (entityTypeFilter.length > 0) {
      where.entityType = {
        in: entityTypeFilter,
      };
    }

    // Get latest emotional states for heat map (one per entity)
    const allStates = await prisma.emotionalState.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by entity and get latest
    const entityMap = new Map<string, (typeof allStates)[0]>();
    for (const state of allStates) {
      const key = `${state.entityType}:${state.entityId}`;
      if (!entityMap.has(key)) {
        entityMap.set(key, state);
      }
    }

    const heatMapData = Array.from(entityMap.values()).map((state, idx) => {
      const sentiment = (state.sentiment as any)?.sentiment || "neutral";
      return {
        entityId: state.entityId,
        entityType: state.entityType as EntityType,
        state: state.state,
        sentiment,
        intensity: (state.sentiment as any)?.intensity || 0.5,
        timestamp: state.createdAt,
        x: idx % 10,
        y: Math.floor(idx / 10),
      };
    });

    // Get relationship health data
    const relationships = await prisma.relationshipHealth.findMany({
      where: {
        tenantId: context.tenantId,
        ...(entityTypeFilter.length > 0 && {
          OR: [
            { entityType1: { in: entityTypeFilter } },
            { entityType2: { in: entityTypeFilter } },
          ],
        }),
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50,
    });

    const relationshipData = relationships.map((r) => ({
      entityId1: r.entityId1,
      entityId2: r.entityId2,
      entityType1: r.entityType1 as EntityType,
      entityType2: r.entityType2 as EntityType,
      healthScore: r.healthScore,
      sentiment: r.sentiment as "positive" | "negative" | "neutral",
      trend: r.trend as "improving" | "declining" | "stable",
      riskLevel: r.riskLevel as "LOW" | "MEDIUM" | "HIGH",
      lastInteraction: r.lastInteraction || undefined,
      interactionCount: r.interactionCount,
      averageSentiment: Number(r.averageSentiment),
      recommendations: r.recommendations as string[],
    }));

    // Get behavioral predictions
    const predictions = await prisma.behavioralPrediction.findMany({
      where: {
        tenantId: context.tenantId,
        expiresAt: {
          gt: new Date(),
        },
        ...(entityTypeFilter.length > 0 && {
          entityType: {
            in: entityTypeFilter,
          },
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    const predictionData = predictions.map((p) => ({
      entityId: p.entityId,
      entityType: p.entityType as EntityType,
      prediction: p.prediction,
      confidence: Number(p.confidence),
      timeframe: p.timeframe,
      riskFactors: p.riskFactors as string[],
      positiveSignals: p.positiveSignals as string[],
      recommendedActions: p.recommendedActions as string[],
      supportingEvidence: p.supportingEvidence as string[],
    }));

    // Get emotional insights
    const insights = await prisma.emotionalInsight.findMany({
      where: {
        tenantId: context.tenantId,
        ...(entityTypeFilter.length > 0 && {
          entityType: {
            in: entityTypeFilter,
          },
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    const insightData = insights.map((i) => ({
      id: i.id,
      entityId: i.entityId,
      entityType: i.entityType as EntityType,
      insight: i.insight,
      type: i.insightType as
        | "TREND"
        | "ANOMALY"
        | "PREDICTION"
        | "RECOMMENDATION"
        | "RISK",
      confidence: Number(i.confidence),
      impact: i.impact as "LOW" | "MEDIUM" | "HIGH",
      actionable: i.actionable,
      recommendedAction: i.recommendedAction || undefined,
      timestamp: i.createdAt,
    }));

    // Get sentiment flow data (aggregate by day)
    const sentimentFlowStates = await prisma.emotionalState.findMany({
      where: {
        tenantId: context.tenantId,
        createdAt: {
          gte: cutoff,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Aggregate by day
    const dailySentiment = new Map<
      string,
      { sentiment: number; count: number }
    >();
    for (const state of sentimentFlowStates) {
      const date = state.createdAt.toISOString().split("T")[0];
      const sentiment = (state.sentiment as any)?.sentiment || "neutral";
      const value =
        sentiment === "positive" ? 1 : sentiment === "negative" ? -1 : 0;

      const existing = dailySentiment.get(date) || { sentiment: 0, count: 0 };
      dailySentiment.set(date, {
        sentiment: existing.sentiment + value,
        count: existing.count + 1,
      });
    }

    const sentimentFlowData = Array.from(dailySentiment.entries())
      .map(([date, data]) => ({
        timestamp: new Date(date),
        sentiment: data.count > 0 ? data.sentiment / data.count : 0,
        emotionalState:
          data.sentiment > 0
            ? "POSITIVE"
            : data.sentiment < 0
              ? "NEGATIVE"
              : "NEUTRAL",
        intensity: Math.abs(data.sentiment / data.count) || 0.5,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return NextResponse.json({
      success: true,
      data: {
        heatMapData,
        sentimentFlowData,
        relationships: relationshipData,
        predictions: predictionData,
        insights: insightData,
      },
    });
  } catch (error: any) {
    console.error("[Emotional Intelligence Dashboard API] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to load dashboard data",
        code: "INTERNAL_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  feature: "emotional-intelligence",
  action: "read",
  description: "Get dashboard data",
  requireAuth: true,
});
