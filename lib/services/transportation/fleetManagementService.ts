/**
 * Fleet Management Service
 *
 * Fleet optimization, vehicle assignment, maintenance scheduling,
 * fuel management
 * Integrates with IoT and compliance services
 */

import type { Shipment } from "@/types/tms";
import { transportationIoTIntegrationService } from "./iotIntegrationService";
import { transportationComplianceService } from "./complianceService";
import { eventBus } from "@/lib/services/event-store";

export interface FleetVehicle {
  id: string;
  plateNumber: string;
  type: "TRUCK" | "TRAILER" | "VAN" | "CONTAINER";
  capacity: {
    weight: number; // kg
    volume: number; // m³
    pallets?: number;
  };
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OFFLINE";
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  driverId?: string;
  driverName?: string;
  maintenance: {
    lastService?: Date | string;
    nextService?: Date | string;
    mileage?: number;
    serviceHistory: MaintenanceRecord[];
  };
  fuel: {
    currentLevel?: number; // %
    consumptionRate?: number; // L/100km
    lastRefuel?: Date | string;
  };
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: "ROUTINE" | "REPAIR" | "INSPECTION" | "EMERGENCY";
  description: string;
  cost: number;
  date: Date | string;
  mileage?: number;
  nextServiceDue?: Date | string;
}

export interface FleetOptimization {
  vehicles: FleetVehicle[];
  assignments: {
    vehicleId: string;
    shipmentId: string;
    score: number;
    reason: string;
  }[];
  utilization: number; // %
  recommendations: string[];
}

export class FleetManagementService {
  private vehicles: Map<string, FleetVehicle> = new Map();
  private maintenanceRecords: Map<string, MaintenanceRecord[]> = new Map();

  /**
   * Optimize fleet assignment
   */
  async optimizeFleetAssignment(
    shipments: Shipment[],
  ): Promise<FleetOptimization> {
    const availableVehicles = Array.from(this.vehicles.values()).filter(
      (v) => v.status === "AVAILABLE",
    );

    const assignments: FleetOptimization["assignments"] = [];

    for (const shipment of shipments) {
      // Find best vehicle for shipment
      const bestVehicle = await this.findBestVehicle(
        shipment,
        availableVehicles,
      );
      if (bestVehicle) {
        assignments.push({
          vehicleId: bestVehicle.id,
          shipmentId: shipment.id,
          score: await this.calculateAssignmentScore(bestVehicle, shipment),
          reason: this.generateAssignmentReason(bestVehicle, shipment),
        });

        // Mark vehicle as in use
        bestVehicle.status = "IN_USE";
        this.vehicles.set(bestVehicle.id, bestVehicle);
      }
    }

    // Calculate utilization
    const utilization = this.calculateUtilization(
      availableVehicles,
      assignments,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      availableVehicles,
      assignments,
    );

    return {
      vehicles: availableVehicles,
      assignments,
      utilization,
      recommendations,
    };
  }

  /**
   * Schedule maintenance
   */
  async scheduleMaintenance(
    vehicleId: string,
    maintenance: Omit<MaintenanceRecord, "id" | "vehicleId">,
  ): Promise<string> {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    const recordId = `maintenance-${vehicleId}-${Date.now()}`;
    const record: MaintenanceRecord = {
      id: recordId,
      vehicleId,
      ...maintenance,
    };

    const records = this.maintenanceRecords.get(vehicleId) || [];
    records.push(record);
    this.maintenanceRecords.set(vehicleId, records);

    // Update vehicle
    vehicle.maintenance.lastService = maintenance.date;
    vehicle.maintenance.nextService = maintenance.nextServiceDue;
    if (maintenance.mileage) {
      vehicle.maintenance.mileage = maintenance.mileage;
    }
    vehicle.maintenance.serviceHistory = records;

    if (maintenance.type === "EMERGENCY" || maintenance.type === "REPAIR") {
      vehicle.status = "MAINTENANCE";
    }

    this.vehicles.set(vehicleId, vehicle);

    await eventBus.publish("transportation.fleet.maintenance.scheduled", {
      vehicleId,
      recordId,
      type: maintenance.type,
    });

    return recordId;
  }

