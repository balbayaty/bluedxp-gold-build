/**
 * Get Current User API Endpoint
 * GET /api/auth/me
 *
 * Returns current authenticated user information
 */

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth/authService";
import {
  verifyToken,
  extractTokenFromHeader,
} from "@/lib/services/auth/jwtService";

export async function GET(request: NextRequest) {
  try {
    // Get token from header or cookie
    const authHeader = request.headers.get("authorization");
    const token =
      extractTokenFromHeader(authHeader) ||
      request.cookies.get("auth-token")?.value;

    if (!token) {
      // In demo/dev mode, allow cached user without token
      // This prevents infinite loading when no token is present
      if (
        process.env.NODE_ENV === "development" ||
        process.env.ENABLE_DEMO_DATA === "true"
      ) {
        return NextResponse.json(
          { success: false, error: "No token - using cached user" },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Verify session
    const sessionResult = await authService.verifySession(token);

    if (!sessionResult.valid || !sessionResult.user) {
      return NextResponse.json(
        { success: false, error: sessionResult.error || "Invalid session" },
        { status: 401 },
      );
    }

    // Return user (without sensitive data)
    const { user } = sessionResult;
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        // Enhanced profile fields for localization (Arabic culture support)
        fullName: user.fullName,
        kunya: user.kunya,           // Arabic honorific (e.g., "Abu Khalid")
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        title: user.title,
        // Standard fields
        avatar: user.avatar,
        phone: user.phone,
        department: user.department,
        jobTitle: user.jobTitle,
        assignedCustomers: user.assignedCustomers,
        assignedWarehouses: user.assignedWarehouses,
        assignedRegions: user.assignedRegions,
        permissions: user.permissions,
        hierarchicalPermissions: user.hierarchicalPermissions,
        moduleAccess: user.moduleAccess,
        featureAccess: user.featureAccess,
        tabAccess: user.tabAccess,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get current user API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get user information" },
      { status: 500 },
    );
  }
}
