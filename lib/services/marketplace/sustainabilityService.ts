/**
 * Marketplace Sustainability Service
 * Track and promote sustainable practices
 * Carbon footprint, ESG metrics, green certifications
 */

export interface SustainabilityMetrics {
  providerId: string;
  carbonFootprint: {
    totalCO2: number; // kg CO2
    perBooking: number; // kg CO2 per booking
    reduction: number; // % reduction vs baseline
  };
  energyEfficiency: {
    renewableEnergyUsage: number; // %
    energyConsumption: number; // kWh
    efficiencyScore: number; // 0-100
  };
  wasteManagement: {
    wasteReduction: number; // %
    recyclingRate: number; // %
    wasteScore: number; // 0-100
  };
  waterConservation: {
    waterUsage: number; // liters
    waterReduction: number; // %
    waterScore: number; // 0-100
  };
  certifications: string[]; // 'ISO_14001', 'LEED', 'GREEN_BUILDING', etc.
  esgScore: number; // 0-100
  lastUpdated: string;
}

export interface CarbonOffset {
  id: string;
  bookingId: string;
  providerId: string;
  co2Amount: number; // kg CO2
  offsetMethod:
    | "TREE_PLANTING"
    | "RENEWABLE_ENERGY"
    | "CARBON_CREDIT"
    | "OTHER";
  offsetProject?: string;
  cost: number;
  status: "PENDING" | "COMPLETED" | "VERIFIED";
  verifiedAt?: string;
  certificateUrl?: string;
  createdAt: string;
}

// In-memory storage
const sustainabilityMetrics: Map<string, SustainabilityMetrics> = new Map();
const carbonOffsets: Map<string, CarbonOffset> = new Map();

export class SustainabilityService {
  /**
   * Calculate carbon footprint for booking
   */
  async calculateCarbonFootprint(
    bookingId: string,
    serviceCategory: string,
    distance?: number,
    duration?: number,
  ): Promise<number> {
    // Carbon footprint calculation based on service category
    const emissionFactors: Record<string, number> = {
      STORAGE: 0.5, // kg CO2 per day per m³
      TRANSPORTATION: 0.2, // kg CO2 per km
      FREIGHT: 0.15, // kg CO2 per km (more efficient)
      CROSSDOCKING: 0.3, // kg CO2 per operation
      CONSULTING: 0.1, // kg CO2 per hour (mostly travel)
      MANPOWER: 0.05, // kg CO2 per hour
      TRANSLATION: 0.02, // kg CO2 per hour (minimal)
    };

    const baseFactor = emissionFactors[serviceCategory] || 0.1;

    if (serviceCategory === "TRANSPORTATION" || serviceCategory === "FREIGHT") {
      return (distance || 100) * baseFactor;
    } else if (serviceCategory === "STORAGE") {
      return (duration || 30) * baseFactor;
    } else {
      return (duration || 1) * baseFactor;
    }
  }

  /**
   * Get or create sustainability metrics for provider
   */
  async getSustainabilityMetrics(
    providerId: string,
  ): Promise<SustainabilityMetrics> {
    let metrics = sustainabilityMetrics.get(providerId);

    if (!metrics) {
      metrics = {
        providerId,
        carbonFootprint: {
          totalCO2: 0,
          perBooking: 0,
          reduction: 0,
        },
        energyEfficiency: {
          renewableEnergyUsage: 0,
          energyConsumption: 0,
          efficiencyScore: 0,
        },
        wasteManagement: {
          wasteReduction: 0,
          recyclingRate: 0,
          wasteScore: 0,
        },
        waterConservation: {
          waterUsage: 0,
          waterReduction: 0,
          waterScore: 0,
        },
        certifications: [],
        esgScore: 0,
        lastUpdated: new Date().toISOString(),
      };
      sustainabilityMetrics.set(providerId, metrics);
    }

    return metrics;
  }

  /**
   * Update sustainability metrics
   */
  async updateSustainabilityMetrics(
    providerId: string,
    updates: Partial<SustainabilityMetrics>,
  ): Promise<SustainabilityMetrics> {
    const metrics = await this.getSustainabilityMetrics(providerId);

    const updated = {
      ...metrics,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    // Calculate ESG score
    updated.esgScore = this.calculateESGScore(updated);

    sustainabilityMetrics.set(providerId, updated);
    return updated;
  }

  /**
   * Calculate ESG score
   */
  private calculateESGScore(metrics: SustainabilityMetrics): number {
    const carbonScore = Math.max(
      0,
      100 - (metrics.carbonFootprint.totalCO2 / 1000) * 10,
    );
    const energyScore = metrics.energyEfficiency.efficiencyScore;
    const wasteScore = metrics.wasteManagement.wasteScore;
    const waterScore = metrics.waterConservation.waterScore;
    const certBonus = metrics.certifications.length * 5;

    return Math.min(
      100,
      carbonScore * 0.3 +
        energyScore * 0.25 +
        wasteScore * 0.25 +
        waterScore * 0.2 +
        certBonus,
    );
  }

  /**
   * Create carbon offset
   */
  async createCarbonOffset(
    bookingId: string,
    providerId: string,
    co2Amount: number,
    offsetMethod: CarbonOffset["offsetMethod"] = "TREE_PLANTING",
  ): Promise<CarbonOffset> {
    const offsetId = `offset_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Calculate cost (approximately $10 per ton of CO2)
    const cost = (co2Amount / 1000) * 10 * 3.75; // Convert to SAR

    const offset: CarbonOffset = {
      id: offsetId,
      bookingId,
      providerId,
      co2Amount,
      offsetMethod,
      cost,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    carbonOffsets.set(offsetId, offset);

    // Simulate offset processing
    setTimeout(async () => {
      const completedOffset = carbonOffsets.get(offsetId);
      if (completedOffset) {
        completedOffset.status = "COMPLETED";
        completedOffset.verifiedAt = new Date().toISOString();
        completedOffset.certificateUrl = `/api/marketplace/sustainability/offsets/${offsetId}/certificate`;
        carbonOffsets.set(offsetId, completedOffset);
      }
    }, 5000);

    return offset;
  }

  /**
   * Get carbon offsets for provider
   */
  async getProviderCarbonOffsets(providerId: string): Promise<CarbonOffset[]> {
    return Array.from(carbonOffsets.values()).filter(
      (o) => o.providerId === providerId,
    );
  }

  /**
   * Get sustainability leaderboard
   */
  async getSustainabilityLeaderboard(limit: number = 10): Promise<
    Array<{
      providerId: string;
      providerName: string;
      esgScore: number;
      carbonReduction: number;
      certifications: string[];
    }>
  > {
    const allMetrics = Array.from(sustainabilityMetrics.values());

    return allMetrics
      .sort((a, b) => b.esgScore - a.esgScore)
      .slice(0, limit)
      .map((metrics) => ({
        providerId: metrics.providerId,
        providerName: "Provider", // Would fetch from provider service
        esgScore: metrics.esgScore,
        carbonReduction: metrics.carbonFootprint.reduction,
        certifications: metrics.certifications,
      }));
  }

  /**
   * Add certification
   */
  async addCertification(
    providerId: string,
    certification: string,
  ): Promise<SustainabilityMetrics> {
    const metrics = await this.getSustainabilityMetrics(providerId);

    if (!metrics.certifications.includes(certification)) {
      metrics.certifications.push(certification);
      metrics.esgScore = this.calculateESGScore(metrics);
      metrics.lastUpdated = new Date().toISOString();
      sustainabilityMetrics.set(providerId, metrics);
    }

    return metrics;
  }
}

// Singleton instance
export const sustainabilityService = new SustainabilityService();
