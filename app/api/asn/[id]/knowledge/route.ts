/**
 * ASN Knowledge Base API
 * Get knowledge articles relevant to ASN
 */

import { NextRequest, NextResponse } from "next/server";
import { asnService } from "@/lib/services/asn/asnService";
import { asnKnowledgeBaseIntegration } from "@/lib/services/asn/asnKnowledgeBaseIntegration";

/**
 * GET /api/asn/[id]/knowledge
 * Get knowledge articles for ASN
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const asn = await asnService.getASNById(params.id);

    if (!asn) {
      return NextResponse.json(
        {
          success: false,
          error: "ASN not found",
        },
        { status: 404 },
      );
    }

    const articles = await asnKnowledgeBaseIntegration.getArticlesForASN(asn);

    return NextResponse.json({
      success: true,
      data: articles,
      count: articles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/asn/[id]/knowledge:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
