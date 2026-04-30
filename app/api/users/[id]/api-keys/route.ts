/**
 * 🔑 API KEY MANAGEMENT ENDPOINT - PRODUCTION
 * 
 * Full database integration with:
 * - Secure key generation with hashing
 * - Rate limiting and quota management
 * - IP/origin restrictions
 * - Usage tracking
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/services/database/prismaClient";
import crypto from "crypto";

// Generate secure API key
function generateAPIKey(): { key: string; prefix: string; hash: string; last4: string } {
  const prefix = "bdxp";
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const key = `${prefix}_${randomBytes}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const last4 = randomBytes.slice(-4);
  return { key, prefix, hash, last4 };
}

// GET - List API keys for user
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

    // Check authorization - users can see their own keys, admins can see any
    const isOwnKeys = session?.user?.id === userId;
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN"].includes(
      session?.user?.role as string
    );

    if (!isOwnKeys && !isAdmin && session?.user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch from database
    const apiKeys = await prisma.api_keys.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        keyPrefix: true,
        keyLast4: true,
        permissions: true,
        allowedIPs: true,
        allowedOrigins: true,
        rateLimit: true,
        quotas: true,
        status: true,
        expiresAt: true,
        lastUsedAt: true,
        usageCount: true,
        createdAt: true,
        createdBy: true,
        revokedAt: true,
        revokedBy: true,
        revokedReason: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: apiKeys,
      count: apiKeys.length,
    });
  } catch (error) {
    console.error("[API Keys] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

// POST - Create new API key
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

    // Check authorization
    const isOwnKey = session.user.id === userId;
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN"].includes(
      session.user.role as string
    );

    if (!isOwnKey && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, permissions, allowedIPs, allowedOrigins, expiresAt, rateLimit, quotas } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Key name is required" },
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

    // Generate secure key
    const { key, prefix, hash, last4 } = generateAPIKey();

    // Create in database
    const apiKey = await prisma.api_keys.create({
      data: {
        id: `key_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId,
        tenantId: user.tenantId,
        name,
        description: description || null,
        keyPrefix: prefix,
        keyHash: hash,
        keyLast4: last4,
        permissions: permissions || [],
        allowedIPs: allowedIPs || [],
        allowedOrigins: allowedOrigins || [],
        rateLimit: rateLimit || null,
        quotas: quotas || null,
        status: "ACTIVE",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        keyPrefix: true,
        keyLast4: true,
        permissions: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Log to audit
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: session.user.id,
        tenantId: user.tenantId,
        eventType: "API_KEY_CREATED",
        eventCategory: "SECURITY",
        action: "CREATE",
        resource: "api_key",
        resourceId: apiKey.id,
        description: `API key "${name}" created for user ${userId}`,
        metadata: { keyId: apiKey.id, keyName: name },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "API key created successfully",
      data: {
        ...apiKey,
        key, // Only returned once on creation
      },
      warning: "Save this key securely. It will not be shown again.",
    });
  } catch (error) {
    console.error("[API Keys] Error creating:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}

// PUT - Update API key
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
    const { keyId, name, description, permissions, allowedIPs, allowedOrigins, rateLimit, quotas } = body;

    if (!keyId) {
      return NextResponse.json({ error: "Key ID required" }, { status: 400 });
    }

    // Verify key belongs to user
    const existingKey = await prisma.api_keys.findFirst({
      where: { id: keyId, userId },
    });

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Update key
    const updatedKey = await prisma.api_keys.update({
      where: { id: keyId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        permissions: permissions || undefined,
        allowedIPs: allowedIPs || undefined,
        allowedOrigins: allowedOrigins || undefined,
        rateLimit: rateLimit !== undefined ? rateLimit : undefined,
        quotas: quotas !== undefined ? quotas : undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        allowedIPs: true,
        allowedOrigins: true,
        rateLimit: true,
        quotas: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "API key updated",
      data: updatedKey,
    });
  } catch (error) {
    console.error("[API Keys] Error updating:", error);
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke API key
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
    const keyId = searchParams.get("keyId");
    const reason = searchParams.get("reason");

    if (!keyId) {
      return NextResponse.json({ error: "Key ID required" }, { status: 400 });
    }

    // Verify key belongs to user
    const existingKey = await prisma.api_keys.findFirst({
      where: { id: keyId, userId },
      include: { user: { select: { tenantId: true } } },
    });

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Revoke key
    await prisma.api_keys.update({
      where: { id: keyId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedBy: session.user.id,
        revokedReason: reason || "User requested revocation",
      },
    });

    // Log to audit
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: session.user.id,
        tenantId: existingKey.user.tenantId,
        eventType: "API_KEY_REVOKED",
        eventCategory: "SECURITY",
        action: "DELETE",
        resource: "api_key",
        resourceId: keyId,
        description: `API key "${existingKey.name}" revoked`,
        metadata: { keyId, reason },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("[API Keys] Error revoking:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
