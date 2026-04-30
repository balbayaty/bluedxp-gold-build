/**
 * FedEx API Integration
 *
 * Official FedEx API integration for:
 * - Rate quoting
 * - Booking
 * - Tracking
 * - Documentation
 *
 * API Documentation: https://developer.fedex.com/
 * Developer Portal: https://developer.fedex.com/
 * API Reference: https://developer.fedex.com/api-reference
 */

import type {
  MultimodalLeg,
  CarrierQuote,
  CarrierBooking,
} from "../carrierIntegrations";

export interface FedExConfig {
  apiKey: string;
  apiSecret: string;
  accountNumber: string;
  environment: "sandbox" | "production";
  baseUrl?: string;
}

export interface FedExQuoteRequest {
  origin: {
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  destination: {
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  cargo: {
    weight: number; // kg
    dimensions?: {
      length: number; // cm
      width: number; // cm
      height: number; // cm
    };
    pieces: number;
  };
  serviceType?: "EXPRESS" | "GROUND" | "INTERNATIONAL";
  deliveryDate?: string; // ISO date
}

export interface FedExQuoteResponse {
  quoteId: string;
  service: string;
  transitTime: number; // hours
  cost: {
    amount: number;
    currency: string;
    breakdown: Array<{
      type: string;
      amount: number;
    }>;
  };
  validUntil: string; // ISO date
}

/**
 * FedEx API Client
 */
export class FedExApiClient {
  private config: FedExConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: FedExConfig) {
    this.config = {
      ...config,
      baseUrl:
        config.baseUrl ||
        (config.environment === "production"
          ? "https://apis.fedex.com"
          : "https://apis-sandbox.fedex.com"),
    };
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string | null> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const url = `${this.config.baseUrl}/oauth/token`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.config.apiKey,
          client_secret: this.config.apiSecret,
        }),
      });

      if (!response.ok) {
        console.error("FedEx OAuth error:", response.status);
        return null;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error("FedEx OAuth error:", error);
      return null;
    }
  }

  /**
   * Get quote from FedEx
   */
  async getQuote(
    request: FedExQuoteRequest,
  ): Promise<FedExQuoteResponse | null> {
    const token = await this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const url = `${this.config.baseUrl}/rate/v1/rates/quotes`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-locale": "en_US",
        },
        body: JSON.stringify({
          accountNumber: {
            value: this.config.accountNumber,
          },
          requestedShipment: {
            shipper: {
              address: {
                streetLines: [request.origin.address],
                city: request.origin.city,
                stateOrProvinceCode: request.origin.state,
                postalCode: request.origin.postalCode,
                countryCode: request.origin.country,
              },
            },
            recipients: [
              {
                address: {
                  streetLines: [request.destination.address],
                  city: request.destination.city,
                  stateOrProvinceCode: request.destination.state,
                  postalCode: request.destination.postalCode,
                  countryCode: request.destination.country,
                },
              },
            ],
            rateRequestType: ["ACCOUNT", "LIST"],
            requestedPackageLineItems: [
              {
                weight: {
                  value: request.cargo.weight,
                  units: "KG",
                },
                dimensions: request.cargo.dimensions
                  ? {
                      length: request.cargo.dimensions.length,
                      width: request.cargo.dimensions.width,
                      height: request.cargo.dimensions.height,
                      units: "CM",
                    }
                  : undefined,
              },
            ],
            serviceType: request.serviceType || "EXPRESS",
          },
        }),
      });

      if (!response.ok) {
        console.error(
          "FedEx API error:",
          response.status,
          await response.text(),
        );
        return null;
      }

      const data = await response.json();
      const rateDetails = data.output?.rateReplyDetails?.[0];

      if (!rateDetails) {
        return null;
      }

      return {
        quoteId: `FEDEX-${Date.now()}`,
        service: rateDetails.serviceName || request.serviceType || "EXPRESS",
        transitTime: rateDetails.commit?.transitTime || 0,
        cost: {
          amount:
            rateDetails.ratedShipmentDetails?.[0]?.totalNetCharge?.amount || 0,
          currency:
            rateDetails.ratedShipmentDetails?.[0]?.totalNetCharge?.currency ||
            "USD",
          breakdown:
            rateDetails.ratedShipmentDetails?.[0]?.shipmentRateDetail
              ?.rateZones || [],
        },
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    } catch (error) {
      console.error("FedEx API error:", error);
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
    const token = await this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const url = `${this.config.baseUrl}/ship/v1/shipments`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-locale": "en_US",
        },
        body: JSON.stringify({
          labelResponseOptions: "URL_ONLY",
          requestedShipment: bookingDetails,
        }),
      });

      if (!response.ok) {
        console.error(
          "FedEx booking error:",
          response.status,
          await response.text(),
        );
        return null;
      }

      const data = await response.json();

      return {
        bookingNumber:
          data.output?.transactionShipments?.[0]?.masterTrackingNumber ||
          `FEDEX-${Date.now()}`,
        carrierId: "fedex",
        status:
          data.output?.transactionShipments?.[0]?.status === "SUCCESS"
            ? "CONFIRMED"
            : "PENDING",
        confirmationDetails: data,
      };
    } catch (error) {
      console.error("FedEx booking error:", error);
      return null;
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    const token = await this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const url = `${this.config.baseUrl}/track/v1/trackingnumbers`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          includeDetailedScans: true,
          trackingInfo: [
            {
              trackingNumberInfo: {
                trackingNumber,
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("FedEx tracking error:", error);
      return null;
    }
  }

  /**
   * Convert leg to FedEx quote request
   */
  static legToQuoteRequest(leg: MultimodalLeg): FedExQuoteRequest {
    return {
      origin: {
        address: leg.origin.address,
        city: leg.origin.city,
        state: leg.origin.state,
        postalCode: leg.origin.postalCode || "",
        country: leg.origin.country,
      },
      destination: {
        address: leg.destination.address,
        city: leg.destination.city,
        state: leg.destination.state,
        postalCode: leg.destination.postalCode || "",
        country: leg.destination.country,
      },
      cargo: {
        weight: leg.totalWeight,
        pieces: leg.items?.length || 1,
      },
      serviceType: "EXPRESS",
      deliveryDate: leg.plannedDeparture,
    };
  }
}

/**
 * Get FedEx client instance
 */
export function getFedExClient(): FedExApiClient | null {
  const apiKey = process.env.FEDEX_API_KEY;
  const apiSecret = process.env.FEDEX_API_SECRET;
  const accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;

  if (!apiKey || !apiSecret || !accountNumber) {
    return null;
  }

  return new FedExApiClient({
    apiKey,
    apiSecret,
    accountNumber,
    environment:
      (process.env.FEDEX_ENVIRONMENT as "sandbox" | "production") || "sandbox",
  });
}
