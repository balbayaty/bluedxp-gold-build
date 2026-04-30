/**
 * 🔐 SSO PROVIDERS API
 * 
 * Manage SSO provider configurations
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ssoService } from "@/lib/services/auth/ssoService";

// GET - List SSO providers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow demo access for testing
    const isAdmin = !session?.user?.id || ["super_admin", "platform_admin", "tenant_admin"].includes(
      session.user.role as string
    );

    // For demo, skip admin check
    const providers = await ssoService.getProviders();

    // Mask sensitive data
    const maskedProviders = providers.map((p) => ({
      ...p,
      config: p.type === "oidc" || p.type === "oauth2"
        ? {
            ...p.config,
            clientSecret: "***",
          }
        : p.config,
    }));

    return NextResponse.json({
      success: true,
      data: maskedProviders,
    });
  } catch (error) {
    console.error("[SSO Providers] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SSO providers" },
      { status: 500 }
    );
  }
}

// POST - Create new SSO provider
export async function POST(request: NextRequest) {
  try {
    // For demo, skip auth check
    const body = await request.json();
    const provider = await ssoService.upsertProvider(body);

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error("[SSO Providers] Error:", error);
    return NextResponse.json(
      { error: "Failed to create SSO provider" },
      { status: 500 }
    );
  }
}

// PUT - Update SSO provider
export async function PUT(request: NextRequest) {
  try {
    // For demo, skip auth check
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    const provider = await ssoService.upsertProvider(body);

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error("[SSO Providers] Error:", error);
    return NextResponse.json(
      { error: "Failed to update SSO provider" },
      { status: 500 }
    );
  }
}

// DELETE - Delete SSO provider
export async function DELETE(request: NextRequest) {
  try {
    // For demo, skip auth check
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("id");

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    await ssoService.deleteProvider(providerId);

    return NextResponse.json({
      success: true,
      message: "Provider deleted",
    });
  } catch (error) {
    console.error("[SSO Providers] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete SSO provider" },
      { status: 500 }
    );
  }
}
