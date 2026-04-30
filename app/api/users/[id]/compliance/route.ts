/**
 * 📋 COMPLIANCE RECORDS ENDPOINT - PRODUCTION
 * 
 * Full database integration with:
 * - Certifications and training records
 * - Expiry tracking and reminders
 * - Document management
 * - Compliance status
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/services/database/prismaClient";
import crypto from "crypto";

// GET - Fetch compliance records for user
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
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN", "HR_MANAGER", "COMPLIANCE_OFFICER"].includes(
      session?.user?.role as string
    );

    if (!isOwnData && !isAdmin && session?.user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = { userId };
    if (type) where.type = type;
    if (status) where.status = status;

    // Fetch records
    const records = await prisma.compliance_records.findMany({
      where,
      orderBy: [
        { expiryDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Calculate status for each record
    const now = new Date();
    const enrichedRecords = records.map(record => {
      let calculatedStatus = record.status;
      let daysUntilExpiry: number | null = null;
      let isExpiringSoon = false;

      if (record.expiryDate) {
        const expiry = new Date(record.expiryDate);
        daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          calculatedStatus = "EXPIRED";
        } else if (daysUntilExpiry <= (record.remindBefore || 30)) {
          isExpiringSoon = true;
        }
      }

      return {
        ...record,
        calculatedStatus,
        daysUntilExpiry,
        isExpiringSoon,
      };
    });

    // Get summary
    const summary = {
      total: records.length,
      active: enrichedRecords.filter(r => r.calculatedStatus === "ACTIVE").length,
      expired: enrichedRecords.filter(r => r.calculatedStatus === "EXPIRED").length,
      expiringSoon: enrichedRecords.filter(r => r.isExpiringSoon).length,
      pending: enrichedRecords.filter(r => r.calculatedStatus === "PENDING").length,
    };

    return NextResponse.json({
      success: true,
      data: enrichedRecords,
      summary,
      count: records.length,
    });
  } catch (error) {
    console.error("[Compliance] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance records" },
      { status: 500 }
    );
  }
}

// POST - Create new compliance record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();

    // Only admins and HR can create compliance records
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN", "HR_MANAGER", "COMPLIANCE_OFFICER"].includes(
      session.user.role as string
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Only administrators can create compliance records" }, { status: 403 });
    }

    const { type, name, description, issuer, certificateId, issuedDate, expiryDate, score, passingScore, documentUrl, remindBefore, metadata } = body;

    if (!type || !name) {
      return NextResponse.json(
        { error: "type and name are required" },
        { status: 400 }
      );
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate initial status
    let status = "ACTIVE";
    if (expiryDate && new Date(expiryDate) < new Date()) {
      status = "EXPIRED";
    } else if (!issuedDate) {
      status = "PENDING";
    }

    // Create record
    const record = await prisma.compliance_records.create({
      data: {
        userId,
        tenantId: user.tenantId,
        type,
        name,
        description: description || null,
        issuer: issuer || null,
        certificateId: certificateId || null,
        issuedDate: issuedDate ? new Date(issuedDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status,
        score: score || null,
        passingScore: passingScore || null,
        documentUrl: documentUrl || null,
        remindBefore: remindBefore || 30,
        metadata: metadata || null,
        createdBy: session.user.id,
      },
    });

    // Log to audit
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: session.user.id,
        tenantId: user.tenantId,
        eventType: "COMPLIANCE_RECORD_CREATED",
        eventCategory: "COMPLIANCE",
        action: "CREATE",
        resource: "compliance_record",
        resourceId: record.id,
        description: `Compliance record "${name}" created for user ${user.name}`,
        metadata: { type, name, expiryDate },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Compliance record created",
      data: record,
    });
  } catch (error) {
    console.error("[Compliance] Error creating:", error);
    return NextResponse.json(
      { error: "Failed to create compliance record" },
      { status: 500 }
    );
  }
}

// PUT - Update compliance record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();

    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN", "HR_MANAGER", "COMPLIANCE_OFFICER"].includes(
      session.user.role as string
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Only administrators can update compliance records" }, { status: 403 });
    }

    const { recordId, ...updates } = body;

    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    // Verify record exists
    const existing = await prisma.compliance_records.findFirst({
      where: { id: recordId, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.issuer !== undefined) updateData.issuer = updates.issuer;
    if (updates.certificateId !== undefined) updateData.certificateId = updates.certificateId;
    if (updates.issuedDate !== undefined) updateData.issuedDate = updates.issuedDate ? new Date(updates.issuedDate) : null;
    if (updates.expiryDate !== undefined) updateData.expiryDate = updates.expiryDate ? new Date(updates.expiryDate) : null;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.score !== undefined) updateData.score = updates.score;
    if (updates.documentUrl !== undefined) updateData.documentUrl = updates.documentUrl;
    if (updates.remindBefore !== undefined) updateData.remindBefore = updates.remindBefore;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const updated = await prisma.compliance_records.update({
      where: { id: recordId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Compliance record updated",
      data: updated,
    });
  } catch (error) {
    console.error("[Compliance] Error updating:", error);
    return NextResponse.json(
      { error: "Failed to update compliance record" },
      { status: 500 }
    );
  }
}

// DELETE - Delete compliance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN", "HR_MANAGER"].includes(
      session.user.role as string
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Only administrators can delete compliance records" }, { status: 403 });
    }

    // Verify and delete
    const existing = await prisma.compliance_records.findFirst({
      where: { id: recordId, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.compliance_records.delete({
      where: { id: recordId },
    });

    return NextResponse.json({
      success: true,
      message: "Compliance record deleted",
    });
  } catch (error) {
    console.error("[Compliance] Error deleting:", error);
    return NextResponse.json(
      { error: "Failed to delete compliance record" },
      { status: 500 }
    );
  }
}
