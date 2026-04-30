/**
 * Incident Management Service
 * Track incidents, alerts, on-call rotation, and post-mortems
 */

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "closed";
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  incidentId?: string;
  source: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "acknowledged" | "resolved";
  createdAt: Date;
  metadata?: Record<string, any>;
}

export class IncidentService {
  private incidents: Map<string, Incident> = new Map();
  private alerts: Map<string, Alert> = new Map();

  /**
   * Create incident
   */
  async createIncident(
    data: Omit<Incident, "id" | "createdAt" | "updatedAt">,
  ): Promise<Incident> {
    const incident: Incident = {
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.incidents.set(incident.id, incident);
    return incident;
  }

  /**
   * Get incident
   */
  async getIncident(id: string): Promise<Incident | null> {
    return this.incidents.get(id) || null;
  }

  /**
   * Update incident
   */
  async updateIncident(
    id: string,
    updates: Partial<Incident>,
  ): Promise<Incident | null> {
    const incident = this.incidents.get(id);
    if (!incident) {
      return null;
    }

    const updated = {
      ...incident,
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.status === "resolved" && !updated.resolvedAt) {
      updated.resolvedAt = new Date();
    }

    this.incidents.set(id, updated);
    return updated;
  }

  /**
   * Create alert
   */
  async createAlert(data: Omit<Alert, "id" | "createdAt">): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      ...data,
      createdAt: new Date(),
    };

    this.alerts.set(alert.id, alert);

    // Auto-create incident for critical alerts
    if (alert.severity === "critical" && !alert.incidentId) {
      const incident = await this.createIncident({
        title: `Critical Alert: ${alert.message}`,
        description: alert.message,
        severity: "critical",
        status: "open",
        metadata: { alertId: alert.id, source: alert.source },
      });
      alert.incidentId = incident.id;
    }

    return alert;
  }

  /**
   * Get incidents with filters
   */
  async getIncidents(filters?: {
    warehouseId?: string;
    severity?: string;
    status?: string;
    location?: string;
    limit?: number;
  }): Promise<Incident[]> {
    let incidents = Array.from(this.incidents.values());

    // Apply filters
    if (filters) {
      if (filters.warehouseId) {
        incidents = incidents.filter(
          (i) => i.metadata?.warehouseId === filters.warehouseId,
        );
      }
      if (filters.severity) {
        incidents = incidents.filter((i) => i.severity === filters.severity);
      }
      if (filters.status) {
        incidents = incidents.filter((i) => i.status === filters.status);
      }
      if (filters.location) {
        incidents = incidents.filter(
          (i) => i.metadata?.location === filters.location,
        );
      }
      if (filters.limit) {
        incidents = incidents.slice(0, filters.limit);
      }
    }

    // Sort by created date (newest first)
    return incidents.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  /**
   * Get active incidents
   */
  async getActiveIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values()).filter(
      (i) => i.status !== "closed" && i.status !== "resolved",
    );
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (a) => a.status === "active",
    );
  }
}

export const incidentService = new IncidentService();
