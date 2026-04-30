/**
 * 🤖 AI AGENT MANAGEMENT ENDPOINT - PRODUCTION
 * 
 * Full database integration with:
 * - Agent assignment and configuration
 * - Token quota management
 * - Execution tracking
 * - Performance metrics
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/services/database/prismaClient";
import crypto from "crypto";

// Available agent types
const AGENT_TYPES = [
  { id: "copilot", name: "AI Copilot", description: "General-purpose AI assistant", defaultQuota: 50000 },
  { id: "data_analyst", name: "Data Analyst", description: "Advanced data analysis and insights", defaultQuota: 100000 },
  { id: "compliance_monitor", name: "Compliance Monitor", description: "Regulatory compliance automation", defaultQuota: 25000 },
  { id: "process_optimizer", name: "Process Optimizer", description: "Workflow optimization", defaultQuota: 50000 },
  { id: "document_processor", name: "Document Processor", description: "Document analysis and extraction", defaultQuota: 75000 },
  { id: "forecast_engine", name: "Forecast Engine", description: "Predictive analytics", defaultQuota: 100000 },
];

// GET - List agent assignments for user
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
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN"].includes(
      session?.user?.role as string
    );

    if (!isOwnData && !isAdmin && session?.user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch from database
    const assignments = await prisma.agent_assignments.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Enrich with agent metadata
    const enrichedAssignments = assignments.map(assignment => {
      const agentMeta = AGENT_TYPES.find(a => a.id === assignment.agentType);
      return {
        ...assignment,
        agentName: agentMeta?.name || assignment.agentType,
        agentDescription: agentMeta?.description || "",
        quotaPercentUsed: assignment.tokenQuota > 0 
          ? Math.round((assignment.tokensUsed / assignment.tokenQuota) * 100) 
          : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedAssignments,
      availableAgents: AGENT_TYPES,
      count: assignments.length,
    });
  } catch (error) {
    console.error("[Agents] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent assignments" },
      { status: 500 }
    );
  }
}

// POST - Assign new agent to user
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

    // Only admins can assign agents
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN"].includes(
      session.user.role as string
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Only administrators can assign agents" }, { status: 403 });
    }

    const { agentType, tokenQuota, configuration, permissions } = body;

    if (!agentType) {
      return NextResponse.json({ error: "Agent type is required" }, { status: 400 });
    }

    // Validate agent type
    const agentMeta = AGENT_TYPES.find(a => a.id === agentType);
    if (!agentMeta) {
      return NextResponse.json(
        { error: "Invalid agent type", validTypes: AGENT_TYPES.map(a => a.id) },
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

    // Check if already assigned
    const existing = await prisma.agent_assignments.findFirst({
      where: { userId, agentType },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Agent already assigned to this user", existingId: existing.id },
        { status: 409 }
      );
    }

    // Create assignment
    const assignment = await prisma.agent_assignments.create({
      data: {
        userId,
        tenantId: user.tenantId,
        agentType,
        isEnabled: true,
        tokenQuota: tokenQuota || agentMeta.defaultQuota,
        tokensUsed: 0,
        executionCount: 0,
        configuration: configuration || {},
        permissions: permissions || [],
        createdBy: session.user.id,
      },
    });

    // Log to audit
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: session.user.id,
        tenantId: user.tenantId,
        eventType: "AGENT_ASSIGNED",
        eventCategory: "AI",
        action: "CREATE",
        resource: "agent_assignment",
        resourceId: assignment.id,
        description: `Agent "${agentMeta.name}" assigned to user ${userId}`,
        metadata: { agentType, tokenQuota: assignment.tokenQuota },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${agentMeta.name} assigned successfully`,
      data: {
        ...assignment,
        agentName: agentMeta.name,
        agentDescription: agentMeta.description,
      },
    });
  } catch (error) {
    console.error("[Agents] Error assigning:", error);
    return NextResponse.json(
      { error: "Failed to assign agent" },
      { status: 500 }
    );
  }
}

// PUT - Update agent assignment
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

    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN"].includes(
      session.user.role as string
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Only administrators can update agent assignments" }, { status: 403 });
    }

    const { assignmentId, isEnabled, tokenQuota, configuration, permissions, resetUsage } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    // Verify assignment exists and belongs to user
    const existing = await prisma.agent_assignments.findFirst({
      where: { id: assignmentId, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (tokenQuota !== undefined) updateData.tokenQuota = tokenQuota;
    if (configuration !== undefined) updateData.configuration = configuration;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (resetUsage) {
      updateData.tokensUsed = 0;
      updateData.executionCount = 0;
    }

    const updated = await prisma.agent_assignments.update({
      where: { id: assignmentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Agent assignment updated",
      data: updated,
    });
  } catch (error) {
    console.error("[Agents] Error updating:", error);
    return NextResponse.json(
      { error: "Failed to update agent assignment" },
      { status: 500 }
    );
  }
}

// DELETE - Remove agent assignment
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
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN"].includes(
      session.user.role as string
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Only administrators can remove agent assignments" }, { status: 403 });
    }

    // Verify and delete
    const existing = await prisma.agent_assignments.findFirst({
      where: { id: assignmentId, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    await prisma.agent_assignments.delete({
      where: { id: assignmentId },
    });

    // Log to audit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    if (user) {
      await prisma.audit_logs.create({
        data: {
          id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
          userId: session.user.id,
          tenantId: user.tenantId,
          eventType: "AGENT_REMOVED",
          eventCategory: "AI",
          action: "DELETE",
          resource: "agent_assignment",
          resourceId: assignmentId,
          description: `Agent ${existing.agentType} removed from user ${userId}`,
          metadata: { agentType: existing.agentType },
          ipAddress: request.headers.get("x-forwarded-for") || null,
          userAgent: request.headers.get("user-agent") || null,
          status: "SUCCESS",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Agent assignment removed",
    });
  } catch (error) {
    console.error("[Agents] Error removing:", error);
    return NextResponse.json(
      { error: "Failed to remove agent assignment" },
      { status: 500 }
    );
  }
}
