/**
 * Truth Engine Adversarial Reviews API
 */

import { NextRequest, NextResponse } from "next/server";
import { truthEngineService } from "@/lib/services/truth-engine";
import { DecisionObject, ReviewContext } from "@/types/truth-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { decision, context } = body;

    if (!decision || !context) {
      return NextResponse.json(
        { success: false, error: "decision and context are required" },
        { status: 400 },
      );
    }

    const review = await truthEngineService.reviewDecision(decision, context);

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error: any) {
    console.error("Error creating adversarial review:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create adversarial review",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reviewId = searchParams.get("reviewId");
    const decisionId = searchParams.get("decisionId");

    if (reviewId) {
      const review = await truthEngineService.getReview(reviewId);
      if (!review) {
        return NextResponse.json(
          { success: false, error: "Review not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        review,
      });
    } else if (decisionId) {
      const reviews =
        await truthEngineService.getReviewsForDecision(decisionId);
      return NextResponse.json({
        success: true,
        reviews,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "reviewId or decisionId is required" },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Error fetching adversarial review:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch adversarial review",
      },
      { status: 500 },
    );
  }
}
