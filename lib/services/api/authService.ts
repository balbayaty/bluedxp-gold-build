/**
 * API Authentication Service
 * Handles API key authentication, JWT tokens, and OAuth2
 */

import { APIKey, APIToken } from "@/types/userManagement";
import { verifyAPIKey, hashAPIKey, isAPIKeyValid } from "@/utils/apiKeyManager";
import { User } from "@/types/user";

export interface AuthResult {
  success: boolean;
  user?: User;
  apiKey?: APIKey;
  token?: APIToken;
  error?: string;
  reason?: string;
}

export interface AuthContext {
  userId?: string;
  tenantId?: string;
  apiKey?: APIKey;
  token?: APIToken;
  user?: User;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extract API key from request headers
 */
export function extractAPIKey(request: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Extract IP address from request
 */
export function extractIPAddress(request: Request): string {
  // Check various headers for IP (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback (in production, this would come from connection)
  return "unknown";
}

/**
 * Verify API key and return context
 * In production, this would query a database
 */
export async function authenticateAPIKey(
  key: string,
  ipAddress?: string,
): Promise<AuthResult> {
  try {
    // TODO: In production, query database for API key
    // const apiKey = await db.apiKeys.findOne({ keyHash: hashAPIKey(key) })

    // For now, return mock structure
    // This should be replaced with actual database lookup
    const mockApiKey: APIKey | null = null; // await getAPIKeyByHash(hashAPIKey(key))

    if (!mockApiKey) {
      return {
        success: false,
        error: "Invalid API key",
        reason: "API key not found",
      };
    }

    // Verify key matches hash
    if (!verifyAPIKey(key, mockApiKey.keyHash)) {
      return {
        success: false,
        error: "Invalid API key",
        reason: "Key verification failed",
      };
    }

    // Check if key is valid
    if (!isAPIKeyValid(mockApiKey)) {
      return {
        success: false,
        error: "API key is not valid",
        reason: mockApiKey.status === "EXPIRED" ? "Key expired" : "Key revoked",
      };
    }

    // Check IP whitelist
    if (
      mockApiKey.allowedIPs &&
      mockApiKey.allowedIPs.length > 0 &&
      ipAddress
    ) {
      if (!mockApiKey.allowedIPs.includes(ipAddress)) {
        return {
          success: false,
          error: "IP address not allowed",
          reason: "IP not in whitelist",
        };
      }
    }

    // Update last used (in production, update database)
    // await updateAPIKeyUsage(mockApiKey.id, ipAddress)

    return {
      success: true,
      apiKey: mockApiKey,
    };
  } catch (error) {
    return {
      success: false,
      error: "Authentication error",
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Authenticate JWT token
 */
export async function authenticateJWT(token: string): Promise<AuthResult> {
  try {
    // TODO: Verify JWT token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // const user = await getUserById(decoded.userId)

    return {
      success: false,
      error: "JWT authentication not yet implemented",
      reason: "JWT verification pending",
    };
  } catch (error) {
    return {
      success: false,
      error: "Invalid token",
      reason:
        error instanceof Error ? error.message : "Token verification failed",
    };
  }
}

/**
 * Authenticate request (tries API key first, then JWT)
 */
export async function authenticateRequest(
  request: Request,
): Promise<AuthResult> {
  const apiKey = extractAPIKey(request);
  const ipAddress = extractIPAddress(request);

  if (apiKey) {
    // Try API key authentication
    const result = await authenticateAPIKey(apiKey, ipAddress);
    if (result.success) {
      return result;
    }

    // If API key fails, try as JWT
    const jwtResult = await authenticateJWT(apiKey);
    if (jwtResult.success) {
      return jwtResult;
    }
  }

  // Check for session-based auth (for web requests)
  // const session = await getSession(request)
  // if (session?.user) {
  //   return { success: true, user: session.user }
  // }

  return {
    success: false,
    error: "Authentication required",
    reason: "No valid authentication method found",
  };
}

/**
 * Create authentication context from request
 */
export async function createAuthContext(
  request: Request,
): Promise<AuthContext | null> {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return null;
  }

  return {
    userId: authResult.user?.id || authResult.apiKey?.userId,
    tenantId: authResult.user?.tenantId || authResult.apiKey?.tenantId,
    apiKey: authResult.apiKey,
    token: authResult.token,
    user: authResult.user,
    ipAddress: extractIPAddress(request),
    userAgent: request.headers.get("user-agent") || undefined,
  };
}
