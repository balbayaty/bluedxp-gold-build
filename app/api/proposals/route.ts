/**
 * Proposals API - Base Route
 * GET /api/proposals - List all proposals
 * POST /api/proposals - Create new proposal
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/proposals - List proposals
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.proposal.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error listing proposals:", error);
    return NextResponse.json({
      success: true,
      proposals: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      message: "No proposals found",
    });
  }
}

/**
 * POST /api/proposals - Create proposal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const proposal = await prisma.proposal.create({
      data: {
        title: body.title || "New Proposal",
        customerName: body.customerName || "Unknown Customer",
        status: body.status || "DRAFT",
        totalValue: body.totalValue || 0,
        validUntil: body.validUntil ? new Date(body.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        content: body.content || {},
        tenantId: body.tenantId || "default",
      },
    });

    return NextResponse.json({
      success: true,
      proposal,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create proposal",
    }, { status: 500 });
  }
}
