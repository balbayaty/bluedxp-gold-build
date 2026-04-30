/**
 * ASN Knowledge Base Search API
 * Search knowledge articles
 */

import { NextRequest, NextResponse } from "next/server";
import { asnKnowledgeBaseIntegration } from "@/lib/services/asn/asnKnowledgeBaseIntegration";

/**
 * GET /api/asn/knowledge/search
 * Search knowledge articles
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "Search query is required",
        },
        { status: 400 },
      );
    }

    const articles = await asnKnowledgeBaseIntegration.searchArticles(query);

    return NextResponse.json({
      success: true,
      data: articles,
      count: articles.length,
      query,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/asn/knowledge/search:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
