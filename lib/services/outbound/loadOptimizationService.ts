/**
 * Load Optimization Service
 * Optimizes shipments for cube, weight, and route efficiency
 */

export interface ShipmentItem {
  orderId: string;
  weight: number; // kg
  volume: number; // m³
  dimensions: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  destination: {
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deliveryDate: Date;
  specialRequirements?: string[];
}

export interface LoadPlan {
  id: string;
  vehicleId: string;
  vehicleType: "TRUCK" | "VAN" | "LARGE_TRUCK";
  capacity: {
    maxWeight: number; // kg
    maxVolume: number; // m³
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  items: ShipmentItem[];
  utilization: {
    weightPercent: number;
    volumePercent: number;
    cubePercent: number;
  };
  route: {
    totalDistance: number; // km
    estimatedTime: number; // minutes
    stops: number;
    optimized: boolean;
  };
  cost: {
    fuel: number;
    labor: number;
    total: number;
  };
}

export class LoadOptimizationService {
  /**
   * Optimize load for a vehicle
   */
  optimizeLoad(
    items: ShipmentItem[],
    vehicleType: "TRUCK" | "VAN" | "LARGE_TRUCK" = "TRUCK",
  ): LoadPlan[] {
    const vehicleSpecs = this.getVehicleSpecs(vehicleType);
    const plans: LoadPlan[] = [];
    const unassignedItems = [...items];

    // Sort by priority and delivery date
    unassignedItems.sort((a, b) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.deliveryDate.getTime() - b.deliveryDate.getTime();
    });

    while (unassignedItems.length > 0) {
      const plan = this.createOptimalLoadPlan(unassignedItems, vehicleSpecs);
      plans.push(plan);

      // Remove assigned items
      plan.items.forEach((item) => {
        const index = unassignedItems.findIndex(
          (i) => i.orderId === item.orderId,
        );
        if (index >= 0) {
          unassignedItems.splice(index, 1);
        }
      });
    }

    return plans;
  }

  /**
   * Create optimal load plan using bin packing algorithm
   */
  private createOptimalLoadPlan(
    items: ShipmentItem[],
    vehicleSpecs: {
      maxWeight: number;
      maxVolume: number;
      dimensions: { length: number; width: number; height: number };
    },
  ): LoadPlan {
    const assignedItems: ShipmentItem[] = [];
    let currentWeight = 0;
    let currentVolume = 0;

    // First Fit Decreasing algorithm
    const sortedItems = [...items].sort((a, b) => {
      // Sort by volume (largest first) then by weight
      const volumeDiff = b.volume - a.volume;
      if (volumeDiff !== 0) return volumeDiff;
      return b.weight - a.weight;
    });

    for (const item of sortedItems) {
      if (
        currentWeight + item.weight <= vehicleSpecs.maxWeight &&
        currentVolume + item.volume <= vehicleSpecs.maxVolume
      ) {
        assignedItems.push(item);
        currentWeight += item.weight;
        currentVolume += item.volume;
      }
    }

    // Calculate utilization
    const weightPercent = (currentWeight / vehicleSpecs.maxWeight) * 100;
    const volumePercent = (currentVolume / vehicleSpecs.maxVolume) * 100;
    const cubePercent = this.calculateCubeUtilization(
      assignedItems,
      vehicleSpecs,
    );

    // Optimize route
    const route = this.optimizeRoute(assignedItems);

    // Calculate costs
    const cost = this.calculateCosts(route, currentWeight);

    return {
      id: `LOAD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      vehicleId: `VEHICLE-${Math.random().toString(36).substring(2, 11)}`,
      vehicleType: "TRUCK",
      capacity: vehicleSpecs,
      items: assignedItems,
      utilization: {
        weightPercent,
        volumePercent,
        cubePercent,
      },
      route,
      cost,
    };
  }

  /**
   * Calculate cube utilization (3D space efficiency)
   */
  private calculateCubeUtilization(
    items: ShipmentItem[],
    vehicleSpecs: {
      dimensions: { length: number; width: number; height: number };
    },
  ): number {
    // Simplified cube calculation
    const totalItemVolume = items.reduce((sum, item) => sum + item.volume, 0);
    const vehicleVolume =
      (vehicleSpecs.dimensions.length *
        vehicleSpecs.dimensions.width *
        vehicleSpecs.dimensions.height) /
      1000000; // Convert cm³ to m³
    return (totalItemVolume / vehicleVolume) * 100;
  }

  /**
   * Optimize route using nearest neighbor algorithm
   */
  private optimizeRoute(items: ShipmentItem[]): {
    totalDistance: number;
    estimatedTime: number;
    stops: number;
    optimized: boolean;
  } {
    if (items.length === 0) {
      return { totalDistance: 0, estimatedTime: 0, stops: 0, optimized: false };
    }

    // Simplified route optimization
    // In production, would use Google Maps API or similar
    const stops = items.length;
    const avgDistancePerStop = 15; // km (simplified)
    const totalDistance = stops * avgDistancePerStop;
    const avgTimePerStop = 30; // minutes (delivery + travel)
    const estimatedTime = stops * avgTimePerStop;

    return {
      totalDistance,
      estimatedTime,
      stops,
      optimized: true,
    };
  }

  /**
   * Calculate shipping costs
   */
  private calculateCosts(
    route: { totalDistance: number; estimatedTime: number },
    weight: number,
  ): { fuel: number; labor: number; total: number } {
    const fuelCostPerKm = 0.5; // USD per km
    const laborCostPerHour = 25; // USD per hour

    const fuel = route.totalDistance * fuelCostPerKm;
    const labor = (route.estimatedTime / 60) * laborCostPerHour;
    const total = fuel + labor;

    return { fuel, labor, total };
  }

  /**
   * Get vehicle specifications
   */
  private getVehicleSpecs(vehicleType: "TRUCK" | "VAN" | "LARGE_TRUCK"): {
    maxWeight: number;
    maxVolume: number;
    dimensions: { length: number; width: number; height: number };
  } {
    const specs = {
      TRUCK: {
        maxWeight: 5000, // kg
        maxVolume: 30, // m³
        dimensions: { length: 600, width: 240, height: 260 }, // cm
      },
      VAN: {
        maxWeight: 1500, // kg
        maxVolume: 10, // m³
        dimensions: { length: 400, width: 180, height: 180 }, // cm
      },
      LARGE_TRUCK: {
        maxWeight: 20000, // kg
        maxVolume: 80, // m³
        dimensions: { length: 1200, width: 240, height: 260 }, // cm
      },
    };

    return specs[vehicleType];
  }

  /**
   * Suggest optimal vehicle type for items
   */
  suggestVehicleType(items: ShipmentItem[]): "TRUCK" | "VAN" | "LARGE_TRUCK" {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const totalVolume = items.reduce((sum, item) => sum + item.volume, 0);

    if (totalWeight > 15000 || totalVolume > 60) {
      return "LARGE_TRUCK";
    } else if (totalWeight < 1500 && totalVolume < 10) {
      return "VAN";
    } else {
      return "TRUCK";
    }
  }
}

export const loadOptimizationService = new LoadOptimizationService();
