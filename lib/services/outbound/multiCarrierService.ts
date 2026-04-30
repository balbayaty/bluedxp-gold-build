/**
 * Multi-Carrier Shipping Service
 * Integrates with multiple carriers (Wajeeh, DHL, FedEx, Aramex, etc.)
 */

export interface Carrier {
  id: string;
  name: string;
  code: string;
  type: "LOCAL" | "INTERNATIONAL" | "EXPRESS" | "ECONOMY";
  supportedServices: string[];
  cutoffTime: string; // HH:mm format
  apiEndpoint?: string;
  apiKey?: string;
  enabled: boolean;
}

export interface ShippingRate {
  carrier: string;
  service: string;
  cost: number;
  currency: string;
  estimatedDays: number;
  estimatedDelivery: Date;
  trackingAvailable: boolean;
}

export interface ShipmentRequest {
  origin: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  destination: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  weight: number; // kg
  dimensions: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  value: number; // USD
  serviceType?: "STANDARD" | "EXPRESS" | "OVERNIGHT";
  insurance?: boolean;
}

export interface ShipmentLabel {
  carrier: string;
  trackingNumber: string;
  labelUrl: string;
  labelData: string; // Base64 encoded PDF
  barcode: string;
  qrCode?: string;
}

export class MultiCarrierService {
  private carriers: Carrier[] = [
    {
      id: "wajeeh",
      name: "Wajeeh",
      code: "WAJEEH",
      type: "LOCAL",
      supportedServices: ["STANDARD", "EXPRESS"],
      cutoffTime: "15:00",
      enabled: true,
    },
    {
      id: "dhl",
      name: "DHL Express",
      code: "DHL",
      type: "INTERNATIONAL",
      supportedServices: ["EXPRESS", "OVERNIGHT", "ECONOMY"],
      cutoffTime: "17:00",
      enabled: true,
    },
    {
      id: "fedex",
      name: "FedEx",
      code: "FEDEX",
      type: "INTERNATIONAL",
      supportedServices: ["EXPRESS", "OVERNIGHT", "GROUND"],
      cutoffTime: "16:00",
      enabled: true,
    },
    {
      id: "aramex",
      name: "Aramex",
      code: "ARAMEX",
      type: "INTERNATIONAL",
      supportedServices: ["STANDARD", "EXPRESS"],
      cutoffTime: "14:00",
      enabled: true,
    },
    {
      id: "smsa",
      name: "SMSA Express",
      code: "SMSA",
      type: "LOCAL",
      supportedServices: ["STANDARD", "EXPRESS"],
      cutoffTime: "15:30",
      enabled: true,
    },
  ];

  /**
   * Get all enabled carriers
   */
  getCarriers(): Carrier[] {
    return this.carriers.filter((c) => c.enabled);
  }

  /**
   * Get rates from all carriers
   */
  async getRates(request: ShipmentRequest): Promise<ShippingRate[]> {
    const rates: ShippingRate[] = [];

    for (const carrier of this.getCarriers()) {
      try {
        const rate = await this.getCarrierRate(carrier, request);
        if (rate) {
          rates.push(rate);
        }
      } catch (error) {
        console.error(`Error getting rate from ${carrier.name}:`, error);
      }
    }

    // Sort by cost
    return rates.sort((a, b) => a.cost - b.cost);
  }

  /**
   * Get rate from specific carrier
   */
  private async getCarrierRate(
    carrier: Carrier,
    request: ShipmentRequest,
  ): Promise<ShippingRate | null> {
    // Mock implementation - in production would call carrier API
    const baseCost = this.calculateBaseCost(request.weight, request.dimensions);
    const multiplier = this.getCarrierMultiplier(carrier.code);
    const serviceMultiplier =
      request.serviceType === "EXPRESS"
        ? 1.5
        : request.serviceType === "OVERNIGHT"
          ? 2.0
          : 1.0;

    const cost = baseCost * multiplier * serviceMultiplier;
    const estimatedDays = this.getEstimatedDays(carrier, request);

    return {
      carrier: carrier.name,
      service: request.serviceType || "STANDARD",
      cost: Math.round(cost * 100) / 100,
      currency: "SAR",
      estimatedDays,
      estimatedDelivery: new Date(
        Date.now() + estimatedDays * 24 * 60 * 60 * 1000,
      ),
      trackingAvailable: true,
    };
  }

  /**
   * Create shipment and get label
   */
  async createShipment(
    carrierId: string,
    request: ShipmentRequest,
  ): Promise<ShipmentLabel> {
    const carrier = this.carriers.find((c) => c.id === carrierId);
    if (!carrier || !carrier.enabled) {
      throw new Error(`Carrier ${carrierId} not found or disabled`);
    }

    // Mock implementation - in production would call carrier API
    const trackingNumber = this.generateTrackingNumber(carrier.code);

    return {
      carrier: carrier.name,
      trackingNumber,
      labelUrl: `https://labels.example.com/${trackingNumber}`,
      labelData: "BASE64_ENCODED_PDF_DATA", // Would be actual PDF
      barcode: trackingNumber,
      qrCode: `https://tracking.example.com/${trackingNumber}`,
    };
  }

  /**
   * Track shipment
   */
  async trackShipment(carrierId: string, trackingNumber: string): Promise<any> {
    const carrier = this.carriers.find((c) => c.id === carrierId);
    if (!carrier) {
      throw new Error(`Carrier ${carrierId} not found`);
    }

    // Mock implementation - in production would call carrier API
    return {
      trackingNumber,
      status: "IN_TRANSIT",
      currentLocation: "Riyadh Distribution Center",
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      history: [
        {
          date: new Date(),
          location: "Riyadh Distribution Center",
          status: "IN_TRANSIT",
        },
      ],
    };
  }

  /**
   * Calculate base shipping cost
   */
  private calculateBaseCost(
    weight: number,
    dimensions: {
      length: number;
      width: number;
      height: number;
    },
  ): number {
    const volume =
      (dimensions.length * dimensions.width * dimensions.height) / 1000000; // m³
    const volumetricWeight = volume * 167; // kg (standard conversion)
    const chargeableWeight = Math.max(weight, volumetricWeight);

    return chargeableWeight * 5; // Base rate per kg
  }

  /**
   * Get carrier cost multiplier
   */
  private getCarrierMultiplier(carrierCode: string): number {
    const multipliers: Record<string, number> = {
      WAJEEH: 1.0,
      SMSA: 1.1,
      ARAMEX: 1.3,
      DHL: 1.5,
      FEDEX: 1.6,
    };
    return multipliers[carrierCode] || 1.0;
  }

  /**
   * Get estimated delivery days
   */
  private getEstimatedDays(carrier: Carrier, request: ShipmentRequest): number {
    if (request.serviceType === "OVERNIGHT") return 1;
    if (request.serviceType === "EXPRESS") return 2;
    if (carrier.type === "LOCAL") return 2;
    if (request.destination.country !== request.origin.country) return 5;
    return 3;
  }

  /**
   * Generate tracking number
   */
  private generateTrackingNumber(carrierCode: string): string {
    const prefix = carrierCode.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 11).toUpperCase();
    return `${prefix}${random}`;
  }
}

export const multiCarrierService = new MultiCarrierService();
