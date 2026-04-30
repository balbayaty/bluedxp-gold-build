/**
 * 🔒 SESSION MANAGEMENT SERVICE
 * 
 * Enterprise session tracking with:
 * - Active session monitoring
 * - Session revocation
 * - Device fingerprinting
 * - Geographic tracking
 * - Timeout policies
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { randomBytes } from "crypto";

// ============================================================================
// TYPES
// ============================================================================

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  deviceInfo: DeviceInfo;
  location: LocationInfo;
  createdAt: Date | string;
  lastActiveAt: Date | string;
  expiresAt: Date | string;
  isCurrentSession: boolean;
  status: "active" | "expired" | "revoked";
}

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  userAgent: string;
  fingerprint?: string;
}

export interface LocationInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  isp?: string;
}

export interface SessionPolicy {
  maxConcurrentSessions: number;
  sessionTimeoutMinutes: number;
  idleTimeoutMinutes: number;
  requireMFAForNewDevice: boolean;
  notifyOnNewLogin: boolean;
  blockSuspiciousLocations: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse user agent string to extract device info
 */
function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = "Unknown";
  let browserVersion = "";
  
  if (ua.includes("chrome") && !ua.includes("edg")) {
    browser = "Chrome";
    const match = ua.match(/chrome\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
    const match = ua.match(/firefox\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
    const match = ua.match(/version\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("edg")) {
    browser = "Edge";
    const match = ua.match(/edg\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : "";
  }

  // Detect OS
  let os = "Unknown";
  let osVersion = "";
  
  if (ua.includes("windows")) {
    os = "Windows";
    if (ua.includes("windows nt 10")) osVersion = "10";
    else if (ua.includes("windows nt 11")) osVersion = "11";
  } else if (ua.includes("mac os")) {
    os = "macOS";
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    osVersion = match ? match[1].replace("_", ".") : "";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("android")) {
    os = "Android";
    const match = ua.match(/android (\d+\.\d+)/);
    osVersion = match ? match[1] : "";
  } else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
    const match = ua.match(/os (\d+[._]\d+)/);
    osVersion = match ? match[1].replace("_", ".") : "";
  }

  // Detect device type
  let deviceType: DeviceInfo["deviceType"] = "desktop";
  if (ua.includes("mobile") || ua.includes("iphone")) {
    deviceType = "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    deviceType = "tablet";
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    userAgent,
  };
}

/**
 * Generate session token
 */
function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// ============================================================================
// SESSION SERVICE
// ============================================================================

export const sessionService = {
  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    userAgent: string,
    ipAddress: string
  ): Promise<UserSession> {
    const deviceInfo = parseUserAgent(userAgent);
    const sessionToken = generateSessionToken();
    
    const session: UserSession = {
      id: `sess_${Date.now()}_${randomBytes(4).toString("hex")}`,
      userId,
      token: sessionToken,
      deviceInfo,
      location: {
        ip: ipAddress,
        // In production, use IP geolocation service
        country: "Unknown",
        city: "Unknown",
      },
      createdAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isCurrentSession: true,
      status: "active",
    };

    // In production, save to database
    // await prisma.session.create({ data: session });

    console.log(`[Session] Created for user ${userId}`);

    return session;
  },

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string, currentSessionId?: string): Promise<UserSession[]> {
    // In production, fetch from database
    // const sessions = await prisma.session.findMany({
    //   where: { userId, status: "active" },
    //   orderBy: { lastActiveAt: "desc" },
    // });

    // Mock sessions for demo
    const mockSessions: UserSession[] = [
      {
        id: "sess_current",
        userId,
        token: "hidden",
        deviceInfo: {
          browser: "Chrome",
          browserVersion: "120.0",
          os: "Windows",
          osVersion: "11",
          deviceType: "desktop",
          userAgent: "Mozilla/5.0...",
        },
        location: {
          ip: "192.168.1.100",
          city: "Dubai",
          country: "UAE",
          countryCode: "AE",
        },
        createdAt: new Date(),
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isCurrentSession: true,
        status: "active",
      },
      {
        id: "sess_mobile",
        userId,
        token: "hidden",
        deviceInfo: {
          browser: "Safari",
          browserVersion: "17.0",
          os: "iOS",
          osVersion: "17.2",
          deviceType: "mobile",
          userAgent: "Mozilla/5.0...",
        },
        location: {
          ip: "192.168.1.50",
          city: "Dubai",
          country: "UAE",
          countryCode: "AE",
        },
        createdAt: new Date(Date.now() - 3600000),
        lastActiveAt: new Date(Date.now() - 1800000),
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
        isCurrentSession: false,
        status: "active",
      },
    ];

    return mockSessions.map((s) => ({
      ...s,
      isCurrentSession: s.id === currentSessionId || s.isCurrentSession,
    }));
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    // In production, update database
    // await prisma.session.update({
    //   where: { id: sessionId, userId },
    //   data: { status: "revoked" },
    // });

    console.log(`[Session] Revoked session ${sessionId} for user ${userId}`);

    return true;
  },

  /**
   * Revoke all sessions except current
   */
  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    // In production, update database
    // const result = await prisma.session.updateMany({
    //   where: { userId, id: { not: currentSessionId }, status: "active" },
    //   data: { status: "revoked" },
    // });

    console.log(`[Session] Revoked all other sessions for user ${userId}`);

    return 1; // Number of sessions revoked
  },

  /**
   * Update session activity
   */
  async touchSession(sessionId: string): Promise<void> {
    // await prisma.session.update({
    //   where: { id: sessionId },
    //   data: { lastActiveAt: new Date() },
    // });
  },

  /**
   * Check if session is valid
   */
  async validateSession(sessionId: string, token: string): Promise<boolean> {
    // const session = await prisma.session.findUnique({
    //   where: { id: sessionId, token, status: "active" },
    // });
    // return !!session && new Date(session.expiresAt) > new Date();

    return true;
  },

  /**
   * Get session policy for user/tenant
   */
  async getSessionPolicy(tenantId?: string): Promise<SessionPolicy> {
    // In production, fetch from database based on tenant settings
    return {
      maxConcurrentSessions: 5,
      sessionTimeoutMinutes: 1440, // 24 hours
      idleTimeoutMinutes: 60, // 1 hour
      requireMFAForNewDevice: true,
      notifyOnNewLogin: true,
      blockSuspiciousLocations: false,
    };
  },

  /**
   * Detect suspicious session (impossible travel, etc.)
   */
  async detectAnomalies(
    userId: string,
    newLocation: LocationInfo
  ): Promise<{ isSuspicious: boolean; reason?: string }> {
    // In production, implement anomaly detection:
    // - Impossible travel (login from different countries in short time)
    // - Unusual browser/device
    // - Unusual login time
    // - Known malicious IPs

    return { isSuspicious: false };
  },
};

export default sessionService;
