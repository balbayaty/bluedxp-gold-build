/**
 * Intelligent Recommendations API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { intelligentRecommendationsService } from "@/lib/services/ai/intelligentRecommendationsService";

// GET - Get recommendations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const moduleId = searchParams.get("moduleId") || undefined;
    const category = (searchParams.get("category") as any) || undefined;
    const priority = (searchParams.get("priority") as any) || undefined;
    const status = (searchParams.get("status") as any) || undefined;

    const recommendations =
      await intelligentRecommendationsService.getRecommendations(
        moduleId,
        category,
        priority,
        status,
      );

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch recommendations",
      },
      { status: 500 },
    );
  }
}

// POST - Generate recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.moduleId) {
      return NextResponse.json(
        { success: false, error: "Missing required field: moduleId" },
        { status: 400 },
      );
    }

    const recommendations =
      await intelligentRecommendationsService.generateRecommendations({
        moduleId: body.moduleId,
        entityType: body.entityType,
        entityId: body.entityId,
        metrics: body.metrics,
        recentEvents: body.recentEvents,
        userRole: body.userRole,
        tenantId: body.tenantId,
      });

    return NextResponse.json(
      {
        success: true,
        data: recommendations,
        count: recommendations.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate recommendations",
      },
      { status: 500 },
    );
  }
}

// PUT - Update recommendation status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.recommendationId || !body.status) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: recommendationId, status",
        },
        { status: 400 },
      );
    }

    const updated =
      await intelligentRecommendationsService.updateRecommendationStatus(
        body.recommendationId,
        body.status,
      );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating recommendation:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update recommendation",
      },
      { status: 500 },
    );
  }
}
