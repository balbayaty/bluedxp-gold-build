/**
 * Maersk API Integration
 *
 * Official Maersk API integration for:
 * - Rate quoting
 * - Booking
 * - Tracking
 * - Documentation
 */

import type {
  MultimodalLeg,
  CarrierQuote,
  CarrierBooking,
} from "../carrierIntegrations";

export interface MaerskConfig {
  apiKey: string;
  apiSecret?: string;
  environment: "sandbox" | "production";
  baseUrl?: string;
}

export interface MaerskQuoteRequest {
  origin: {
    code: string; // Port code (e.g., 'USNYC')
    city?: string;
    country: string;
  };
  destination: {
    code: string; // Port code
    city?: string;
    country: string;
  };
  cargo: {
    weight: number; // kg
    volume: number; // m³
    containers?: Array<{
      type: "20FT" | "40FT" | "40HC" | "45HC";
      quantity: number;
    }>;
  };
  serviceType?: "FCL" | "LCL";
  departureDate?: string; // ISO date
}

export interface MaerskQuoteResponse {
  quoteId: string;
  service: string;
  transitTime: number; // days
  cost: {
    amount: number;
    currency: string;
    breakdown: Array<{
      type: string;
      amount: number;
      currency: string;
    }>;
  };
  validUntil: string; // ISO date
  terms: string[];
}

/**
 * Maersk API Client
 */
export class MaerskApiClient {
  private config: MaerskConfig;

  constructor(config: MaerskConfig) {
    this.config = {
      ...config,
      baseUrl:
        config.baseUrl ||
        (config.environment === "production"
          ? "https://api.maersk.com"
          : "https://api-sandbox.maersk.com"),
    };
  }

  /**
   * Get quote from Maersk
   */
  async getQuote(
    request: MaerskQuoteRequest,
  ): Promise<MaerskQuoteResponse | null> {
    try {
      const url = `${this.config.baseUrl}/v1/quotes`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          origin: {
            location: request.origin.code,
            country: request.origin.country,
          },
          destination: {
            location: request.destination.code,
            country: request.destination.country,
          },
          cargo: {
            weight: request.cargo.weight,
            volume: request.cargo.volume,
            containers: request.cargo.containers,
          },
          serviceType: request.serviceType || "FCL",
          departureDate: request.departureDate,
        }),
      });

      if (!response.ok) {
        console.error(
          "Maersk API error:",
          response.status,
          await response.text(),
        );
        return null;
      }

      const data = await response.json();

      return {
        quoteId: data.quoteId || `MAERSK-${Date.now()}`,
        service: data.service || "Standard",
        transitTime: data.transitTime || 0,
        cost: {
          amount: data.cost?.amount || 0,
          currency: data.cost?.currency || "USD",
          breakdown: data.cost?.breakdown || [],
        },
        validUntil:
          data.validUntil ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        terms: data.terms || [],
      };
    } catch (error) {
      console.error("Maersk API error:", error);
      return null;
    }
  }

  /**
   * Create booking
   */
  async createBooking(
    quoteId: string,
    bookingDetails: any,
  ): Promise<CarrierBooking | null> {
    try {
      const url = `${this.config.baseUrl}/v1/bookings`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          quoteId,
          ...bookingDetails,
        }),
      });

      if (!response.ok) {
        console.error(
          "Maersk booking error:",
          response.status,
          await response.text(),
        );
        return null;
      }

      const data = await response.json();

      return {
        bookingNumber: data.bookingNumber || `MAERSK-BKG-${Date.now()}`,
        carrierId: "maersk",
        status: data.status === "confirmed" ? "CONFIRMED" : "PENDING",
        confirmationDetails: data,
      };
    } catch (error) {
      console.error("Maersk booking error:", error);
      return null;
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      const url = `${this.config.baseUrl}/v1/tracking/${trackingNumber}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Maersk tracking error:", error);
      return null;
    }
  }

  /**
   * Convert leg to Maersk quote request
   */
  static legToQuoteRequest(leg: MultimodalLeg): MaerskQuoteRequest {
    return {
      origin: {
        code:
          leg.origin.portCode || leg.origin.city.substring(0, 5).toUpperCase(),
        city: leg.origin.city,
        country: leg.origin.country,
      },
      destination: {
        code:
          leg.destination.portCode ||
          leg.destination.city.substring(0, 5).toUpperCase(),
        city: leg.destination.city,
        country: leg.destination.country,
      },
      cargo: {
        weight: leg.totalWeight,
        volume: leg.totalVolume,
        containers: leg.containers,
      },
      serviceType: leg.serviceType === "FCL" ? "FCL" : "LCL",
      departureDate: leg.plannedDeparture,
    };
  }
}

/**
 * Get Maersk client instance
 */
export function getMaerskClient(): MaerskApiClient | null {
  const apiKey = process.env.MAERSK_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new MaerskApiClient({
    apiKey,
    environment:
      (process.env.MAERSK_ENVIRONMENT as "sandbox" | "production") || "sandbox",
  });
}
