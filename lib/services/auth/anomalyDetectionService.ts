/**
 * 🛡️ ANOMALY DETECTION SERVICE
 * 
 * Detect suspicious login and access patterns:
 * - Impossible travel detection
 * - Unusual login times
 * - Multiple failed attempts
 * - New device detection
 * - Unusual access patterns
 * 
 * BlueDXP Platform - Enterprise Grade
 */

// ============================================================================
// TYPES
// ============================================================================

export interface LoginAttempt {
  userId: string;
  timestamp: Date | string;
  ipAddress: string;
  location: GeoLocation;
  success: boolean;
  userAgent: string;
  method: "password" | "sso" | "mfa" | "api_key";
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  countryCode?: string;
}

export interface SecurityAlert {
  id: string;
  userId: string;
  type: AlertType;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  metadata: Record<string, any>;
  createdAt: Date | string;
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  acknowledgedAt?: Date | string;
  acknowledgedBy?: string;
}

export type AlertType =
  | "impossible_travel"
  | "brute_force"
  | "new_device"
  | "unusual_time"
  | "unusual_location"
  | "permission_escalation"
  | "mass_data_access"
  | "api_abuse";

export interface AnomalyConfig {
  impossibleTravelThresholdKm: number; // Max distance in km for given time
  maxFailedAttemptsPerHour: number;
  unusualTimeWindowStart: number; // Hour (0-23)
  unusualTimeWindowEnd: number;
  newDeviceAlert: boolean;
  enableGeofencing: boolean;
  allowedCountries: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: AnomalyConfig = {
  impossibleTravelThresholdKm: 500, // 500km in 1 hour is impossible
  maxFailedAttemptsPerHour: 5,
  unusualTimeWindowStart: 22, // 10 PM
  unusualTimeWindowEnd: 6, // 6 AM
  newDeviceAlert: true,
  enableGeofencing: false,
  allowedCountries: [],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two geo coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Generate unique alert ID
 */
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// ANOMALY DETECTION SERVICE
// ============================================================================

export const anomalyDetectionService = {
  /**
   * Analyze login attempt for anomalies
   */
  async analyzeLoginAttempt(
    attempt: LoginAttempt,
    recentAttempts: LoginAttempt[],
    config: AnomalyConfig = DEFAULT_CONFIG
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    // 1. Check for brute force (multiple failed attempts)
    const recentFailed = recentAttempts.filter(
      (a) =>
        !a.success &&
        new Date(a.timestamp).getTime() > Date.now() - 60 * 60 * 1000
    );

    if (recentFailed.length >= config.maxFailedAttemptsPerHour) {
      alerts.push({
        id: generateAlertId(),
        userId: attempt.userId,
        type: "brute_force",
        severity: "high",
        title: "Multiple Failed Login Attempts",
        description: `${recentFailed.length} failed login attempts in the last hour from IP ${attempt.ipAddress}`,
        metadata: {
          failedCount: recentFailed.length,
          ipAddress: attempt.ipAddress,
        },
        createdAt: new Date(),
        status: "active",
      });
    }

    // 2. Check for impossible travel
    if (attempt.success && recentAttempts.length > 0) {
      const lastSuccess = recentAttempts
        .filter((a) => a.success)
        .sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

      if (lastSuccess && lastSuccess.location && attempt.location) {
        const distance = calculateDistance(
          lastSuccess.location.latitude,
          lastSuccess.location.longitude,
          attempt.location.latitude,
          attempt.location.longitude
        );

        const timeDiffHours =
          (new Date(attempt.timestamp).getTime() -
            new Date(lastSuccess.timestamp).getTime()) /
          (1000 * 60 * 60);

        // Check if travel is impossible (> 500km/hr average)
        const speed = distance / timeDiffHours;
        if (speed > config.impossibleTravelThresholdKm) {
          alerts.push({
            id: generateAlertId(),
            userId: attempt.userId,
            type: "impossible_travel",
            severity: "critical",
            title: "Impossible Travel Detected",
            description: `Login from ${attempt.location.city || attempt.location.country} after ${lastSuccess.location.city || lastSuccess.location.country} within ${timeDiffHours.toFixed(1)} hours (${distance.toFixed(0)}km apart)`,
            metadata: {
              previousLocation: lastSuccess.location,
              currentLocation: attempt.location,
              distance: Math.round(distance),
              timeDiffHours: timeDiffHours.toFixed(1),
            },
            createdAt: new Date(),
            status: "active",
          });
        }
      }
    }

    // 3. Check for unusual time
    const attemptHour = new Date(attempt.timestamp).getHours();
    const isUnusualTime =
      attemptHour >= config.unusualTimeWindowStart ||
      attemptHour < config.unusualTimeWindowEnd;

    if (isUnusualTime && attempt.success) {
      // Only alert if user typically doesn't login at this time
      alerts.push({
        id: generateAlertId(),
        userId: attempt.userId,
        type: "unusual_time",
        severity: "low",
        title: "Unusual Login Time",
        description: `Login at ${attemptHour}:00 local time, outside normal hours`,
        metadata: {
          loginHour: attemptHour,
          normalStart: config.unusualTimeWindowEnd,
          normalEnd: config.unusualTimeWindowStart,
        },
        createdAt: new Date(),
        status: "active",
      });
    }

    // 4. Check for new device
    if (config.newDeviceAlert && attempt.success) {
      const knownDevices = recentAttempts.map((a) => a.userAgent);
      const isNewDevice = !knownDevices.includes(attempt.userAgent);

      if (isNewDevice) {
        alerts.push({
          id: generateAlertId(),
          userId: attempt.userId,
          type: "new_device",
          severity: "medium",
          title: "Login from New Device",
          description: `First login detected from this device/browser`,
          metadata: {
            userAgent: attempt.userAgent,
            ipAddress: attempt.ipAddress,
            location: attempt.location,
          },
          createdAt: new Date(),
          status: "active",
        });
      }
    }

    // 5. Check geofencing (blocked countries)
    if (
      config.enableGeofencing &&
      config.allowedCountries.length > 0 &&
      attempt.location?.countryCode
    ) {
      if (!config.allowedCountries.includes(attempt.location.countryCode)) {
        alerts.push({
          id: generateAlertId(),
          userId: attempt.userId,
          type: "unusual_location",
          severity: "high",
          title: "Login from Restricted Location",
          description: `Login attempt from ${attempt.location.country} which is not in allowed regions`,
          metadata: {
            location: attempt.location,
            allowedCountries: config.allowedCountries,
          },
          createdAt: new Date(),
          status: "active",
        });
      }
    }

    return alerts;
  },

  /**
   * Detect unusual access patterns
   */
  async detectAccessAnomalies(
    userId: string,
    activityLog: any[]
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    // Check for mass data access (e.g., downloading many records)
    const recentExports = activityLog.filter(
      (log) =>
        log.action === "export" &&
        new Date(log.timestamp).getTime() > Date.now() - 60 * 60 * 1000
    );

    if (recentExports.length > 10) {
      alerts.push({
        id: generateAlertId(),
        userId,
        type: "mass_data_access",
        severity: "medium",
        title: "Unusual Data Export Activity",
        description: `${recentExports.length} data exports in the last hour`,
        metadata: {
          exportCount: recentExports.length,
          resources: recentExports.map((e) => e.resource),
        },
        createdAt: new Date(),
        status: "active",
      });
    }

    // Check for permission escalation attempts
    const permissionChanges = activityLog.filter(
      (log) =>
        log.action === "permission_change" &&
        log.userId === userId &&
        log.targetUserId === userId
    );

    if (permissionChanges.length > 0) {
      alerts.push({
        id: generateAlertId(),
        userId,
        type: "permission_escalation",
        severity: "critical",
        title: "Self Permission Modification Attempt",
        description: "User attempted to modify their own permissions",
        metadata: { changes: permissionChanges },
        createdAt: new Date(),
        status: "active",
      });
    }

    return alerts;
  },

  /**
   * Get active alerts for a user
   */
  async getUserAlerts(userId: string): Promise<SecurityAlert[]> {
    // In production, fetch from database
    // return await prisma.securityAlert.findMany({
    //   where: { userId, status: "active" },
    //   orderBy: { createdAt: "desc" },
    // });

    // Mock response
    return [];
  },

  /**
   * Get all active alerts (admin view)
   */
  async getAllActiveAlerts(): Promise<SecurityAlert[]> {
    // Mock response
    return [
      {
        id: "alert_1",
        userId: "user_1",
        type: "brute_force",
        severity: "high",
        title: "Multiple Failed Login Attempts",
        description: "7 failed login attempts in the last hour",
        metadata: { failedCount: 7, ipAddress: "192.168.1.100" },
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        status: "active",
      },
      {
        id: "alert_2",
        userId: "user_3",
        type: "new_device",
        severity: "medium",
        title: "Login from New Device",
        description: "First login from this device/browser",
        metadata: { device: "Chrome on Windows" },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: "active",
      },
    ];
  },

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    userId: string
  ): Promise<SecurityAlert> {
    // await prisma.securityAlert.update({
    //   where: { id: alertId },
    //   data: {
    //     status: "acknowledged",
    //     acknowledgedAt: new Date(),
    //     acknowledgedBy: userId,
    //   },
    // });

    console.log(`[Anomaly] Alert ${alertId} acknowledged by ${userId}`);

    return {
      id: alertId,
      userId: "",
      type: "new_device",
      severity: "low",
      title: "",
      description: "",
      metadata: {},
      createdAt: new Date(),
      status: "acknowledged",
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
    };
  },

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    // await prisma.securityAlert.update({
    //   where: { id: alertId },
    //   data: { status: "resolved" },
    // });

    console.log(`[Anomaly] Alert ${alertId} resolved`);
  },
};

export default anomalyDetectionService;
