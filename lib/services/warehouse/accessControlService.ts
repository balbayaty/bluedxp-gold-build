/**
 * Warehouse Access Control Service
 * Track access logs, access points, and security events for warehouses
 *
 * BlueDXP Platform - Warehouse Security Module
 */

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  accessPoint: string;
  accessType: "ENTRY" | "EXIT";
  timestamp: Date;
  location: string;
  status: "GRANTED" | "DENIED";
  warehouseId?: string;
  metadata?: Record<string, any>;
}

export interface AccessPoint {
  id: string;
  name: string;
  warehouseId: string;
  location: string;
  type: "GATE" | "DOOR" | "LOADING_DOCK" | "SECURITY_CHECKPOINT";
  isActive: boolean;
  requiresAuthorization: boolean;
}

export class AccessControlService {
  private accessLogs: Map<string, AccessLog> = new Map();
  private accessPoints: Map<string, AccessPoint> = new Map();

  /**
   * Log access event
   */
  async logAccess(
    data: Omit<AccessLog, "id" | "timestamp">,
  ): Promise<AccessLog> {
    const log: AccessLog = {
      id: `access_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      ...data,
      timestamp: new Date(),
    };

    this.accessLogs.set(log.id, log);
    return log;
  }

  /**
   * Get access logs with filters
   */
  async getAccessLogs(filters?: {
    warehouseId?: string;
    userId?: string;
    accessPoint?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AccessLog[]> {
    let logs = Array.from(this.accessLogs.values());

    // Apply filters
    if (filters) {
      if (filters.warehouseId) {
        logs = logs.filter((log) => log.warehouseId === filters.warehouseId);
      }
      if (filters.userId) {
        logs = logs.filter((log) => log.userId === filters.userId);
      }
      if (filters.accessPoint) {
        logs = logs.filter((log) => log.accessPoint === filters.accessPoint);
      }
      if (filters.status) {
        logs = logs.filter((log) => log.status === filters.status);
      }
      if (filters.startDate) {
        logs = logs.filter((log) => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter((log) => log.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }
    }

    // Sort by timestamp (newest first)
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get access log by ID
   */
  async getAccessLog(id: string): Promise<AccessLog | null> {
    return this.accessLogs.get(id) || null;
  }

  /**
   * Register access point
   */
  async registerAccessPoint(
    data: Omit<AccessPoint, "id">,
  ): Promise<AccessPoint> {
    const accessPoint: AccessPoint = {
      id: `ap_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      ...data,
    };

    this.accessPoints.set(accessPoint.id, accessPoint);
    return accessPoint;
  }

  /**
   * Get access points for a warehouse
   */
  async getAccessPoints(warehouseId: string): Promise<AccessPoint[]> {
    return Array.from(this.accessPoints.values()).filter(
      (ap) => ap.warehouseId === warehouseId,
    );
  }

  /**
   * Update access point
   */
  async updateAccessPoint(
    id: string,
    updates: Partial<AccessPoint>,
  ): Promise<AccessPoint | null> {
    const accessPoint = this.accessPoints.get(id);
    if (!accessPoint) {
      return null;
    }

    const updated = {
      ...accessPoint,
      ...updates,
    };

    this.accessPoints.set(id, updated);
    return updated;
  }

  /**
   * Get recent denied access attempts
   */
  async getDeniedAccessAttempts(
    warehouseId?: string,
    limit: number = 10,
  ): Promise<AccessLog[]> {
    return this.getAccessLogs({
      warehouseId,
      status: "DENIED",
      limit,
    });
  }

  /**
   * Get access statistics
   */
  async getAccessStatistics(
    warehouseId: string,
    period: "day" | "week" | "month" = "day",
  ): Promise<{
    totalAccess: number;
    granted: number;
    denied: number;
    uniqueUsers: number;
    byAccessPoint: Record<string, number>;
  }> {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "day":
        startDate.setDate(now.getDate() - 1);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const logs = await this.getAccessLogs({
      warehouseId,
      startDate,
    });

    const granted = logs.filter((log) => log.status === "GRANTED").length;
    const denied = logs.filter((log) => log.status === "DENIED").length;
    const uniqueUsers = new Set(logs.map((log) => log.userId)).size;

    const byAccessPoint: Record<string, number> = {};
    logs.forEach((log) => {
      byAccessPoint[log.accessPoint] =
        (byAccessPoint[log.accessPoint] || 0) + 1;
    });

    return {
      totalAccess: logs.length,
      granted,
      denied,
      uniqueUsers,
      byAccessPoint,
    };
  }
}

export const accessControlService = new AccessControlService();
