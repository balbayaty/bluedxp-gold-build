/**
 * DHL Express API Client
 *
 * API Documentation: https://developer.dhl.com/
 * Developer Portal: https://developer.dhl.com/api-reference
 * MyDHL API: https://developer.dhl.com/api-reference/my-dhl-api
 *
 * Air freight and express delivery integration
 */

export interface DHLQuoteRequest {
  origin: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  destination: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  packages: Array<{
    weight: number; // kg
    dimensions: {
      length: number; // cm
      width: number; // cm
      height: number; // cm
    };
  }>;
  serviceType?: "EXPRESS" | "ECONOMY" | "EXPRESS_12:00" | "EXPRESS_9:00";
}

export interface DHLQuote {
  quoteId: string;
  service: string;
  cost: {
    amount: number;
    currency: string;
  };
  transitTime: number; // hours
  validUntil: Date;
  terms: string[];
}

export interface DHLBooking {
  shipmentId: string;
  trackingNumber: string;
  status: "CONFIRMED" | "PENDING" | "REJECTED";
  waybillNumber: string;
  estimatedDelivery: Date;
}

export class DHLApiClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string = "https://api.dhl.com";
  private accountNumber: string;

  constructor(apiKey: string, apiSecret: string, accountNumber: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.accountNumber = accountNumber;
  }

  /**
   * Get authentication token
   * API Docs: https://developer.dhl.com/api-reference/my-dhl-api#get-started-section/user-guide--get-access
   */
  private async getAuthToken(): Promise<string> {
    // DHL uses OAuth2
    // See: https://developer.dhl.com/api-reference/my-dhl-api#get-started-section/user-guide--get-access
    const response = await fetch("https://api.dhl.com/auth/accesstoken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.apiKey,
        client_secret: this.apiSecret,
      }),
    });

    if (!response.ok) {
      throw new Error("DHL authentication failed");
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Get quote for shipment
   * API Docs: https://developer.dhl.com/api-reference/my-dhl-api#get-started-section/user-guide--get-access
   * Rate Request API: https://developer.dhl.com/api-reference/my-dhl-api#reference-docs-rate-request
   */
  async getQuote(request: DHLQuoteRequest): Promise<DHLQuote | null> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/myapi/shipment/v1/rates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountNumber: this.accountNumber,
          origin: request.origin,
          destination: request.destination,
          packages: request.packages,
          serviceType: request.serviceType || "EXPRESS",
        }),
      });

      if (!response.ok) {
        console.error("DHL quote request failed:", await response.text());
        return null;
      }

      const data = await response.json();
      return {
        quoteId: data.quoteId,
        service: data.serviceName,
        cost: {
          amount: data.totalPrice,
          currency: data.currency || "USD",
        },
        transitTime: data.transitTimeHours,
        validUntil: new Date(data.validUntil),
        terms: data.terms || [],
      };
    } catch (error) {
      console.error("DHL API error:", error);
      return null;
    }
  }

  /**
   * Book shipment
   * API Docs: https://developer.dhl.com/api-reference/my-dhl-api#reference-docs-shipment-request
   */
  async bookShipment(
    quoteId: string,
    bookingDetails: any,
  ): Promise<DHLBooking | null> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${this.baseUrl}/myapi/shipment/v1/shipments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountNumber: this.accountNumber,
            quoteId,
            ...bookingDetails,
          }),
        },
      );

      if (!response.ok) {
        console.error("DHL booking failed:", await response.text());
        return null;
      }

      const data = await response.json();
      return {
        shipmentId: data.shipmentId,
        trackingNumber: data.trackingNumber,
        status: data.status,
        waybillNumber: data.waybillNumber,
        estimatedDelivery: new Date(data.estimatedDelivery),
      };
    } catch (error) {
      console.error("DHL booking error:", error);
      return null;
    }
  }

  /**
   * Track shipment
   * API Docs: https://developer.dhl.com/api-reference/my-dhl-api#reference-docs-tracking
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${this.baseUrl}/myapi/tracking/v1/tracking`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // @ts-ignore
          params: {
            trackingNumber,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("DHL tracking error:", error);
      return null;
    }
  }
}

let dhlClientInstance: DHLApiClient | null = null;

export function getDHLClient(): DHLApiClient | null {
  if (
    !process.env.DHL_API_KEY ||
    !process.env.DHL_API_SECRET ||
    !process.env.DHL_ACCOUNT_NUMBER
  ) {
    return null;
  }

  if (!dhlClientInstance) {
    dhlClientInstance = new DHLApiClient(
      process.env.DHL_API_KEY,
      process.env.DHL_API_SECRET,
      process.env.DHL_ACCOUNT_NUMBER,
    );
  }

  return dhlClientInstance;
}
