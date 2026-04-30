/**
 * Authentication Helper for Workspace API Routes
 */

import { NextRequest } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { userService } from "@/lib/services/user/userService";
import type { User } from "@/types/user";

// Fast development mode - skip slow database lookups
const FAST_DEV_MODE = process.env.FAST_DEV_MODE !== "false"; // Default: true

export async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    // In development, skip slow database lookups and use fast fallback
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      process.env.ENABLE_DEMO_DATA === "true";

    // Try API auth middleware first (with timeout to prevent hanging)
    const authPromise = apiAuthMiddleware(request);
    const timeoutPromise = new Promise<{ authorized: boolean; context?: any }>(
      (resolve) => {
        setTimeout(() => {
          // In dev mode, return a mock context instead of failing
          if (isDevelopment) {
            resolve({
              authorized: true,
              context: {
                userId: request.headers.get("x-user-id") || "dev-user",
                tenantId: request.headers.get("x-tenant-id") || "tenant-1",
                roles: request.headers
                  .get("x-user-roles")
                  ?.split(",")
                  .filter(Boolean) || ["SYSTEM_ADMIN"],
                permissions: ["*"],
              },
            });
          } else {
            resolve({ authorized: false });
          }
        }, 2000); // 2 second timeout for auth
      },
    );

    const auth = await Promise.race([authPromise, timeoutPromise]);

    if (auth.authorized && auth.context?.userId) {
      // In development, skip database lookup and use auth context directly
      if (isDevelopment) {
        return {
          id: auth.context.userId,
          email: `${auth.context.userId}@example.com`,
          name: "Dev User",
          role: (auth.context.roles?.[0] || "SYSTEM_ADMIN") as any,
          status: "ACTIVE" as any,
          tenantId: auth.context.tenantId || "tenant-1",
          permissions: [],
          hierarchicalPermissions: [],
          moduleAccess: {},
          featureAccess: {},
          tabAccess: {},
          preferences: {},
          loginCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as User;
      }

      // In production, try database lookup with timeout
      try {
        const userPromise = userService.getUserById(auth.context.userId);
        const userTimeoutPromise = new Promise<User | null>((resolve) => {
          setTimeout(() => resolve(null), 3000); // 3 second timeout for user lookup
        });

        const user = await Promise.race([userPromise, userTimeoutPromise]);
        if (user) {
          return user;
        }
      } catch (dbError) {
        console.warn("[WorkspaceAuth] User lookup failed:", dbError);
        // Fall through to development fallback if enabled
      }
    }

    // Fallback: Check for auth token in cookies (for client-side requests)
    const authToken = request.cookies.get("auth-token")?.value;
    if (authToken) {
      try {
        const { verifyToken } = await import("@/lib/services/auth/jwtService");
        const payload = await verifyToken(authToken);
        if (payload && payload.userId) {
          const user = await userService.getUserById(payload.userId);
          if (user) {
            return user;
          }
        }
      } catch (tokenError) {
        console.warn("[WorkspaceAuth] Token verification failed:", tokenError);
      }
    }

    // Development fallback: Allow mock user (check headers for user info)
    if (isDevelopment) {
      const headerUserId = request.headers.get("x-user-id");
      const headerTenantId = request.headers.get("x-tenant-id");
      const headerRole = request.headers.get("x-user-roles")?.split(",")[0];

      // Return a mock user for development (fast, no database)
      return {
        id: headerUserId || "dev-user",
        email: `${headerUserId || "dev"}@example.com`,
        name: "Dev User",
        role: (headerRole || "SYSTEM_ADMIN") as any,
        status: "ACTIVE" as any,
        tenantId: headerTenantId || "tenant-1",
        permissions: [],
        hierarchicalPermissions: [],
        moduleAccess: {},
        featureAccess: {},
        tabAccess: {},
        preferences: {},
        loginCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User;
    }

    return null;
  } catch (error) {
    console.error("[WorkspaceAuth] Error getting auth user:", error);

    // Last resort: development fallback (always return user in dev to prevent blocking)
    if (isDevelopment) {
      return {
        id: "dev-user",
        email: "dev@example.com",
        name: "Dev User",
        role: "SYSTEM_ADMIN" as any,
        status: "ACTIVE" as any,
        tenantId: "tenant-1",
        permissions: [],
        hierarchicalPermissions: [],
        moduleAccess: {},
        featureAccess: {},
        tabAccess: {},
        preferences: {},
        loginCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User;
    }

    return null;
  }
}