  /**
   * Get predictive maintenance recommendations
   */
  async getPredictiveMaintenance(): Promise<
    Array<{
      vehicleId: string;
      vehicle: FleetVehicle;
      recommendation: string;
      urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      predictedFailureDate?: Date | string;
    }>
  > {
    const recommendations: Array<{
      vehicleId: string;
      vehicle: FleetVehicle;
      recommendation: string;
      urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      predictedFailureDate?: Date | string;
    }> = [];

    for (const vehicle of this.vehicles.values()) {
      // Check maintenance schedule
      if (vehicle.maintenance.nextService) {
        const daysUntilService = Math.floor(
          (new Date(vehicle.maintenance.nextService).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysUntilService < 7) {
          recommendations.push({
            vehicleId: vehicle.id,
            vehicle,
            recommendation: `Scheduled maintenance due in ${daysUntilService} days`,
            urgency: daysUntilService < 3 ? "HIGH" : "MEDIUM",
            predictedFailureDate: vehicle.maintenance.nextService,
          });
        }
      }

      // Check mileage-based maintenance
      if (vehicle.maintenance.mileage && vehicle.maintenance.mileage > 100000) {
        recommendations.push({
          vehicleId: vehicle.id,
          vehicle,
          recommendation: "High mileage - consider major service",
          urgency: "MEDIUM",
        });
      }

      // Get IoT data for predictive maintenance
      const iotData = await transportationIoTIntegrationService.getSensorData(
        `vehicle-${vehicle.id}`,
      );
      if (iotData && iotData.sensors) {
        // Check for anomalies that might indicate maintenance needs
        if (iotData.sensors.vibration && iotData.sensors.vibration > 5) {
          recommendations.push({
            vehicleId: vehicle.id,
            vehicle,
            recommendation:
              "High vibration detected - check engine and suspension",
            urgency: "HIGH",
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Track fuel consumption
   */
  async trackFuelConsumption(
    vehicleId: string,
    distance: number, // km
    fuelUsed: number, // L
  ): Promise<void> {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return;

    const consumptionRate = (fuelUsed / distance) * 100; // L/100km
    vehicle.fuel.consumptionRate = consumptionRate;
    vehicle.fuel.currentLevel = vehicle.fuel.currentLevel
      ? vehicle.fuel.currentLevel - fuelUsed / 100
      : undefined;

    this.vehicles.set(vehicleId, vehicle);

    await eventBus.publish("transportation.fleet.fuel.tracked", {
      vehicleId,
      consumptionRate,
      distance,
      fuelUsed,
    });
  }

  /**
   * Find best vehicle for shipment
   */
  private async findBestVehicle(
    shipment: Shipment,
    availableVehicles: FleetVehicle[],
  ): Promise<FleetVehicle | null> {
    // Filter by capacity
    const suitableVehicles = availableVehicles.filter((v) => {
      return (
        v.capacity.weight >= shipment.totalWeight &&
        v.capacity.volume >= shipment.totalVolume
      );
    });

    if (suitableVehicles.length === 0) return null;

    // Score vehicles
    const scored = await Promise.all(
      suitableVehicles.map(async (v) => ({
        vehicle: v,
        score: await this.calculateVehicleScore(v, shipment),
      })),
    );

    // Return best match
    scored.sort((a, b) => b.score - a.score);
    return scored[0].vehicle;
  }

  /**
   * Calculate vehicle score
   */
  private async calculateVehicleScore(
    vehicle: FleetVehicle,
    shipment: Shipment,
  ): Promise<number> {
    let score = 50;

    // Capacity utilization (better to use more of capacity)
    const weightUtilization = shipment.totalWeight / vehicle.capacity.weight;
    const volumeUtilization = shipment.totalVolume / vehicle.capacity.volume;
    const avgUtilization = (weightUtilization + volumeUtilization) / 2;
    score += avgUtilization * 30; // Up to 30 points

    // Location proximity (if available)
    if (vehicle.currentLocation && shipment.origin.coordinates) {
      const distance = this.calculateDistance(
        vehicle.currentLocation,
        shipment.origin.coordinates,
      );
      // Closer = better
      score += Math.max(0, 20 - distance / 10);
    }

    // Maintenance status
    if (vehicle.status === "AVAILABLE" && !vehicle.maintenance.nextService) {
      score += 10;
    }

    // Fuel efficiency
    if (vehicle.fuel.consumptionRate && vehicle.fuel.consumptionRate < 15) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate assignment score
   */
  private async calculateAssignmentScore(
    vehicle: FleetVehicle,
    shipment: Shipment,
  ): Promise<number> {
    return await this.calculateVehicleScore(vehicle, shipment);
  }

  /**
   * Generate assignment reason
   */
  private generateAssignmentReason(
    vehicle: FleetVehicle,
    shipment: Shipment,
  ): string {
    const reasons: string[] = [];

    const weightUtilization =
      (shipment.totalWeight / vehicle.capacity.weight) * 100;
    if (weightUtilization > 80) {
      reasons.push("Optimal capacity utilization");
    }

    if (vehicle.currentLocation) {
      reasons.push("Proximity to pickup location");
    }

    if (vehicle.fuel.consumptionRate && vehicle.fuel.consumptionRate < 15) {
      reasons.push("Fuel efficient");
    }

    return reasons.join(", ") || "Best available match";
  }

  /**
   * Calculate utilization
   */
  private calculateUtilization(
    vehicles: FleetVehicle[],
    assignments: FleetOptimization["assignments"],
  ): number {
    if (vehicles.length === 0) return 0;
    return (assignments.length / vehicles.length) * 100;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    vehicles: FleetVehicle[],
    assignments: FleetOptimization["assignments"],
  ): string[] {
    const recommendations: string[] = [];

    const utilization = this.calculateUtilization(vehicles, assignments);
    if (utilization > 90) {
      recommendations.push("High fleet utilization - consider adding vehicles");
    } else if (utilization < 50) {
      recommendations.push(
        "Low fleet utilization - consider optimizing routes",
      );
    }

    return recommendations;
  }

  /**
   * Calculate distance
   */
  private calculateDistance(
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLon = this.toRad(loc2.lng - loc1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.lat)) *
        Math.cos(this.toRad(loc2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const fleetManagementService = new FleetManagementService();
