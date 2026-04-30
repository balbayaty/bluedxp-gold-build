/**
 * Ports & Terminals Management Service
 *
 * Manage port operations, terminal activities, and port utilization
 * Integrates with shipment tracking and analytics
 */

import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

export interface Port {
  id: string;
  code: string;
  name: string;
  country: string;
  region?: string;
  type: "SEA" | "AIR" | "RAIL" | "MULTI";
  status: "OPERATIONAL" | "CONGESTED" | "CLOSED" | "MAINTENANCE";
  currentShipments: number;
  containers: number;
  utilizationRate: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
    timezone?: string;
  };
  capacity?: {
    containers?: number;
    shipments?: number;
    berths?: number;
    terminals?: number;
  };
  metadata?: {
    contact?: {
      phone?: string;
      email?: string;
      address?: string;
    };
    facilities?: string[];
    services?: string[];
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  tenantId: string;
}

export interface CreatePortRequest {
  code: string;
  name: string;
  country: string;
  region?: string;
  type: "SEA" | "AIR" | "RAIL" | "MULTI";
  status?: "OPERATIONAL" | "CONGESTED" | "CLOSED" | "MAINTENANCE";
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  operatingHours?: Port["operatingHours"];
  capacity?: Port["capacity"];
  metadata?: Port["metadata"];
  createdBy: string;
  tenantId: string;
}

export interface PortStatistics {
  totalPorts: number;
  operationalPorts: number;
  congestedPorts: number;
  closedPorts: number;
  totalShipments: number;
  totalContainers: number;
  averageUtilization: number;
  portsByType: Record<string, number>;
  portsByCountry: Record<string, number>;
}

export class PortsService {
  private ports: Map<string, Port> = new Map();

  /**
   * Create port
   */
  async createPort(request: CreatePortRequest): Promise<Port> {
    const port: Port = {
      id: `port-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      code: request.code.toUpperCase(),
      name: request.name,
      country: request.country,
      region: request.region,
      type: request.type,
      status: request.status || "OPERATIONAL",
      currentShipments: 0,
      containers: 0,
      utilizationRate: 0,
      location: request.location,
      operatingHours: request.operatingHours,
      capacity: request.capacity,
      metadata: request.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: request.createdBy,
      tenantId: request.tenantId,
    };

    this.ports.set(port.id, port);

    // Publish event
    await eventBus.publish(
      createEvent(
        "transportation.port.created",
        port.id,
        "Port",
        {
          portId: port.id,
          code: port.code,
          name: port.name,
          type: port.type,
        },
        1,
        { tenantId: request.tenantId, userId: request.createdBy },
      ),
    );

    return port;
  }

  /**
   * Get port by ID
   */
  async getPort(portId: string, tenantId: string): Promise<Port | null> {
    const port = this.ports.get(portId);
    if (!port || port.tenantId !== tenantId) {
      return null;
    }
    return port;
  }

  /**
   * Get port by code
   */
  async getPortByCode(code: string, tenantId: string): Promise<Port | null> {
    const port = Array.from(this.ports.values()).find(
      (p) => p.code === code.toUpperCase() && p.tenantId === tenantId,
    );
    return port || null;
  }

  /**
   * Get all ports
   */
  async getPorts(
    tenantId: string,
    filters?: {
      type?: string;
      status?: string;
      country?: string;
    },
  ): Promise<Port[]> {
    let ports = Array.from(this.ports.values()).filter(
      (p) => p.tenantId === tenantId,
    );

    if (filters?.type) {
      ports = ports.filter((p) => p.type === filters.type);
    }
    if (filters?.status) {
      ports = ports.filter((p) => p.status === filters.status);
    }
    if (filters?.country) {
      ports = ports.filter((p) => p.country === filters.country);
    }

    return ports;
  }

  /**
   * Update port
   */
  async updatePort(
    portId: string,
    updates: Partial<Port>,
    tenantId: string,
  ): Promise<Port | null> {
    const port = this.ports.get(portId);
    if (!port || port.tenantId !== tenantId) {
      return null;
    }

    const updated = {
      ...port,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.ports.set(portId, updated);

    await eventBus.publish(
      createEvent(
        "transportation.port.updated",
        portId,
        "Port",
        { portId, updates },
        1,
        { tenantId, userId: "system" },
      ),
    );

    return updated;
  }

  /**
   * Update port utilization
   */
  async updatePortUtilization(
    portId: string,
    currentShipments: number,
    containers: number,
    tenantId: string,
  ): Promise<Port | null> {
    const port = this.ports.get(portId);
    if (!port || port.tenantId !== tenantId) {
      return null;
    }

    const capacity = port.capacity;
    const maxShipments = capacity?.shipments || 100;
    const maxContainers = capacity?.containers || 1000;

    const shipmentUtilization = (currentShipments / maxShipments) * 100;
    const containerUtilization = capacity?.containers
      ? (containers / maxContainers) * 100
      : 0;
    const utilizationRate = capacity?.containers
      ? (shipmentUtilization + containerUtilization) / 2
      : shipmentUtilization;

    // Auto-update status based on utilization
    let status = port.status;
    if (utilizationRate >= 90) {
      status = "CONGESTED";
    } else if (utilizationRate < 90 && port.status === "CONGESTED") {
      status = "OPERATIONAL";
    }

    const updated = {
      ...port,
      currentShipments,
      containers,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      status,
      updatedAt: new Date().toISOString(),
    };

    this.ports.set(portId, updated);

    await eventBus.publish(
      createEvent(
        "transportation.port.utilization.updated",
        portId,
        "Port",
        { portId, currentShipments, containers, utilizationRate, status },
        1,
        { tenantId, userId: "system" },
      ),
    );

    return updated;
  }

  /**
   * Get statistics
   */
  async getStatistics(tenantId: string): Promise<PortStatistics> {
    const ports = Array.from(this.ports.values()).filter(
      (p) => p.tenantId === tenantId,
    );

    const operationalPorts = ports.filter(
      (p) => p.status === "OPERATIONAL",
    ).length;
    const congestedPorts = ports.filter((p) => p.status === "CONGESTED").length;
    const closedPorts = ports.filter(
      (p) => p.status === "CLOSED" || p.status === "MAINTENANCE",
    ).length;
    const totalShipments = ports.reduce(
      (sum, p) => sum + p.currentShipments,
      0,
    );
    const totalContainers = ports.reduce((sum, p) => sum + p.containers, 0);
    const averageUtilization =
      ports.length > 0
        ? ports.reduce((sum, p) => sum + p.utilizationRate, 0) / ports.length
        : 0;

    const portsByType: Record<string, number> = {};
    const portsByCountry: Record<string, number> = {};

    for (const port of ports) {
      portsByType[port.type] = (portsByType[port.type] || 0) + 1;
      portsByCountry[port.country] = (portsByCountry[port.country] || 0) + 1;
    }

    return {
      totalPorts: ports.length,
      operationalPorts,
      congestedPorts,
      closedPorts,
      totalShipments,
      totalContainers,
      averageUtilization: Math.round(averageUtilization * 100) / 100,
      portsByType,
      portsByCountry,
    };
  }
}

export const portsService = new PortsService();
