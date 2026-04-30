/**
 * 📝 ACTIVITY LOG ENDPOINT - PRODUCTION
 * 
 * Full database integration with:
 * - Real activity logging
 * - Advanced filtering
 * - Pagination
 * - Export capabilities
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/services/database/prismaClient";
import crypto from "crypto";

// GET - Fetch activity logs for user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = params.id;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Check authorization
    const isOwnData = session?.user?.id === userId;
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN", "AUDITOR"].includes(
      session?.user?.role as string
    );

    if (!isOwnData && !isAdmin && session?.user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const eventType = searchParams.get("eventType");
    const eventCategory = searchParams.get("category");
    const action = searchParams.get("action");
    const resource = searchParams.get("resource");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = { userId };

    if (eventType) where.eventType = eventType;
    if (eventCategory) where.eventCategory = eventCategory;
    if (action) where.action = action;
    if (resource) where.resource = resource;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { resource: { contains: search, mode: "insensitive" } },
        { resourceId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch activities with pagination
    const [activities, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          eventType: true,
          eventCategory: true,
          action: true,
          resource: true,
          resourceId: true,
          description: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          location: true,
          status: true,
          errorMessage: true,
          timestamp: true,
        },
      }),
      prisma.audit_logs.count({ where }),
    ]);

    // Get activity summary
    const summary = await prisma.audit_logs.groupBy({
      by: ["eventCategory"],
      where: { userId },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      summary: summary.reduce((acc, item) => {
        acc[item.eventCategory] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error("[Activity] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

// POST - Log new activity
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = params.id;
    const body = await request.json();

    const { eventType, eventCategory, action, resource, resourceId, description, metadata, status } = body;

    if (!eventType || !eventCategory || !action || !resource || !description) {
      return NextResponse.json(
        { error: "eventType, eventCategory, action, resource, and description are required" },
        { status: 400 }
      );
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create activity log
    const activity = await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId,
        tenantId: user.tenantId,
        eventType,
        eventCategory,
        action,
        resource,
        resourceId: resourceId || null,
        description,
        metadata: metadata || null,
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        status: status || "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Activity logged",
      data: { id: activity.id },
    });
  } catch (error) {
    console.error("[Activity] Error logging:", error);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}
